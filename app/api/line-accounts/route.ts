import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSystemAdmin } from "@/lib/access";
import { verifyLineCredentials } from "@/lib/line/verify-credentials";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/secrets";

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

    const verified = await verifyLineCredentials({
      channelId,
      channelSecret,
      accessToken,
    });

    if (!verified.ok) {
      return NextResponse.json(
        { success: false, error: verified.error },
        { status: 400 },
      );
    }

    await prisma.lineAccount.create({
      data: {
        name,
        channelId,
        channelSecret: encryptSecret(channelSecret),
        accessToken: encryptSecret(accessToken),
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

    // Prisma P2002 unique constraint
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { success: false, error: "Channel ID นี้มีในระบบแล้ว" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
