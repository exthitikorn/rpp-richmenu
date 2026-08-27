import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSystemAdmin } from "@/lib/access";
import { verifyLineCredentialUpdates } from "@/lib/line/verify-credentials";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/secrets";

const optionalCredential = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v));

const bodySchema = z.object({
  channelSecret: optionalCredential.optional(),
  accessToken: optionalCredential.optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await requireSystemAdmin();

    const account = await prisma.lineAccount.findUnique({
      where: { id },
      select: { id: true, channelId: true },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ LINE Account หรือไม่มีสิทธิ์" },
        { status: 404 },
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

    const { channelSecret, accessToken } = parsed.data;

    const verified = await verifyLineCredentialUpdates({
      channelId: account.channelId,
      channelSecret,
      accessToken,
    });

    if (!verified.ok) {
      return NextResponse.json(
        { success: false, error: verified.error },
        { status: 400 },
      );
    }

    if (!channelSecret && !accessToken) {
      return NextResponse.json(
        { success: false, error: "ไม่มีข้อมูลที่ต้องอัปเดต" },
        { status: 400 },
      );
    }

    await prisma.lineAccount.update({
      where: { id },
      data: {
        ...(channelSecret
          ? { channelSecret: encryptSecret(channelSecret) }
          : {}),
        ...(accessToken ? { accessToken: encryptSecret(accessToken) } : {}),
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "แก้ไข LINE Account ไม่สำเร็จ";

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
      { success: false, error: "แก้ไข LINE Account ไม่สำเร็จ" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await requireSystemAdmin();

    const account = await prisma.lineAccount.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            richMenus: true,
            clickEvents: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ LINE Account หรือไม่มีสิทธิ์" },
        { status: 404 },
      );
    }

    if (account._count.richMenus > 0 || account._count.clickEvents > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่สามารถลบได้ เนื่องจากยังมี Rich Menus หรือ Click Events ที่ผูกกับ LINE Account นี้",
        },
        { status: 400 },
      );
    }

    await prisma.lineAccount.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "ลบ LINE Account ไม่สำเร็จ";

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
      { success: false, error: "ลบ LINE Account ไม่สำเร็จ" },
      { status: 400 },
    );
  }
}
