import { NextResponse } from "next/server";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อ"),
  slug: z
    .string()
    .min(1, "กรุณาระบุ slug")
    .regex(/^[a-z0-9-]+$/, "slug ใช้ได้เฉพาะ a-z, 0-9, -"),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await requireRole(id, ["OWNER", "ADMIN"]);

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      const msg = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .join(", ");

      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    const { name, slug } = parsed.data;

    const existingWithSlug = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existingWithSlug && existingWithSlug.id !== id) {
      return NextResponse.json(
        { success: false, error: "slug นี้ถูกใช้แล้ว" },
        { status: 400 },
      );
    }

    await prisma.organization.update({
      where: { id },
      data: { name, slug },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const message =
      e instanceof Error && e.message ? e.message : "แก้ไขหน่วยงานไม่สำเร็จ";

    const status =
      message.startsWith("Unauthorized") || message.startsWith("Forbidden")
        ? 403
        : 400;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await requireRole(id, ["OWNER"]);

    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: { select: { lineAccounts: true } },
      },
    });

    if (!org) {
      return NextResponse.json(
        { success: false, error: "ไม่พบบันทึกหน่วยงาน" },
        { status: 404 },
      );
    }

    if (org._count.lineAccounts > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่สามารถลบได้ เนื่องจากยังมี LINE Accounts อยู่ในหน่วยงานนี้",
        },
        { status: 400 },
      );
    }

    await prisma.organization.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e) {
    const message =
      e instanceof Error && e.message ? e.message : "ลบหน่วยงานไม่สำเร็จ";

    const status =
      message.startsWith("Unauthorized") || message.startsWith("Forbidden")
        ? 403
        : 400;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
