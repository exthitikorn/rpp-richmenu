import { Card, CardBody, CardHeader } from "@heroui/card";

import { UsersTable } from "./UsersTable";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";

export default async function UsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) return null;

  const isOwner = currentUser.memberships.some((m) => m.role === "OWNER");

  if (!isOwner) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-4">
        <PageHeader
          description="จัดการผู้ใช้ระบบและสถานะการอนุมัติ"
          title="ผู้ใช้"
        />
        <Card className="w-full min-w-0 overflow-hidden">
          <CardBody>
            <p className="text-danger">
              คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (ต้องเป็น OWNER)
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      memberships: {
        include: { organization: true },
      },
    },
  });

  const organizations = await prisma.organization.findMany({
    where: { memberships: { some: { userId: currentUser.id } } },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <PageHeader
        description="จัดการผู้ใช้และกำหนดให้ผู้ใช้ที่ได้รับอนุมัติเท่านั้นที่ใช้งานได้"
        title="ผู้ใช้"
      />
      <Card className="w-full min-w-0 overflow-hidden">
        <CardHeader className="px-4 py-3 text-sm font-medium">
          <div className="min-w-0">
            <p className="text-sm font-semibold">รายการผู้ใช้</p>
            <p className="text-xs text-default-500">
              ผู้ใช้ที่ยังไม่ถูกอนุมัติจะไม่สามารถเข้าสู่ระบบและใช้งานระบบได้
            </p>
          </div>
          {/* <Button isDisabled color="primary" size="sm" variant="flat">
            เพิ่มผู้ใช้ (เร็วๆ นี้)
          </Button> */}
        </CardHeader>
        <CardBody className="min-w-0 overflow-x-auto px-4 py-3">
          <UsersTable
            currentUserId={currentUser.id}
            organizations={organizations}
            users={users}
          />
        </CardBody>
      </Card>
    </div>
  );
}
