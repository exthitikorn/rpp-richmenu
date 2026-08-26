import NextLink from "next/link";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";

import { RichMenusFilter } from "./RichMenusFilter";
import { RichMenusTable } from "./RichMenusTable";

import { lineAccountWhere, richMenuWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import {
  lineAccountNameSelect,
  lineAccountPublicSelect,
} from "@/lib/line-account-select";
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
        lineAccount: { select: lineAccountNameSelect },
        _count: { select: { areas: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.lineAccount.findMany({
      where: lineAccountWhere(user),
      select: lineAccountPublicSelect,
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
        title={siteConfig.labels.richMenus}
      />
      <Card className="space-y-4 p-4">
        <RichMenusFilter
          currentLineAccountId={lineAccountId ?? null}
          lineAccounts={lineAccounts}
        />
        <RichMenusTable richMenus={richMenus} />
      </Card>
    </PageShell>
  );
}
