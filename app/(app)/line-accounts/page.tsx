import { LineAccountList } from "./LineAccountList";
import { CreateLineAccountForm } from "./CreateLineAccountForm";

import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export default async function LineAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string }>;
}) {
  const { organizationId } = await searchParams;
  const user = await getCurrentUser();

  if (!user) return null;
  const prisma = await getPrisma();
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">LINE Accounts</h1>
        <CreateLineAccountForm organizations={organizations} />
      </div>
      <LineAccountList
        currentOrganizationId={organizationId ?? null}
        lineAccounts={lineAccounts}
        organizations={organizations}
      />
    </div>
  );
}
