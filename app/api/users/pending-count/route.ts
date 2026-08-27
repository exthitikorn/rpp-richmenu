import { NextResponse } from "next/server";

import { requireSystemAdmin } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireSystemAdmin();

    const count = await prisma.user.count({ where: { isApproved: false } });

    return NextResponse.json({ success: true, data: { count } });
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
      { success: false, error: "ไม่สามารถดึงจำนวนผู้ใช้รออนุมัติได้" },
      { status: 500 },
    );
  }
}
