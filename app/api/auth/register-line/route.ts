import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  name: z.string().min(1, "กรุณากรอกชื่อ"),
  password: z.string().min(6, "รหัสผ่านอย่างน้อย 6 ตัว"),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
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

      return NextResponse.json(
        { success: false, error: msg || "ข้อมูลไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const { email, name, password } = parsed.data;

    const existingByEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingByEmail && existingByEmail.id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "อีเมลนี้ถูกใช้งานแล้ว" },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        email,
        name,
        passwordHash: await bcrypt.hash(password, 10),
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "ไม่สามารถบันทึกข้อมูลได้" },
      { status: 500 },
    );
  }
}
