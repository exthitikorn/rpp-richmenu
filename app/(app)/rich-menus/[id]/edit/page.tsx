import NextLink from "next/link";
import { Button } from "@heroui/button";

import { EditRichMenuHeaderMeta } from "./EditRichMenuHeaderMeta";

import { lineAccountWhere, richMenuByIdWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRichMenuAliasId } from "@/lib/richmenu/alias";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/layouts/PageShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { ImportRichMenuForm } from "@/app/(app)/import/ImportRichMenuForm";

export default async function RichMenuEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) return null;
  const richMenu = await prisma.richMenu.findFirst({
    where: richMenuByIdWhere(user, id),
    include: {
      areas: { orderBy: { order: "asc" } },
      lineAccount: { select: { id: true, name: true } },
    },
  });

  if (!richMenu) {
    return (
      <PageShell>
        <PageHeader title="แก้ไข Rich Menu" />
        <ErrorState
          action={
            <Button as={NextLink} href="/rich-menus" variant="flat">
              กลับไปรายการ Rich Menu
            </Button>
          }
          description="ไม่พบ Rich Menu หรือคุณไม่มีสิทธิ์เข้าถึง LINE OA ของเมนูนี้"
          title="คุณไม่มีสิทธิ์เข้าถึงหน้านี้"
        />
      </PageShell>
    );
  }

  const lineAccounts = await prisma.lineAccount.findMany({
    where: lineAccountWhere(user),
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <PageShell>
      <PageHeader
        badges={
          <EditRichMenuHeaderMeta
            aliasId={getRichMenuAliasId(richMenu.id)}
            lineAccountName={richMenu.lineAccount.name}
          />
        }
        title="แก้ไข Rich Menu"
      />
      <ImportRichMenuForm
        defaultLineAccountId={richMenu.lineAccountId}
        initialData={{
          richMenuId: richMenu.id,
          name: richMenu.name,
          chatBarText: richMenu.chatBarText,
          imageUrl: richMenu.imageUrl,
          width: richMenu.width,
          height: richMenu.height,
          lineAccountId: richMenu.lineAccountId,
          lineRichMenuId: richMenu.lineRichMenuId,
          status: richMenu.status,
          isDefault: richMenu.isDefault,
          areas: richMenu.areas.map((area) => ({
            x: area.x,
            y: area.y,
            width: area.width,
            height: area.height,
            actionType: area.actionType,
            action:
              area.action && typeof area.action === "object"
                ? (area.action as Record<string, unknown>)
                : {},
          })),
        }}
        lineAccounts={lineAccounts}
        mode="edit"
      />
    </PageShell>
  );
}
