import { LineAccountList } from "./LineAccountList";
import { CreateLineAccountForm } from "./CreateLineAccountForm";

import { isSystemAdmin, lineAccountWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/layouts/PageShell";
import { siteConfig } from "@/config/site";

export default async function LineAccountsPage() {
  const user = await getCurrentUser();

  if (!user) return null;
  const systemAdmin = isSystemAdmin(user);
  const lineAccounts = await prisma.lineAccount.findMany({
    where: lineAccountWhere(user),
    include: {
      assignments: {
        include: {
          user: {
            select: { id: true, name: true, email: true, ldapUsername: true },
          },
        },
      },
      _count: { select: { richMenus: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageShell>
      <PageHeader
        actions={systemAdmin ? <CreateLineAccountForm /> : undefined}
        description="จัดการบัญชี LINE Official Account และ Rich Menu"
        title={siteConfig.labels.lineAccounts}
      />
      <LineAccountList lineAccounts={lineAccounts} systemAdmin={systemAdmin} />
    </PageShell>
  );
}
