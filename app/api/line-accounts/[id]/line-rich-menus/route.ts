import { NextResponse } from "next/server";

import { lineAccountByIdWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { getRichMenus } from "@/lib/line/client";
import { summarizeRichMenuLimit } from "@/lib/line/rich-menu-limit";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await prisma.lineAccount.findFirst({
    where: lineAccountByIdWhere(user, id),
    select: {
      id: true,
      accessToken: true,
      richMenus: {
        where: { lineRichMenuId: { not: null } },
        select: {
          id: true,
          name: true,
          status: true,
          isDefault: true,
          lineRichMenuId: true,
        },
      },
    },
  });

  if (!account) {
    return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  }

  try {
    const listed = await getRichMenus(account.accessToken);
    const byLineId = new Map(
      account.richMenus
        .filter((rm) => rm.lineRichMenuId)
        .map((rm) => [rm.lineRichMenuId as string, rm]),
    );
    const summary = summarizeRichMenuLimit(listed.length);

    return NextResponse.json({
      ...summary,
      richMenus: listed.map((menu) => {
        const linked = byLineId.get(menu.richMenuId);

        return {
          richMenuId: menu.richMenuId,
          name: menu.name,
          chatBarText: menu.chatBarText,
          selected: menu.selected,
          size: menu.size,
          ...(linked
            ? {
                linkedRichMenuId: linked.id,
                linkedName: linked.name,
                linkedStatus: linked.status,
                isDefault: linked.isDefault,
              }
            : {}),
        };
      }),
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "ดึงรายการ Rich Menu จาก LINE ไม่สำเร็จ";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
