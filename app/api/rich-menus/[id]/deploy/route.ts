import type { LineRichMenuPayload } from "@/lib/line/types";

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createRichMenu,
  uploadRichMenuImage,
  clearDefaultRichMenu,
  setDefaultRichMenu,
  ensureRichMenuAlias,
  getFollowerIds,
  bulkUnlinkRichMenuFromUsers,
  bulkLinkRichMenuToUsers,
  deleteRichMenu,
} from "@/lib/line/client";
import { normalizeRichMenuAction } from "@/lib/line/types";
import { getRichMenuAliasId } from "@/lib/rich-menu/alias";
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: richMenuId } = await params;
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const richMenu = await prisma.richMenu.findFirst({
      where: {
        id: richMenuId,
        lineAccount: {
          organization: { memberships: { some: { userId: user.id } } },
        },
      },
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

    const payload: LineRichMenuPayload = {
      size: { width: richMenu.width, height: richMenu.height },
      selected: richMenu.isDefault,
      name: richMenu.name,
      chatBarText: richMenu.name?.slice(0, 14) || "เมนู",
      areas: richMenu.areas.map((a, index) => {
        const rawAction = (a.action as Record<string, unknown>) ?? {};

        // ถ้าเป็น URI ให้ห่อเป็น tracking URL เพื่อเก็บ ClickEvent
        if (a.actionType === "uri") {
          const raw = rawAction as Record<string, string | undefined>;
          const target = raw.uri ?? "";
          const searchParams = new URLSearchParams({
            channelId: richMenu.lineAccount.channelId,
            richMenuId: richMenu.id,
            areaIndex: String(index),
            target,
          });
          const trackingUrl = `${origin}/api/rich-menus/redirect?${searchParams.toString()}`;
          const mergedAction = { ...rawAction, uri: trackingUrl };

          return {
            bounds: { x: a.x, y: a.y, width: a.width, height: a.height },
            action: normalizeRichMenuAction(a.actionType, mergedAction),
          };
        }

        return {
          bounds: { x: a.x, y: a.y, width: a.width, height: a.height },
          action: normalizeRichMenuAction(a.actionType, rawAction),
        };
      }),
    };

    const { richMenuId: lineRichMenuId } = await createRichMenu(
      richMenu.lineAccount.accessToken,
      payload,
    );

    const imageRes = await fetch(richMenu.imageUrl);

    if (!imageRes.ok) {
      await prisma.deployLog.create({
        data: {
          richMenuId: richMenu.id,
          status: DeployStatus.FAILED,
          message: "ดาวน์โหลดรูปไม่สำเร็จ",
        },
      });

      return NextResponse.json(
        { success: false, error: "ดาวน์โหลดรูปไม่สำเร็จ" },
        { status: 400 },
      );
    }
    const imageBuffer = await imageRes.arrayBuffer();
    const contentType = (imageRes.headers.get("content-type") ??
      "image/jpeg") as "image/jpeg" | "image/png";

    await uploadRichMenuImage(
      richMenu.lineAccount.accessToken,
      lineRichMenuId,
      imageBuffer,
      contentType === "image/png" ? "image/png" : "image/jpeg",
    );

    const aliasId = getRichMenuAliasId(richMenu.id);

    await ensureRichMenuAlias(
      richMenu.lineAccount.accessToken,
      aliasId,
      lineRichMenuId,
      richMenu.name ?? undefined,
    );

    const token = richMenu.lineAccount.accessToken;
    const oldLineRichMenuId = richMenu.lineRichMenuId ?? null;
    let followerIds: string[] = [];

    try {
      followerIds = await getFollowerIds(token);
      const chunkSize = 500;

      for (let i = 0; i < followerIds.length; i += chunkSize) {
        const chunk = followerIds.slice(i, i + chunkSize);

        await bulkUnlinkRichMenuFromUsers(token, chunk);
      }
    } catch {
      // getFollowerIds / bulkUnlink ใช้ได้กับ verified หรือ premium OA เท่านั้น
    }

    await clearDefaultRichMenu(token);
    await setDefaultRichMenu(token, lineRichMenuId);

    if (followerIds.length > 0) {
      try {
        const chunkSize = 500;

        for (let i = 0; i < followerIds.length; i += chunkSize) {
          const chunk = followerIds.slice(i, i + chunkSize);

          await bulkLinkRichMenuToUsers(token, lineRichMenuId, chunk);
        }
      } catch {
        // bulkLink อาจล้มได้ถ้า OA จำกัด
      }
    }

    await prisma.$transaction([
      prisma.richMenu.update({
        where: { id: richMenu.id },
        data: {
          lineRichMenuId,
          status: RichMenuStatus.DEPLOYED,
          isDefault: true,
        },
      }),
      prisma.deployLog.create({
        data: {
          richMenuId: richMenu.id,
          status: DeployStatus.SUCCESS,
          message: `Deployed as ${lineRichMenuId}`,
        },
      }),
    ]);

    if (oldLineRichMenuId) {
      try {
        await deleteRichMenu(token, oldLineRichMenuId);
      } catch {
        // เมนูเก่าอาจถูกลบไปแล้วหรือไม่มีสิทธิ์
      }
    }

    return NextResponse.json({
      success: true,
      lineRichMenuId,
      hint: "ถ้าแอป LINE ยังไม่เปลี่ยน ลองปิดแอปแล้วเปิดใหม่ หรือปิดแชทแล้วเปิดใหม่",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Deploy ไม่สำเร็จ";
    const richMenu = await prisma.richMenu.findUnique({
      where: { id: richMenuId },
    });

    const logMessage = truncateMessageToBytes(message, 191);

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
