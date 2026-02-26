import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clearDefaultRichMenu, setDefaultRichMenu } from "@/lib/line/client";

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
      where: {
        id: richMenuId,
        lineAccount: {
          organization: { memberships: { some: { userId: user.id } } },
        },
      },
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

    const token = richMenu.lineAccount.accessToken;

    await clearDefaultRichMenu(token);
    await setDefaultRichMenu(token, richMenu.lineRichMenuId);

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

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "ตั้ง Default ไม่สำเร็จ";

    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}
