import { NextResponse } from "next/server";

import { lineAccountByIdWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRichMenuAliasId } from "@/lib/richmenu/alias";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const lineAccountId = url.searchParams.get("lineAccountId");

    if (!lineAccountId) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุ lineAccountId" },
        { status: 400 },
      );
    }

    const lineAccount = await prisma.lineAccount.findFirst({
      where: lineAccountByIdWhere(user, lineAccountId),
      select: { id: true },
    });

    if (!lineAccount) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ LINE Account หรือไม่มีสิทธิ์" },
        { status: 404 },
      );
    }

    const richMenus = await prisma.richMenu.findMany({
      where: {
        lineAccountId: lineAccount.id,
      },
      select: {
        id: true,
        name: true,
        lineAccount: {
          select: { name: true },
        },
      },
      orderBy: [{ lineAccount: { name: "asc" } }, { name: "asc" }],
    });

    return NextResponse.json({
      success: true,
      aliases: richMenus.map((menu) => ({
        richMenuId: menu.id,
        aliasId: getRichMenuAliasId(menu.id),
        name: menu.name,
        lineAccountName: menu.lineAccount.name,
      })),
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "โหลด Rich Menu Alias ไม่สำเร็จ";

    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}
