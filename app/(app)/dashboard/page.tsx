import NextLink from "next/link";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";

import { AnalyticsCharts } from "./AnalyticsCharts";
import { DashboardRangeLinks } from "./DashboardRangeLinks";
import { PendingLineAccountRequestsCard } from "./PendingLineAccountRequestsCard";
import {
  type RichMenuAnalyticsMenu,
  RichMenuAnalyticsSection,
} from "./RichMenuAnalyticsSection";

import {
  clickEventWhere,
  deployLogWhere,
  isSystemAdmin,
  lineAccountWhere,
  richMenuWhere,
} from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import {
  parseDashboardRange,
  rangeLabel,
  rangeStartDate,
} from "@/lib/dashboard-range";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/layouts/PageShell";
import { siteConfig } from "@/config/site";
import {
  DeployStatus,
  LineAccountRequestStatus,
  RichMenuStatus,
} from "@/app/generated/prisma/client";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) return null;

  const { range: rangeParam } = await searchParams;
  const range = parseDashboardRange(rangeParam);
  const start = rangeStartDate(range);
  const systemAdmin = isSystemAdmin(user);
  const lineWhere = lineAccountWhere(user);
  const menuWhere = richMenuWhere(user);
  const clicksBase = clickEventWhere(user);
  const clicksWhere = start
    ? { ...clicksBase, createdAt: { gte: start } }
    : clicksBase;
  const deployWhere = deployLogWhere(user);

  const [
    lineAccountCount,
    deployedMenuCount,
    totalClicks,
    uniqueUserGroups,
    byAreaRaw,
    byMenuRaw,
    pendingSummary,
    pendingLineAccountRequests,
    failedDeploys,
    accountsMissingDefault,
    recentDeploys,
  ] = await Promise.all([
    prisma.lineAccount.count({ where: lineWhere }),
    prisma.richMenu.count({
      where: { ...menuWhere, status: RichMenuStatus.DEPLOYED },
    }),
    prisma.clickEvent.count({ where: clicksWhere }),
    prisma.clickEvent.groupBy({
      by: ["lineUserId"],
      where: clicksWhere,
    }),
    prisma.clickEvent.groupBy({
      by: ["richMenuId", "areaIndex"],
      where: clicksWhere,
      _count: true,
    }),
    prisma.clickEvent.groupBy({
      by: ["richMenuId"],
      where: clicksWhere,
      _count: true,
    }),
    systemAdmin
      ? (async () => {
          const [users, count] = await Promise.all([
            prisma.user.findMany({
              where: { isApproved: false },
              orderBy: { createdAt: "desc" },
              take: 5,
              select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
              },
            }),
            prisma.user.count({ where: { isApproved: false } }),
          ]);

          return { users, count };
        })()
      : Promise.resolve({ users: [], count: 0 }),
    systemAdmin
      ? (async () => {
          const [requests, count] = await Promise.all([
            prisma.lineAccountRequest.findMany({
              where: { status: LineAccountRequestStatus.PENDING },
              orderBy: { createdAt: "desc" },
              take: 5,
              select: {
                id: true,
                name: true,
                channelId: true,
                createdAt: true,
                requestedBy: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    ldapUsername: true,
                  },
                },
              },
            }),
            prisma.lineAccountRequest.count({
              where: { status: LineAccountRequestStatus.PENDING },
            }),
          ]);

          return { requests, count };
        })()
      : Promise.resolve({ requests: [], count: 0 }),
    prisma.deployLog.findMany({
      where: { ...deployWhere, status: DeployStatus.FAILED },
      orderBy: { deployedAt: "desc" },
      take: 5,
      include: {
        richMenu: { select: { id: true, name: true } },
      },
    }),
    prisma.lineAccount.findMany({
      where: {
        ...lineWhere,
        NOT: { richMenus: { some: { isDefault: true } } },
      },
      select: { id: true, name: true },
      take: 8,
      orderBy: { name: "asc" },
    }),
    prisma.deployLog.findMany({
      where: deployWhere,
      orderBy: { deployedAt: "desc" },
      take: 10,
      include: {
        richMenu: {
          select: {
            id: true,
            name: true,
            lineAccount: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const uniqueUsers = uniqueUserGroups.length;

  const richMenuIds = Array.from(
    new Set(byMenuRaw.map((m) => m.richMenuId)),
  ).filter(Boolean);

  const richMenus =
    richMenuIds.length > 0
      ? await prisma.richMenu.findMany({
          where: { id: { in: richMenuIds } },
          include: {
            areas: { orderBy: { order: "asc" } },
            lineAccount: { select: { name: true } },
          },
        })
      : [];

  const menuNames: Record<string, string> = {};

  richMenus.forEach((menu) => {
    menuNames[menu.id] = menu.name;
  });

  const byArea = [...byAreaRaw].sort(
    (a, b) =>
      ((b as { _count: number })._count ?? 0) -
      ((a as { _count: number })._count ?? 0),
  );

  const byMenu = byMenuRaw.map((m) => ({
    richMenuId: m.richMenuId,
    count: (m as { _count: number })._count ?? 0,
  }));

  const areaCountsByMenu = new Map<string, Map<number, number>>();

  byAreaRaw.forEach((item) => {
    const current =
      areaCountsByMenu.get(item.richMenuId) ?? new Map<number, number>();

    current.set(item.areaIndex, (item as { _count: number })._count ?? 0);
    areaCountsByMenu.set(item.richMenuId, current);
  });

  const totalClicksByMenu = new Map<string, number>();

  byMenu.forEach((item) => {
    totalClicksByMenu.set(item.richMenuId, item.count);
  });

  const richMenuAnalyticsMenus: RichMenuAnalyticsMenu[] = richMenus.map(
    (menu) => {
      const areaCounts = areaCountsByMenu.get(menu.id);
      const areas = menu.areas
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((area, index) => ({
          id: area.id,
          x: area.x,
          y: area.y,
          width: area.width,
          height: area.height,
          index,
          clickCount: areaCounts?.get(index) ?? 0,
        }));

      return {
        id: menu.id,
        name: menu.name,
        lineAccountName: menu.lineAccount.name,
        width: menu.width,
        height: menu.height,
        imageUrl: menu.imageUrl,
        totalClicks: totalClicksByMenu.get(menu.id) ?? 0,
        areas,
      };
    },
  );

  const periodText = rangeLabel(range);
  const overviewMetrics = [
    {
      key: "lineAccounts",
      label: "บัญชี LINE",
      description: systemAdmin
        ? "จำนวนบัญชี LINE ทั้งหมดในระบบ"
        : "จำนวนบัญชี LINE ที่คุณได้รับสิทธิ์",
      value: lineAccountCount,
      valueClass: "text-line-green",
      barClass: "bg-line-green",
    },
    {
      key: "deployedMenus",
      label: "Rich Menu ที่ deploy",
      description: "สถานะ DEPLOYED ในขอบเขตที่เข้าถึงได้",
      value: deployedMenuCount,
      valueClass: "text-primary",
      barClass: "bg-primary",
    },
    {
      key: "clicks",
      label: "การกด",
      description: `ในช่วง ${periodText}`,
      value: totalClicks,
      valueClass: "text-secondary-700",
      barClass: "bg-secondary",
    },
    {
      key: "uniqueUsers",
      label: "ผู้ใช้ไม่ซ้ำ",
      description: `LINE user ที่กดในช่วง ${periodText}`,
      value: uniqueUsers,
      valueClass: "text-primary-700",
      barClass: "bg-gradient-to-r from-primary to-secondary",
    },
  ];

  const hasAttention =
    (systemAdmin && pendingSummary.count > 0) ||
    (systemAdmin && pendingLineAccountRequests.count > 0) ||
    failedDeploys.length > 0 ||
    accountsMissingDefault.length > 0;

  const hasAnalytics = byMenu.length > 0 && byArea.length > 0;

  const menuMeta = new Map(
    richMenus.map((menu) => [
      menu.id,
      { name: menu.name, lineAccountName: menu.lineAccount.name },
    ]),
  );
  const topMenus = [...byMenu]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((item, index) => {
      const meta = menuMeta.get(item.richMenuId);

      return {
        rank: index + 1,
        id: item.richMenuId,
        name: meta?.name ?? menuNames[item.richMenuId] ?? item.richMenuId,
        lineAccountName: meta?.lineAccountName ?? "—",
        count: item.count,
        share:
          totalClicks > 0 ? Math.round((item.count / totalClicks) * 100) : 0,
      };
    });
  const topMenuMax = topMenus[0]?.count ?? 0;

  return (
    <PageShell className="space-y-8">
      <PageHeader
        actions={<DashboardRangeLinks current={range} />}
        badges={
          <>
            <span className="inline-flex items-center rounded-full border border-primary-200/70 bg-primary-50/80 px-3 py-1 text-xs font-medium text-primary-700 shadow-sm">
              {periodText}
            </span>
            <span className="inline-flex items-center rounded-full border border-secondary-200/80 bg-secondary-50/90 px-3 py-1 text-xs font-medium text-secondary-700 shadow-sm">
              {totalClicks.toLocaleString("th-TH")} การกด
            </span>
          </>
        }
        description={
          systemAdmin
            ? `สวัสดี, ${user.name ?? user.email} — ภาพรวม KPI สุขภาพระบบ และสถิติคลิก`
            : `สวัสดี, ${user.name ?? user.email} — ภาพรวมบัญชี LINE ที่คุณเข้าถึงได้`
        }
        title="แดชบอร์ดภาพรวม"
      />

      <section className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overviewMetrics.map((metric) => (
            <Card
              key={metric.key}
              className="group relative overflow-hidden border border-default-200 shadow-none"
            >
              <div
                aria-hidden
                className={`absolute inset-x-0 top-0 h-1 ${metric.barClass}`}
              />
              <CardHeader className="flex flex-col gap-1 pb-1 pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-default-600">
                  {metric.label}
                </p>
                <p className="text-[0.75rem] text-default-400">
                  {metric.description}
                </p>
              </CardHeader>
              <CardBody className="flex items-center justify-center pt-1">
                <p
                  className={`text-3xl font-bold tracking-tight ${metric.valueClass}`}
                >
                  {metric.value.toLocaleString("th-TH")}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {hasAttention ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-1">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary-700">
              <span
                aria-hidden
                className="inline-block h-4 w-1 rounded-full bg-secondary"
              />
              งานที่ต้องทำ
            </h2>
            <p className="text-sm text-default-500">
              รายการที่ควรตรวจในขอบเขตที่คุณเข้าถึงได้
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {systemAdmin && pendingSummary.count > 0 ? (
              <Card className="border border-warning-300 shadow-none">
                <CardHeader className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-warning-700">
                      ผู้ใช้รออนุมัติ
                    </p>
                    <p className="text-sm text-default-500">
                      {pendingSummary.count.toLocaleString("th-TH")} คน
                      (แสดงล่าสุด 5 คน)
                    </p>
                  </div>
                  <Button
                    as={NextLink}
                    color="warning"
                    href="/users"
                    size="sm"
                    variant="flat"
                  >
                    ไปหน้าผู้ใช้
                  </Button>
                </CardHeader>
                <CardBody>
                  <ul className="space-y-1.5 text-sm">
                    {pendingSummary.users.map((u) => (
                      <li
                        key={u.id}
                        className="flex justify-between gap-2 border-b border-default-100 py-1 last:border-0"
                      >
                        <span className="truncate">
                          {u.name ?? u.email ?? "—"}
                        </span>
                        <span className="shrink-0 text-xs text-default-500">
                          {u.createdAt.toLocaleDateString("th-TH")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            ) : null}

            {systemAdmin && pendingLineAccountRequests.count > 0 ? (
              <PendingLineAccountRequestsCard
                count={pendingLineAccountRequests.count}
                requests={pendingLineAccountRequests.requests}
              />
            ) : null}

            {failedDeploys.length > 0 ? (
              <Card className="border border-danger-300 shadow-none">
                <CardHeader className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-danger-700">
                      Deploy ล้มเหลวล่าสุด
                    </p>
                    <p className="text-sm text-default-500">
                      {failedDeploys.length} รายการ
                    </p>
                  </div>
                  <Button
                    as={NextLink}
                    color="danger"
                    href="/deploy-logs"
                    size="sm"
                    variant="flat"
                  >
                    ดูทั้งหมด
                  </Button>
                </CardHeader>
                <CardBody>
                  <ul className="space-y-1.5 text-sm">
                    {failedDeploys.map((log) => (
                      <li
                        key={log.id}
                        className="border-b border-default-100 py-1 last:border-0"
                      >
                        <NextLink
                          className="font-medium text-primary hover:underline"
                          href={`/rich-menus/${log.richMenu.id}/edit`}
                        >
                          {log.richMenu.name}
                        </NextLink>
                        <p className="truncate text-xs text-default-500">
                          {log.message ?? "ไม่มีรายละเอียด"} ·{" "}
                          {log.deployedAt.toLocaleString("th-TH")}
                        </p>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            ) : null}

            {accountsMissingDefault.length > 0 ? (
              <Card className="border border-default-200 shadow-none lg:col-span-2">
                <CardHeader>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-secondary-700">
                      บัญชียังไม่มี Rich Menu default
                    </p>
                    <p className="text-sm text-default-500">
                      {accountsMissingDefault.length} บัญชี
                    </p>
                  </div>
                </CardHeader>
                <CardBody>
                  <ul className="flex flex-wrap gap-2">
                    {accountsMissingDefault.map((account) => (
                      <li key={account.id}>
                        <Button
                          as={NextLink}
                          className="border-secondary-200 text-secondary-800"
                          href={`/rich-menus?lineAccountId=${account.id}`}
                          size="sm"
                          variant="bordered"
                        >
                          {account.name}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            ) : null}
          </div>
        </section>
      ) : null}

      {hasAnalytics ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-1">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary-700">
              <span
                aria-hidden
                className="inline-block h-4 w-1 rounded-full bg-primary"
              />
              {siteConfig.labels.analyticsTitle}
            </h2>
            <p className="text-sm text-default-500">
              สถิติการกดในช่วง {periodText}
            </p>
          </div>
          <Card className="border border-default-200 shadow-none">
            <CardHeader>
              <p className="font-semibold">สถิติภาพรวมการกด Rich Menu</p>
            </CardHeader>
            <CardBody>
              <AnalyticsCharts
                byArea={byArea}
                byMenu={byMenu}
                menuNames={menuNames}
              />
            </CardBody>
          </Card>

          <RichMenuAnalyticsSection
            menus={richMenuAnalyticsMenus}
            totalClicks={totalClicks}
          />
        </section>
      ) : (
        <Card className="border border-default-200 shadow-none">
          <CardBody>
            <p className="text-sm text-default-500">
              ยังไม่มีข้อมูลการคลิกในช่วง {periodText}
            </p>
          </CardBody>
        </Card>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="border border-default-200 shadow-none lg:col-span-2">
          <CardHeader className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold">กิจกรรม Deploy ล่าสุด</p>
              <p className="text-sm text-default-500">10 รายการล่าสุด</p>
            </div>
            <Button
              as={NextLink}
              color="primary"
              href="/deploy-logs"
              size="sm"
              variant="flat"
            >
              ดูทั้งหมด
            </Button>
          </CardHeader>
          <CardBody>
            {recentDeploys.length === 0 ? (
              <p className="text-sm text-default-500">ยังไม่มีประวัติ deploy</p>
            ) : (
              <ul className="divide-y divide-default-100 text-sm">
                {recentDeploys.map((log) => (
                  <li
                    key={log.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 py-2 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <NextLink
                        className="font-medium text-primary hover:underline"
                        href={`/rich-menus/${log.richMenu.id}/edit`}
                      >
                        {log.richMenu.name}
                      </NextLink>
                      <p className="text-xs text-default-500">
                        {log.richMenu.lineAccount.name}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-xs">
                      <span
                        className={
                          log.status === DeployStatus.SUCCESS
                            ? "inline-flex rounded-full bg-success-100 px-2 py-0.5 font-medium text-success-700"
                            : log.status === DeployStatus.FAILED
                              ? "inline-flex rounded-full bg-danger-100 px-2 py-0.5 font-medium text-danger-700"
                              : "inline-flex rounded-full bg-default-100 px-2 py-0.5 font-medium text-default-600"
                        }
                      >
                        {log.status}
                      </span>
                      <p className="mt-1 text-default-400">
                        {log.deployedAt.toLocaleString("th-TH")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="border border-default-200 shadow-none">
          <CardHeader>
            <div className="space-y-1">
              <p className="text-sm font-semibold">Top Rich Menu</p>
              <p className="text-sm text-default-500">
                กดมากสุดในช่วง {periodText}
              </p>
            </div>
          </CardHeader>
          <CardBody>
            {topMenus.length === 0 ? (
              <p className="text-sm text-default-500">
                ยังไม่มีข้อมูลการคลิกในช่วงนี้
              </p>
            ) : (
              <ol className="space-y-3">
                {topMenus.map((menu) => {
                  const widthPercent =
                    topMenuMax > 0
                      ? Math.max((menu.count / topMenuMax) * 100, 8)
                      : 8;

                  return (
                    <li key={menu.id} className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            <span className="mr-1.5 text-secondary-600">
                              #{menu.rank}
                            </span>
                            <NextLink
                              className="text-primary hover:underline"
                              href={`/rich-menus/${menu.id}/edit`}
                            >
                              {menu.name}
                            </NextLink>
                          </p>
                          <p className="truncate text-xs text-default-500">
                            {menu.lineAccountName}
                          </p>
                        </div>
                        <div className="shrink-0 text-right text-xs">
                          <p className="font-semibold text-secondary-700">
                            {menu.count.toLocaleString("th-TH")}
                          </p>
                          <p className="text-default-400">{menu.share}%</p>
                        </div>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary-100/80">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-secondary to-primary"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardBody>
        </Card>
      </section>
    </PageShell>
  );
}
