import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { Role } from "@/app/generated/prisma/client";

const bodySchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อ"),
  slug: z
    .string()
    .min(1, "กรุณาระบุ slug")
    .regex(/^[a-z0-9-]+$/, "slug ใช้ได้เฉพาะ a-z, 0-9, -"),
});

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
    const prisma = await getPrisma();
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
          create: { userId: user.id, role: Role.OWNER },
        },
      },
    });

    return NextResponse.json({ success: true, id: org.id });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
