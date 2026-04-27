import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";

const bodySchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อ"),
  slug: z
    .string()
    .min(1, "กรุณาระบุ slug")
    .regex(/^[a-z0-9-]+$/, "slug ใช้ได้เฉพาะ a-z, 0-9, -"),
});

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const isAdmin = user.memberships.some(
      (membership) => membership.role === Role.ADMIN,
    );
    const organizations = await prisma.organization.findMany({
      where: isAdmin
        ? undefined
        : { memberships: { some: { userId: user.id } } },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: organizations });
  } catch {
    return NextResponse.json(
      { success: false, error: "ไม่สามารถดึงรายการหน่วยงานได้" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
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
    const { name, slug } = parsed.data;
    const existing = await prisma.organization.findUnique({ where: { slug } });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "slug นี้ถูกใช้แล้ว" },
        { status: 400 },
      );
    }
    const org = await prisma.organization.create({
      data: {
        name,
        slug,
        memberships: {
          create: { userId: user.id, role: Role.USER },
        },
      },
    });

    return NextResponse.json({ success: true, id: org.id });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาด" + e },
      { status: 500 },
    );
  }
}
