import { NextResponse } from "next/server";
import { z } from "zod";

import { LineAccountRequestStatus } from "@/app/generated/prisma/client";
import { requireSystemAdmin } from "@/lib/access";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  reason: z.string().trim().min(1, "กรุณาระบุเหตุผล"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const admin = await requireSystemAdmin();
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      const msg = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .join(", ");

      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    const existing = await prisma.lineAccountRequest.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing || existing.status !== LineAccountRequestStatus.PENDING) {
      return NextResponse.json(
        { success: false, error: "คำขอนี้ไม่อยู่ในสถานะรออนุมัติ" },
        { status: 409 },
      );
    }

    await prisma.lineAccountRequest.update({
      where: { id },
      data: {
        status: LineAccountRequestStatus.REJECTED,
        rejectionReason: parsed.data.reason,
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "เกิดข้อผิดพลาด";

    if (message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (message === "Forbidden: system admin required") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
