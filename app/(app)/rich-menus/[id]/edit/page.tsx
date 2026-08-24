import NextLink from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@heroui/button";

import { lineAccountWhere, richMenuByIdWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
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
      lineAccount: true,
    },
  });

  if (!richMenu) notFound();

  const lineAccounts = await prisma.lineAccount.findMany({
    where: lineAccountWhere(user),
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button
            as={NextLink}
            href={`/rich-menus?lineAccountId=${richMenu.lineAccountId}`}
            variant="light"
          >
            กลับไปหน้า Rich Menus
          </Button>
        }
        description={`"${richMenu.name}" · ${richMenu.lineAccount.name} · ${richMenu.width}×${richMenu.height}px · ${richMenu.status}${richMenu.isDefault ? " · Default" : ""}`}
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
    </div>
  );
}
