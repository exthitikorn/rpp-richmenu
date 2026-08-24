import NextLink from "next/link";
import { Button } from "@heroui/button";

import { RichMenusFilter } from "./RichMenusFilter";
import { RichMenusTable } from "./RichMenusTable";

import { lineAccountWhere, richMenuWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/layouts/PageShell";
import { siteConfig } from "@/config/site";

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
        ...richMenuWhere(user),
        ...(lineAccountId ? { lineAccountId } : {}),
      },
      include: {
        lineAccount: true,
        _count: { select: { areas: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.lineAccount.findMany({
      where: lineAccountWhere(user),
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <PageShell>
      <PageHeader
        actions={
          <Button as={NextLink} color="primary" href="/import">
            {siteConfig.labels.importRichMenu}
          </Button>
        }
        description="จัดการ Rich Menu และพื้นที่กด (Areas)"
        title={siteConfig.labels.richMenus}
      />
      <div className="w-full min-w-0 space-y-4">
        <RichMenusFilter
          currentLineAccountId={lineAccountId ?? null}
          lineAccounts={lineAccounts}
        />
        <RichMenusTable richMenus={richMenus} />
      </div>
    </PageShell>
  );
}
