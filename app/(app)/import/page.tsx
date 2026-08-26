import { ImportRichMenuForm } from "./ImportRichMenuForm";

import { lineAccountWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { lineAccountNameSelect } from "@/lib/line-account-select";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/layouts/PageShell";
import { siteConfig } from "@/config/site";

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ lineAccountId?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) return null;
  const lineAccounts = await prisma.lineAccount.findMany({
    where: lineAccountWhere(user),
    select: lineAccountNameSelect,
    orderBy: { name: "asc" },
  });

  return (
    <PageShell>
      <PageHeader title={siteConfig.labels.importRichMenu} />
      <ImportRichMenuForm
        defaultLineAccountId={(await searchParams).lineAccountId ?? null}
        lineAccounts={lineAccounts}
      />
    </PageShell>
  );
}
