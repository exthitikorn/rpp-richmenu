import { LineAccountList } from "./LineAccountList";
import { CreateLineAccountForm } from "./CreateLineAccountForm";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";

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
      organization: {
        memberships: { some: { userId: user.id } },
      },
      ...(organizationId ? { organizationId } : {}),
    },
    include: {
      organization: true,
      _count: { select: { richMenus: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const organizations = await prisma.organization.findMany({
    where: { memberships: { some: { userId: user.id } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        actions={<CreateLineAccountForm organizations={organizations} />}
        title="LINE Accounts"
      />
      <LineAccountList
        currentOrganizationId={organizationId ?? null}
        lineAccounts={lineAccounts}
        organizations={organizations}
      />
    </div>
  );
}
