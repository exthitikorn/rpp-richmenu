import { LineAccountList } from "./LineAccountList";
import { CreateLineAccountForm } from "./CreateLineAccountForm";
import { RequestLineAccountForm } from "./RequestLineAccountForm";
import { MyLineAccountRequests } from "./MyLineAccountRequests";

import { isSystemAdmin, lineAccountWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { lineAccountPublicSelect } from "@/lib/line-account-select";
import { lineAccountRequestPublicSelect } from "@/lib/line-account-request";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/layouts/PageShell";
import { siteConfig } from "@/config/site";

export default async function LineAccountsPage() {
  const user = await getCurrentUser();

  if (!user) return null;
  const systemAdmin = isSystemAdmin(user);
  const [lineAccounts, myRequests] = await Promise.all([
    prisma.lineAccount.findMany({
      where: lineAccountWhere(user),
      select: {
        ...lineAccountPublicSelect,
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, ldapUsername: true },
            },
          },
        },
        _count: { select: { richMenus: true } },
        richMenus: {
          where: { isDefault: true },
          select: { id: true, name: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    systemAdmin
      ? Promise.resolve([])
      : prisma.lineAccountRequest.findMany({
          where: { requestedById: user.id },
          orderBy: { createdAt: "desc" },
          select: lineAccountRequestPublicSelect,
        }),
  ]);

  return (
    <PageShell>
      <PageHeader
        actions={
          systemAdmin ? <CreateLineAccountForm /> : <RequestLineAccountForm />
        }
        description="จัดการบัญชี LINE Official Account และ Rich Menu"
        title={siteConfig.labels.lineAccounts}
      />
      {!systemAdmin ? <MyLineAccountRequests requests={myRequests} /> : null}
      <div
        className={!systemAdmin && myRequests.length > 0 ? "mt-6" : undefined}
      >
        <LineAccountList
          hasRequestHint={!systemAdmin}
          lineAccounts={lineAccounts}
          systemAdmin={systemAdmin}
        />
      </div>
    </PageShell>
  );
}
