import { OrganizationList } from "./OrganizationList";
import { CreateOrganizationForm } from "./CreateOrganizationForm";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export default async function OrganizationsPage() {
  const user = await getCurrentUser();

  if (!user) return null;
  const organizations = await prisma.organization.findMany({
    where: { memberships: { some: { userId: user.id } } },
    include: {
      memberships: { include: { user: true } },
      _count: { select: { lineAccounts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Organizations</h1>
        <CreateOrganizationForm />
      </div>
      <OrganizationList organizations={organizations} />
    </div>
  );
}
