import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createUserSchema = z.object({
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  name: z.string().optional(),
  password: z
    .string()
    .min(6, "รหัสผ่านอย่างน้อย 6 ตัว")
    .optional()
    .or(z.literal("")),
  isApproved: z.boolean().optional(),
});

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const isOwner = currentUser.memberships.some((m) => m.role === "OWNER");

    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        memberships: {
          include: {
            organization: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: users });
  } catch {
    return NextResponse.json(
      { success: false, error: "ไม่สามารถดึงรายการผู้ใช้ได้" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const isOwner = currentUser.memberships.some((m) => m.role === "OWNER");

    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      const msg = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .join(", ");

      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    const { email, name, password, isApproved } = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "อีเมลนี้ถูกใช้งานแล้ว" },
        { status: 400 },
      );
    }

    const passwordHash =
      password && password.length > 0
        ? await (await import("bcryptjs")).default.hash(password, 10)
        : null;

    const user = await prisma.user.create({
      data: {
        email,
        name: name ?? null,
        passwordHash,
        isApproved: isApproved ?? false,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch {
    return NextResponse.json(
      { success: false, error: "ไม่สามารถสร้างผู้ใช้ได้" },
      { status: 500 },
    );
  }
}
