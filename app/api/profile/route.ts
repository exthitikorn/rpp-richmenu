import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateProfileSchema = z.object({
  name: z.string().max(191).optional(),
});

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      const msg = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .join(", ");

      return NextResponse.json(
        { success: false, error: msg || "ข้อมูลไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const { name } = parsed.data;

    const data: Record<string, unknown> = {};

    if (typeof name !== "undefined") {
      data.name = name.trim() === "" ? null : name.trim();
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, error: "ไม่มีข้อมูลที่ต้องอัปเดต" },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "ไม่สามารถอัปเดตโปรไฟล์ได้" },
      { status: 500 },
    );
  }
}
