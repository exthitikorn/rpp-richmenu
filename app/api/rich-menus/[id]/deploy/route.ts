import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createRichMenu,
  uploadRichMenuImage,
  setDefaultRichMenu,
} from "@/lib/line/client";
import { DeployStatus, RichMenuStatus } from "@/app/generated/prisma/client";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: richMenuId } = await params;

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

    const payload = {
      size: { width: richMenu.width, height: richMenu.height },
      selected: richMenu.isDefault,
      name: richMenu.name,
      areas: richMenu.areas.map((a) => ({
        bounds: { x: a.x, y: a.y, width: a.width, height: a.height },
        action: a.action as Parameters<
          typeof createRichMenu
        >[1]["areas"][0]["action"],
      })),
    };

    const { richMenuId: lineRichMenuId } = await createRichMenu(
      richMenu.lineAccount.accessToken,
      payload as Parameters<typeof createRichMenu>[1],
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

    if (richMenu.isDefault) {
      await setDefaultRichMenu(
        richMenu.lineAccount.accessToken,
        lineRichMenuId,
      );
    }

    await prisma.$transaction([
      prisma.richMenu.update({
        where: { id: richMenu.id },
        data: { lineRichMenuId, status: RichMenuStatus.DEPLOYED },
      }),
      prisma.deployLog.create({
        data: {
          richMenuId: richMenu.id,
          status: DeployStatus.SUCCESS,
          message: `Deployed as ${lineRichMenuId}`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, lineRichMenuId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Deploy ไม่สำเร็จ";
    const richMenu = await prisma.richMenu.findUnique({
      where: { id: richMenuId },
    });

    if (richMenu) {
      await prisma.deployLog.create({
        data: {
          richMenuId: richMenu.id,
          status: DeployStatus.FAILED,
          message: message,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}
