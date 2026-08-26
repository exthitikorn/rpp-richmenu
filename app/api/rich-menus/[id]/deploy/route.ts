import type { LineRichMenuPayload } from "@/lib/line/types";

import { readFile } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

import { richMenuByIdWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createRichMenu,
  uploadRichMenuImage,
  ensureRichMenuAlias,
  deleteRichMenu,
} from "@/lib/line/client";
import {
  syncDefaultHint,
  syncDefaultRichMenu,
} from "@/lib/line/sync-default-rich-menu";
import { normalizeRichMenuAction } from "@/lib/line/types";
import { getRichMenuAliasId } from "@/lib/richmenu/alias";
import { decryptSecret } from "@/lib/secrets";
import { isAllowedTrackingTarget } from "@/lib/auth-redirect";
import { signTrackingTarget } from "@/lib/tracking-redirect";
import { DeployStatus, RichMenuStatus } from "@/app/generated/prisma/client";

/** ตัดข้อความให้ไม่เกิน maxBytes (UTF-8) สำหรับคอลัมน์ message ใน MySQL */
function truncateMessageToBytes(text: string, maxBytes: number): string {
  const encoder = new TextEncoder();

  if (encoder.encode(text).length <= maxBytes) return text;
  for (let len = text.length; len > 0; len--) {
    const s = text.slice(0, len);

    if (encoder.encode(s).length <= maxBytes) return s;
  }

  return "";
}

/** Resolve /uploads/... under a fixed root; reject path traversal. */
function resolveUnderRoot(rootDir: string, imageUrl: string): string | null {
  if (!imageUrl.startsWith("/uploads/")) return null;
  const root = path.resolve(rootDir);
  const resolved = path.resolve(root, imageUrl.slice(1));

  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;

  return resolved;
}

async function readLocalUploadImage(
  imageUrl: string,
): Promise<{ buffer: ArrayBuffer; contentType: "image/jpeg" | "image/png" }> {
  const storagePath = resolveUnderRoot(
    path.join(process.cwd(), "storage"),
    imageUrl,
  );
  const legacyPath = resolveUnderRoot(
    path.join(process.cwd(), "public"),
    imageUrl,
  );

  if (!storagePath || !legacyPath) {
    throw new Error("พาธรูปไม่ถูกต้อง");
  }

  let fileBuffer: Buffer;

  try {
    fileBuffer = await readFile(storagePath);
  } catch {
    fileBuffer = await readFile(legacyPath);
  }

  // Copy into a standalone ArrayBuffer (Buffer.buffer may be SharedArrayBuffer-typed)
  const bytes = new Uint8Array(fileBuffer.byteLength);

  bytes.set(fileBuffer);

  return {
    buffer: bytes.buffer,
    contentType: imageUrl.endsWith(".png") ? "image/png" : "image/jpeg",
  };
}

