import { NextResponse } from "next/server";
import { z } from "zod";

import { LineAccountRequestStatus } from "@/app/generated/prisma/client";
import { isSystemAdmin } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import {
  findDuplicateChannelIdError,
  lineAccountRequestPublicSelect,
} from "@/lib/line-account-request";
import { fetchLineAccountProfile } from "@/lib/line/bot-profile";
import { verifyLineCredentials } from "@/lib/line/verify-credentials";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/secrets";

const lineAccountRequestBodySchema = z.object({
  channelId: z.string().min(1, "กรุณาระบุ Channel ID"),
  channelSecret: z.string().min(1, "กรุณาระบุ Channel Secret"),
  accessToken: z.string().min(1, "กรุณาระบุ Access Token"),
});

const requesterSelect = {
  id: true,
  name: true,
  email: true,
  ldapUsername: true,
} as const;

function apiError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) return apiError("Unauthorized", 401);

    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status");

    if (statusParam === LineAccountRequestStatus.PENDING) {
      if (!isSystemAdmin(user)) return apiError("Forbidden", 403);

      const [requests, count] = await Promise.all([
        prisma.lineAccountRequest.findMany({
          where: { status: LineAccountRequestStatus.PENDING },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            ...lineAccountRequestPublicSelect,
            requestedBy: { select: requesterSelect },
          },
        }),
        prisma.lineAccountRequest.count({
          where: { status: LineAccountRequestStatus.PENDING },
        }),
      ]);

      return NextResponse.json({ success: true, requests, count });
    }

    const requests = await prisma.lineAccountRequest.findMany({
      where: { requestedById: user.id },
      orderBy: { createdAt: "desc" },
      select: lineAccountRequestPublicSelect,
    });

    return NextResponse.json({ success: true, requests });
  } catch {
    return apiError("เกิดข้อผิดพลาด", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) return apiError("Unauthorized", 401);

    const body = await request.json();
    const parsed = lineAccountRequestBodySchema.safeParse(body);

    if (!parsed.success) {
      const msg = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .join(", ");

      return apiError(msg, 400);
    }

    const { channelId, channelSecret, accessToken } = parsed.data;

    const duplicateError = await findDuplicateChannelIdError(channelId);

    if (duplicateError) return apiError(duplicateError, 409);

    const verified = await verifyLineCredentials({
      channelId,
      channelSecret,
      accessToken,
    });

    if (!verified.ok) return apiError(verified.error, 400);

    let profile;

    try {
      profile = await fetchLineAccountProfile(accessToken);
    } catch (e) {
      return apiError(
        e instanceof Error
          ? e.message
          : "ไม่สามารถดึงข้อมูลโปรไฟล์จาก LINE ได้",
        400,
      );
    }

    const created = await prisma.lineAccountRequest.create({
      data: {
        name: profile.name,
        channelId,
        channelSecret: encryptSecret(channelSecret),
        accessToken: encryptSecret(accessToken),
        requestedById: user.id,
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true, id: created.id });
  } catch {
    return apiError("เกิดข้อผิดพลาด", 500);
  }
}
