import NextLink from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@heroui/button";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RichMenuEditor } from "@/components/rich-menu-editor/RichMenuEditor";
import { PageHeader } from "@/components/page-header";

export default async function RichMenuEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) return null;
  const richMenu = await prisma.richMenu.findFirst({
    where: {
      id,
      lineAccount: {
        organization: { memberships: { some: { userId: user.id } } },
      },
    },
    include: {
      areas: { orderBy: { order: "asc" } },
      lineAccount: { include: { organization: true } },
    },
  });

  if (!richMenu) notFound();

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
        description={`"${richMenu.name}" · ${richMenu.lineAccount.name} · ${richMenu.lineAccount.organization.name} · ${richMenu.width}×${richMenu.height}px · ${richMenu.status}${richMenu.isDefault ? " · Default" : ""}`}
        title="แก้ไข Rich Menu"
      />
      <RichMenuEditor richMenu={richMenu} />
    </div>
  );
}