async function bestEffortDeleteLineRichMenu(
  accessToken: string,
  lineRichMenuId: string,
): Promise<void> {
  try {
    await deleteRichMenu(accessToken, lineRichMenuId);
  } catch {
    // orphan cleanup / already deleted
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: richMenuId } = await params;
  const requestUrl = new URL(request.url);
  const origin = process.env.NEXTAUTH_URL
    ? new URL(process.env.NEXTAUTH_URL).origin
    : requestUrl.origin;

  let accessTokenForCleanup: string | null = null;
  let createdLineRichMenuId: string | null = null;
  let dbCommitted = false;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const richMenu = await prisma.richMenu.findFirst({
      where: richMenuByIdWhere(user, richMenuId),
      include: {
        areas: { orderBy: { order: "asc" } },
        lineAccount: true,
      },
    });

    if (!richMenu) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ Rich Menu" },
        { status: 404 },
      );
    }

    if (!richMenu.imageUrl?.startsWith("/uploads/")) {
      await prisma.deployLog.create({
        data: {
          richMenuId: richMenu.id,
          status: DeployStatus.FAILED,
          message: "พาธรูปไม่รองรับ (ต้องเป็น /uploads/...)",
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: "พาธรูปไม่รองรับ (ต้องเป็น /uploads/...)",
        },
        { status: 400 },
      );
    }

    let imageBuffer: ArrayBuffer;
    let contentType: "image/jpeg" | "image/png";

    try {
      ({ buffer: imageBuffer, contentType } = await readLocalUploadImage(
        richMenu.imageUrl,
      ));
    } catch {
      await prisma.deployLog.create({
        data: {
          richMenuId: richMenu.id,
          status: DeployStatus.FAILED,
          message: "อ่านรูปไม่สำเร็จ",
        },
      });

      return NextResponse.json(
        { success: false, error: "อ่านรูปไม่สำเร็จ" },
        { status: 400 },
      );
    }

    const accessToken = decryptSecret(richMenu.lineAccount.accessToken);

    accessTokenForCleanup = accessToken;

    const payload: LineRichMenuPayload = {
      size: { width: richMenu.width, height: richMenu.height },
      selected: richMenu.isDefault,
      name: richMenu.name,
      chatBarText:
        richMenu.chatBarText || richMenu.name?.slice(0, 14) || "เมนู",
      areas: richMenu.areas.map((a, index) => {
        const rawAction = (a.action as Record<string, unknown>) ?? {};

        // URI ที่ track ได้ (http/https/tel/mailto) → ห่อ tracking URL
        if (a.actionType === "uri") {
          const raw = rawAction as Record<string, string | undefined>;
          const target = raw.uri ?? "";

          if (isAllowedTrackingTarget(target)) {
            const trackingParts = {
              channelId: richMenu.lineAccount.channelId,
              richMenuId: richMenu.id,
              areaIndex: String(index),
              target,
            };
            const searchParams = new URLSearchParams({
              ...trackingParts,
              sig: signTrackingTarget(trackingParts),
            });
            const trackingUrl = `${origin}/api/rich-menus/redirect?${searchParams.toString()}`;
            const mergedAction = { ...rawAction, uri: trackingUrl };

            return {
              bounds: { x: a.x, y: a.y, width: a.width, height: a.height },
              action: normalizeRichMenuAction(a.actionType, mergedAction),
            };
          }
        }

        return {
          bounds: { x: a.x, y: a.y, width: a.width, height: a.height },
          action: normalizeRichMenuAction(a.actionType, rawAction),
        };
      }),
    };

    const { richMenuId: lineRichMenuId } = await createRichMenu(
      accessToken,
      payload,
    );

    createdLineRichMenuId = lineRichMenuId;

    await uploadRichMenuImage(
      accessToken,
      lineRichMenuId,
      imageBuffer,
      contentType === "image/png" ? "image/png" : "image/jpeg",
    );

    const aliasId = getRichMenuAliasId(richMenu.id);

    await ensureRichMenuAlias(
      accessToken,
      aliasId,
      lineRichMenuId,
      richMenu.name ?? undefined,
    );

    const oldLineRichMenuId = richMenu.lineRichMenuId ?? null;

    // Commit DB before LINE default sync so a sync failure never needs orphan-delete
    // of a menu that is already the live default.
    await prisma.$transaction([
      prisma.richMenu.update({
        where: { id: richMenu.id },
        data: {
          lineRichMenuId,
          status: RichMenuStatus.DEPLOYED,
          isDefault: true,
        },
      }),
      prisma.richMenu.updateMany({
        where: {
          lineAccountId: richMenu.lineAccountId,
          id: { not: richMenu.id },
        },
        data: { isDefault: false },
      }),
      prisma.deployLog.create({
        data: {
          richMenuId: richMenu.id,
          status: DeployStatus.SUCCESS,
          message: `Deployed as ${lineRichMenuId}`,
        },
      }),
    ]);
    dbCommitted = true;

    if (oldLineRichMenuId && oldLineRichMenuId !== lineRichMenuId) {
      await bestEffortDeleteLineRichMenu(accessToken, oldLineRichMenuId);
    }

    try {
      const sync = await syncDefaultRichMenu(accessToken, lineRichMenuId, {
        extraUserIds: [user.lineUserId],
      });

      return NextResponse.json({
        success: true,
        lineRichMenuId,
        followerSync: sync.followerSync,
        hint: syncDefaultHint(sync),
      });
    } catch (syncErr) {
      const syncMessage =
        syncErr instanceof Error ? syncErr.message : "ตั้ง default ไม่สำเร็จ";

      return NextResponse.json({
        success: true,
        lineRichMenuId,
        followerSync: "unavailable" as const,
        hint: `Deploy สำเร็จ แต่ตั้ง default บน LINE ไม่ครบ — กดตั้ง Default อีกครั้ง (${syncMessage})`,
      });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Deploy ไม่สำเร็จ";

    // Only delete LINE menu if DB never recorded it (pre-commit failure)
    if (!dbCommitted && createdLineRichMenuId && accessTokenForCleanup) {
      await bestEffortDeleteLineRichMenu(
        accessTokenForCleanup,
        createdLineRichMenuId,
      );
    }

    const logMessage = truncateMessageToBytes(message, 191);
    const richMenu = await prisma.richMenu.findFirst({
      where: { id: richMenuId },
      select: { id: true },
    });

    if (richMenu) {
      await prisma.deployLog.create({
        data: {
          richMenuId: richMenu.id,
          status: DeployStatus.FAILED,
          message: logMessage || "Deploy ไม่สำเร็จ",
        },
      });
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}
