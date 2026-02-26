import { Card, CardBody, CardHeader } from "@heroui/card";

import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) return null;
  const prisma = await getPrisma();
  const [orgCount, lineAccountCount, richMenuCount, recentClicks] =
    await Promise.all([
      prisma.organization.count({
        where: {
          memberships: { some: { userId: user.id } },
        },
      }),
      prisma.lineAccount.count({
        where: {
          organization: {
            memberships: { some: { userId: user.id } },
          },
        },
      }),
      prisma.richMenu.count({
        where: {
          lineAccount: {
            organization: {
              memberships: { some: { userId: user.id } },
            },
          },
        },
      }),
      prisma.clickEvent.count({
        where: {
          lineAccount: {
            organization: {
              memberships: { some: { userId: user.id } },
            },
          },
        },
      }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-default-500">สวัสดี, {user.name ?? user.email}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-0">Organizations</CardHeader>
          <CardBody className="pt-1">
            <p className="text-2xl font-semibold">{orgCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader className="pb-0">LINE Accounts</CardHeader>
          <CardBody className="pt-1">
            <p className="text-2xl font-semibold">{lineAccountCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader className="pb-0">Rich Menus</CardHeader>
          <CardBody className="pt-1">
            <p className="text-2xl font-semibold">{richMenuCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader className="pb-0">Total Clicks</CardHeader>
          <CardBody className="pt-1">
            <p className="text-2xl font-semibold">{recentClicks}</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
