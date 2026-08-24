import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSystemAdmin } from "@/lib/access";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อ"),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await requireSystemAdmin();

    const account = await prisma.lineAccount.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ LINE Account หรือไม่มีสิทธิ์" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      const msg = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .join(", ");

      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    const { name } = parsed.data;

    await prisma.lineAccount.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "แก้ไข LINE Account ไม่สำเร็จ";

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
      { success: false, error: "แก้ไข LINE Account ไม่สำเร็จ" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await requireSystemAdmin();

    const account = await prisma.lineAccount.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            richMenus: true,
            clickEvents: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ LINE Account หรือไม่มีสิทธิ์" },
        { status: 404 },
      );
    }

    if (account._count.richMenus > 0 || account._count.clickEvents > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่สามารถลบได้ เนื่องจากยังมี Rich Menus หรือ Click Events ที่ผูกกับ LINE Account นี้",
        },
        { status: 400 },
      );
    }

    await prisma.lineAccount.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "ลบ LINE Account ไม่สำเร็จ";

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
      { success: false, error: "ลบ LINE Account ไม่สำเร็จ" },
      { status: 400 },
    );
  }
}
