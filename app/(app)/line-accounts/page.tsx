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
    <div className="w-full min-w-0 max-w-full space-y-6">
      <PageHeader
        actions={<CreateLineAccountForm organizations={organizations} />}
        description="จัดการบัญชี LINE Official Account และ Rich Menu"
        title="บัญชี LINE"
      />
      <LineAccountList
        currentOrganizationId={organizationId ?? null}
        lineAccounts={lineAccounts}
        organizations={organizations}
      />
    </div>
  );
}
