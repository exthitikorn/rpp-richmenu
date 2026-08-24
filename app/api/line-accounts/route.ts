import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSystemAdmin } from "@/lib/access";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อ"),
  channelId: z.string().min(1, "กรุณาระบุ Channel ID"),
  channelSecret: z.string().min(1, "กรุณาระบุ Channel Secret"),
  accessToken: z.string().min(1, "กรุณาระบุ Access Token"),
});

export async function POST(request: Request) {
  try {
    await requireSystemAdmin();
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      const msg = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .join(", ");

      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }
    const { name, channelId, channelSecret, accessToken } = parsed.data;

    await prisma.lineAccount.create({
      data: {
        name,
        channelId,
        channelSecret,
        accessToken,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "เกิดข้อผิดพลาด";

    if (message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (message === "Forbidden: system admin required") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
