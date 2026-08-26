import { NextResponse } from "next/server";

import { richMenuByIdWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  syncDefaultHint,
  syncDefaultRichMenu,
} from "@/lib/line/sync-default-rich-menu";
import { decryptSecret } from "@/lib/secrets";

/**
 * ตั้ง Rich Menu นี้เป็น Default บน LINE (เมนูแรกที่ผู้ใช้เห็น)
 * ต้อง Deploy แล้วและมี lineRichMenuId จึงจะตั้งได้
 */
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
      where: richMenuByIdWhere(user, richMenuId),
      include: { lineAccount: true },
    });

    if (!richMenu) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ Rich Menu" },
        { status: 404 },
      );
    }

    if (!richMenu.lineRichMenuId) {
      return NextResponse.json(
        {
          success: false,
          error: "ต้อง Deploy ไป LINE ก่อนถึงจะตั้งเป็น Default ได้",
        },
        { status: 400 },
      );
    }

    const token = decryptSecret(richMenu.lineAccount.accessToken);

    await prisma.$transaction([
      prisma.richMenu.update({
        where: { id: richMenu.id },
        data: { isDefault: true },
      }),
      prisma.richMenu.updateMany({
        where: {
          lineAccountId: richMenu.lineAccountId,
          id: { not: richMenu.id },
        },
        data: { isDefault: false },
      }),
    ]);

    try {
      const sync = await syncDefaultRichMenu(token, richMenu.lineRichMenuId, {
        extraUserIds: [user.lineUserId],
      });

      return NextResponse.json({
        success: true,
        followerSync: sync.followerSync,
        hint: syncDefaultHint(sync),
      });
    } catch (syncErr) {
      const syncMessage =
        syncErr instanceof Error ? syncErr.message : "ตั้ง Default ไม่สำเร็จ";

      return NextResponse.json({
        success: true,
        followerSync: "unavailable" as const,
        hint: `บันทึกในระบบแล้ว แต่ตั้ง default บน LINE ไม่ครบ — ลองอีกครั้ง (${syncMessage})`,
      });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "ตั้ง Default ไม่สำเร็จ";

    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}
