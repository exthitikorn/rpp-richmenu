import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  password: z.string().min(6, "รหัสผ่านอย่างน้อย 6 ตัว"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const { email, name, password } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "อีเมลนี้ถูกใช้งานแล้ว" },
        { status: 400 },
      );
    }
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { email, name: name ?? null, passwordHash },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[POST /api/auth/register]", e);
    }
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
