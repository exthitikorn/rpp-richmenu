import { OrganizationList } from "./OrganizationList";
import { CreateOrganizationForm } from "./CreateOrganizationForm";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";

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
    <div className="w-full min-w-0 max-w-full space-y-6">
      <PageHeader
        actions={<CreateOrganizationForm />}
        description="จัดการหน่วยงานและสิทธิ์การเข้าถึง"
        title="หน่วยงาน"
      />
      <OrganizationList organizations={organizations} />
    </div>
  );
}
