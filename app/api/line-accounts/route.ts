import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  organizationId: z.string().cuid(),
  name: z.string().min(1, "กรุณาระบุชื่อ"),
  channelId: z.string().min(1, "กรุณาระบุ Channel ID"),
  channelSecret: z.string().min(1, "กรุณาระบุ Channel Secret"),
  accessToken: z.string().min(1, "กรุณาระบุ Access Token"),
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
    const { organizationId, name, channelId, channelSecret, accessToken } =
      parsed.data;

    await requireRole(organizationId, ["OWNER", "ADMIN"]);

    await prisma.lineAccount.create({
      data: {
        organizationId,
        name,
        channelId,
        channelSecret,
        accessToken,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
