import { Card, CardBody, CardHeader } from "@heroui/card";

import { AnalyticsCharts } from "./AnalyticsCharts";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();

  if (!user) return null;
  const [byAreaRaw, byMenu, totalClicks] = await Promise.all([
    prisma.clickEvent.groupBy({
      by: ["richMenuId", "areaIndex"],
      where: {
        lineAccount: {
          organization: { memberships: { some: { userId: user.id } } },
        },
      },
      _count: true,
    }),
    prisma.clickEvent.groupBy({
      by: ["richMenuId"],
      where: {
        lineAccount: {
          organization: { memberships: { some: { userId: user.id } } },
        },
      },
      _count: true,
    }),
    prisma.clickEvent.count({
      where: {
        lineAccount: {
          organization: { memberships: { some: { userId: user.id } } },
        },
      },
    }),
  ]);

  const richMenuIds = Array.from(new Set(byMenu.map((m) => m.richMenuId)));
  const byArea = [...byAreaRaw].sort(
    (a, b) =>
      ((b as { _count: number })._count ?? 0) -
      ((a as { _count: number })._count ?? 0),
  );

  const richMenus =
    richMenuIds.length > 0
      ? await prisma.richMenu.findMany({
          where: { id: { in: richMenuIds } },
          include: { lineAccount: true },
        })
      : [];
  const menuNames: Record<string, string> = {};

  richMenus.forEach((r) => (menuNames[r.id] = r.name));

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" />
      <Card>
        <CardHeader>จำนวนคลิกรวม</CardHeader>
        <CardBody>
          <p className="text-3xl font-semibold">{totalClicks}</p>
        </CardBody>
      </Card>
      <AnalyticsCharts
        byArea={byArea}
        byMenu={byMenu.map((m) => ({
          richMenuId: m.richMenuId,
          count: (m as { _count: number })._count,
        }))}
        menuNames={menuNames}
      />
    </div>
  );
}
