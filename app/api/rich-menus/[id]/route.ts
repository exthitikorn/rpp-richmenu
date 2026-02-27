import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteRichMenu } from "@/lib/line/client";

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

    const richMenu = await prisma.richMenu.findFirst({
      where: {
        id,
        lineAccount: {
          organization: { memberships: { some: { userId: user.id } } },
        },
      },
      select: { id: true },
    });

    if (!richMenu) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ Rich Menu หรือไม่มีสิทธิ์" },
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

    await prisma.richMenu.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "แก้ไข Rich Menu ไม่สำเร็จ" },
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

    const richMenu = await prisma.richMenu.findFirst({
      where: {
        id,
        lineAccount: {
          organization: { memberships: { some: { userId: user.id } } },
        },
      },
      include: {
        lineAccount: true,
        _count: {
          select: {
            areas: true,
            deployLogs: true,
            clickEvents: true,
          },
        },
      },
    });

    if (!richMenu) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ Rich Menu หรือไม่มีสิทธิ์" },
        { status: 404 },
      );
    }

    if (
      richMenu._count.areas > 0 ||
      richMenu._count.deployLogs > 0 ||
      richMenu._count.clickEvents > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่สามารถลบได้ เนื่องจากยังมี Areas, Deploy Logs หรือ Click Events ที่ผูกกับ Rich Menu นี้",
        },
        { status: 400 },
      );
    }

    if (richMenu.lineRichMenuId) {
      try {
        await deleteRichMenu(
          richMenu.lineAccount.accessToken,
          richMenu.lineRichMenuId,
        );
      } catch {
        // ถ้าลบบน LINE ไม่สำเร็จ ให้ลบในระบบต่อไป แต่ไม่ fail ทั้งคำขอ
      }
    }

    await prisma.richMenu.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "ลบ Rich Menu ไม่สำเร็จ" },
      { status: 400 },
    );
  }
}
