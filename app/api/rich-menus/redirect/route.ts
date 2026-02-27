import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const channelId = url.searchParams.get("channelId");
  const richMenuId = url.searchParams.get("richMenuId");
  const areaIndex = url.searchParams.get("areaIndex");
  const target = url.searchParams.get("target");

  const fallbackUrl =
    target && target.trim() !== "" ? target : "https://line.me/";

  if (!channelId || !richMenuId || !areaIndex) {
    return NextResponse.redirect(fallbackUrl, { status: 302 });
  }

  const index = Number.parseInt(areaIndex, 10);

  if (Number.isNaN(index) || index < 0) {
    return NextResponse.redirect(fallbackUrl, { status: 302 });
  }

  try {
    const lineAccount = await prisma.lineAccount.findFirst({
      where: { channelId },
      select: { id: true },
    });

    if (lineAccount) {
      await prisma.clickEvent.create({
        data: {
          lineAccountId: lineAccount.id,
          richMenuId,
          areaIndex: index,
          // เคส URI ไม่รู้ว่าเป็น user ไหน จึงเก็บเป็น anonymous ไว้สำหรับนับจำนวนรวม
          lineUserId: "anonymous",
        },
      });
    }
  } catch {
    // ไม่ให้ logging error ขัดขวางการ redirect ไปยังปลายทางจริง
  }

  return NextResponse.redirect(fallbackUrl, { status: 302 });
}
