import { LineAccountList } from "./LineAccountList";
import { CreateLineAccountForm } from "./CreateLineAccountForm";

import { lineAccountWhere, organizationWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/layouts/PageShell";
import { siteConfig } from "@/config/site";

export default async function LineAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string }>;
}) {
  const { organizationId } = await searchParams;
  const user = await getCurrentUser();

  if (!user) return null;
  const lineAccounts = await prisma.lineAccount.findMany({
    where: {
      ...lineAccountWhere(user),
      ...(organizationId ? { organizationId } : {}),
    },
    include: {
      organization: true,
      _count: { select: { richMenus: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const organizations = await prisma.organization.findMany({
    where: organizationWhere(user),
    orderBy: { name: "asc" },
  });

  return (
    <PageShell>
      <PageHeader
        actions={<CreateLineAccountForm organizations={organizations} />}
        description="จัดการบัญชี LINE Official Account และ Rich Menu"
        title={siteConfig.labels.lineAccounts}
      />
      <LineAccountList
        currentOrganizationId={organizationId ?? null}
        lineAccounts={lineAccounts}
        organizations={organizations}
      />
    </PageShell>
  );
}
