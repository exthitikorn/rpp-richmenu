import { NextResponse } from "next/server";

import { LineAccountRequestStatus } from "@/app/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const existing = await prisma.lineAccountRequest.findFirst({
      where: { id, requestedById: user.id },
      select: { id: true, status: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "ไม่พบหรือไม่มีสิทธิ์" },
        { status: 404 },
      );
    }

    if (existing.status !== LineAccountRequestStatus.PENDING) {
      return NextResponse.json(
        { success: false, error: "คำขอนี้ไม่อยู่ในสถานะรออนุมัติ" },
        { status: 409 },
      );
    }

    await prisma.lineAccountRequest.update({
      where: { id },
      data: { status: LineAccountRequestStatus.CANCELLED },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
