import { NextResponse } from "next/server";

import { LineAccountRequestStatus } from "@/app/generated/prisma/client";
import { requireSystemAdmin } from "@/lib/access";
import { findDuplicateChannelIdError } from "@/lib/line-account-request";
import { fetchLineAccountProfile } from "@/lib/line/bot-profile";
import { verifyLineCredentials } from "@/lib/line/verify-credentials";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/secrets";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const admin = await requireSystemAdmin();

    const existing = await prisma.lineAccountRequest.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        channelId: true,
        channelSecret: true,
        accessToken: true,
        status: true,
        requestedById: true,
      },
    });

    if (!existing || existing.status !== LineAccountRequestStatus.PENDING) {
      return NextResponse.json(
        { success: false, error: "คำขอนี้ไม่อยู่ในสถานะรออนุมัติ" },
        { status: 409 },
      );
    }

    const channelSecret = decryptSecret(existing.channelSecret);
    const accessToken = decryptSecret(existing.accessToken);

    const verified = await verifyLineCredentials({
      channelId: existing.channelId,
      channelSecret,
      accessToken,
    });

    if (!verified.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "credential ไม่ถูกต้องหรือหมดอายุ — ปฏิเสธคำขอแทน",
        },
        { status: 400 },
      );
    }

    const duplicateError = await findDuplicateChannelIdError(
      existing.channelId,
      existing.id,
    );

    if (duplicateError) {
      return NextResponse.json(
        { success: false, error: duplicateError },
        { status: 409 },
      );
    }

    let profile;

    try {
      profile = await fetchLineAccountProfile(accessToken);
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "ไม่สามารถดึงข้อมูลโปรไฟล์จาก LINE ได้";

      return NextResponse.json(
        { success: false, error: message },
        { status: 400 },
      );
    }

    const lineAccountId = await prisma.$transaction(async (tx) => {
      const dup = await findDuplicateChannelIdError(
        existing.channelId,
        existing.id,
        tx,
      );

      if (dup) throw new Error(`duplicate:${dup}`);

      const account = await tx.lineAccount.create({
        data: {
          name: profile.name,
          pictureUrl: profile.pictureUrl,
          channelId: existing.channelId,
          channelSecret: encryptSecret(channelSecret),
          accessToken: encryptSecret(accessToken),
        },
        select: { id: true },
      });

      await tx.lineAccountAssignment.create({
        data: {
          userId: existing.requestedById,
          lineAccountId: account.id,
        },
      });

      await tx.lineAccountRequest.update({
        where: { id: existing.id },
        data: {
          status: LineAccountRequestStatus.APPROVED,
          lineAccountId: account.id,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
      });

      return account.id;
    });

    return NextResponse.json({ success: true, lineAccountId });
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

    if (message.startsWith("duplicate:")) {
      return NextResponse.json(
        { success: false, error: message.slice("duplicate:".length) },
        { status: 409 },
      );
    }

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
