import { OrganizationList } from "./OrganizationList";
import { CreateOrganizationForm } from "./CreateOrganizationForm";

import { isSystemAdmin, organizationWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/layouts/PageShell";
import { siteConfig } from "@/config/site";

export default async function OrganizationsPage() {
  const user = await getCurrentUser();

  if (!user) return null;
  const systemAdmin = isSystemAdmin(user);
  const organizations = await prisma.organization.findMany({
    where: organizationWhere(user),
    include: {
      memberships: { include: { user: true } },
      _count: { select: { lineAccounts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageShell>
      <PageHeader
        actions={systemAdmin ? <CreateOrganizationForm /> : null}
        description="จัดการหน่วยงานและสิทธิ์การเข้าถึง"
        title={siteConfig.labels.organizations}
      />
      <OrganizationList currentUserId={user.id} organizations={organizations} />
    </PageShell>
  );
}
