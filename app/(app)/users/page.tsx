import { UsersTable } from "./UsersTable";

import { isSystemAdmin } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/layouts/PageShell";
import { DataTableCard } from "@/components/data/DataTableCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { siteConfig } from "@/config/site";

export default async function UsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) return null;

  if (!isSystemAdmin(currentUser)) {
    return (
      <PageShell>
        <PageHeader
          description="จัดการผู้ใช้ระบบและสถานะการอนุมัติ"
          title={siteConfig.labels.users}
        />
        <ErrorState
          description="ต้องเป็นผู้ดูแลระบบ"
          title="คุณไม่มีสิทธิ์เข้าถึงหน้านี้"
        />
      </PageShell>
    );
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      lineAccountAssignments: {
        include: {
          lineAccount: { select: { id: true, name: true } },
        },
      },
    },
  });

  const lineAccounts = await prisma.lineAccount.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <PageShell>
      <PageHeader
        description="จัดการผู้ใช้ที่เข้าสู่ระบบผ่าน LDAP และกำหนดสิทธิ์การใช้งาน"
        title={siteConfig.labels.users}
      />
      <DataTableCard
        description="ผู้ใช้จะถูกสร้างอัตโนมัติเมื่อเข้าสู่ระบบครั้งแรก และต้องได้รับการอนุมัติจากผู้ดูแลระบบก่อนใช้งาน โดยสิทธิ์การจัดการจะผูกตาม LINE OA ที่ได้รับมอบหมาย"
        title="รายการผู้ใช้"
      >
        <UsersTable
          currentUserId={currentUser.id}
          lineAccounts={lineAccounts}
          users={users}
        />
      </DataTableCard>
    </PageShell>
  );
}
