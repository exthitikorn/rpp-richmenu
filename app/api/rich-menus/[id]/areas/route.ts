import type { Prisma } from "@/app/generated/prisma/client";

import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const areaSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  order: z.number(),
  actionType: z.string(),
  action: z.record(z.string(), z.unknown()),
});

const bodySchema = z.object({
  areas: z.array(areaSchema),
});

export async function PUT(
  request: Request,
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
    });

    if (!richMenu) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ Rich Menu" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "รูปแบบ areas ไม่ถูกต้อง" },
        { status: 400 },
      );
    }
    const { areas } = parsed.data;

    await prisma.$transaction([
      prisma.richMenuArea.deleteMany({ where: { richMenuId } }),
      prisma.richMenuArea.createMany({
        data: areas.map((a) => ({
          richMenuId,
          x: a.x,
          y: a.y,
          width: a.width,
          height: a.height,
          order: a.order,
          actionType: a.actionType,
          action: a.action as Prisma.InputJsonValue,
        })),
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "บันทึกไม่สำเร็จ" },
      { status: 500 },
    );
  }
}
