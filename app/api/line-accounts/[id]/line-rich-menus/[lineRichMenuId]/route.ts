import { NextResponse } from "next/server";

import { RichMenuStatus } from "@/app/generated/prisma/client";
import { lineAccountByIdWhere, requireSystemAdmin } from "@/lib/access";
import { deleteRichMenu } from "@/lib/line/client";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/secrets";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; lineRichMenuId: string }> },
) {
  const { id, lineRichMenuId } = await params;

  if (!lineRichMenuId) {
    return NextResponse.json(
      { success: false, error: "richMenuId is required" },
      { status: 400 },
    );
  }

  try {
    const user = await requireSystemAdmin();

    const account = await prisma.lineAccount.findFirst({
      where: lineAccountByIdWhere(user, id),
      select: { id: true, accessToken: true },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ" },
        { status: 404 },
      );
    }

    await deleteRichMenu(decryptSecret(account.accessToken), lineRichMenuId);

    const updated = await prisma.richMenu.updateMany({
      where: {
        lineAccountId: account.id,
        lineRichMenuId,
      },
      data: {
        lineRichMenuId: null,
        status: RichMenuStatus.DRAFT,
        isDefault: false,
      },
    });

    return NextResponse.json({
      success: true,
      unlinked: updated.count > 0,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "ลบ Rich Menu บน LINE ไม่สำเร็จ";

    if (message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: message },
        { status: 401 },
      );
    }
    if (message === "Forbidden: system admin required") {
      return NextResponse.json(
        { success: false, error: message },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 502 },
    );
  }
}
