import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
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
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const account = await prisma.lineAccount.findFirst({
      where: {
        id,
        organization: {
          memberships: {
            some: {
              userId: user.id,
              role: { in: ["ADMIN"] },
            },
          },
        },
      },
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
    return NextResponse.json(
      { success: false, error: "แก้ไข LINE Account ไม่สำเร็จ" + e },
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
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const account = await prisma.lineAccount.findFirst({
      where: {
        id,
        organization: {
          memberships: {
            some: {
              userId: user.id,
              role: { in: ["ADMIN"] },
            },
          },
        },
      },
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
    return NextResponse.json(
      { success: false, error: "ลบ LINE Account ไม่สำเร็จ" + e },
      { status: 400 },
    );
  }
}
