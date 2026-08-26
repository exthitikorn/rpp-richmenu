import { NextResponse } from "next/server";

import { lineAccountByIdWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { getRichMenus } from "@/lib/line/client";
import { summarizeRichMenuLimit } from "@/lib/line/rich-menu-limit";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/secrets";

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
          imageUrl: true,
          chatBarText: true,
          width: true,
          height: true,
        },
      },
    },
  });

  if (!account) {
    return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  }

  try {
    const listed = await getRichMenus(decryptSecret(account.accessToken));
    const byLineId = new Map(
      account.richMenus
        .filter((rm) => rm.lineRichMenuId)
        .map((rm) => [rm.lineRichMenuId as string, rm]),
    );
    const summary = summarizeRichMenuLimit(listed.length);

    const richMenus = listed
      .map((menu) => {
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
                imageUrl: linked.imageUrl,
              }
            : {}),
        };
      })
      .sort((a, b) => {
        if (a.selected !== b.selected) return a.selected ? -1 : 1;

        return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
      });

    const previewMenus = account.richMenus
      .slice()
      .sort((a, b) => {
        if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;

        return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
      })
      .map((rm) => ({
        id: rm.id,
        name: rm.name,
        imageUrl: rm.imageUrl,
        chatBarText: rm.chatBarText,
        width: rm.width,
        height: rm.height,
        isDefault: rm.isDefault,
        lineRichMenuId: rm.lineRichMenuId,
      }));

    const selectedLine = listed.find((m) => m.selected);
    const linkedDefaultId = selectedLine
      ? byLineId.get(selectedLine.richMenuId)?.id
      : undefined;
    const defaultPreviewMenuId =
      linkedDefaultId ??
      previewMenus.find((m) => m.isDefault)?.id ??
      previewMenus[0]?.id ??
      null;

    return NextResponse.json({
      ...summary,
      richMenus,
      previewMenus,
      defaultPreviewMenuId,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "ดึงรายการ Rich Menu จาก LINE ไม่สำเร็จ";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
