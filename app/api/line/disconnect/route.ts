import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!user.lineUserId) {
      return NextResponse.json(
        { success: false, error: "ยังไม่ได้เชื่อมต่อ LINE" },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lineUserId: null,
        lineDisplayName: null,
        linePictureUrl: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "ไม่สามารถยกเลิกการเชื่อมต่อ LINE ได้" },
      { status: 500 },
    );
  }
}
