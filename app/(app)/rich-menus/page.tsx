import NextLink from "next/link";
import { Button } from "@heroui/button";

import { RichMenusFilter } from "./RichMenusFilter";
import { RichMenusTable } from "./RichMenusTable";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";

export default async function RichMenusPage({
  searchParams,
}: {
  searchParams: Promise<{ lineAccountId?: string }>;
}) {
  const { lineAccountId } = await searchParams;
  const user = await getCurrentUser();

  if (!user) return null;

  const [richMenus, lineAccounts] = await Promise.all([
    prisma.richMenu.findMany({
      where: {
        lineAccount: {
          organization: { memberships: { some: { userId: user.id } } },
        },
        ...(lineAccountId ? { lineAccountId } : {}),
      },
      include: {
        lineAccount: { include: { organization: true } },
        _count: { select: { areas: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.lineAccount.findMany({
      where: {
        organization: { memberships: { some: { userId: user.id } } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button as={NextLink} color="primary" href="/import">
            Import / สร้างใหม่
          </Button>
        }
        title="Rich Menus"
      />
      <div className="space-y-4">
        <RichMenusFilter
          currentLineAccountId={lineAccountId ?? null}
          lineAccounts={lineAccounts}
        />
        <RichMenusTable richMenus={richMenus} />
      </div>
    </div>
  );
}
