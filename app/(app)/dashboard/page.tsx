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

type RecentDeploy = {
  id: string;
  status: DeployStatus;
  deployedAt: Date;
  richMenu: {
    id: string;
    name: string;
    lineAccount: { name: string };
  };
};

function RecentDeploysCard({ deploys }: { deploys: RecentDeploy[] }) {
  return (
    <Card className="h-full border border-default-200 shadow-none">
      <CardHeader className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold">กิจกรรม Deploy ล่าสุด</p>
          <p className="text-sm text-default-500">5 รายการล่าสุด</p>
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
        {deploys.length === 0 ? (
          <p className="text-sm text-default-500">ยังไม่มีประวัติ deploy</p>
        ) : (
          <ul className="divide-y divide-default-100 text-sm">
            {deploys.map((log) => (
              <li
                key={log.id}
                className="flex items-baseline justify-between gap-3 py-1.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <NextLink
                    className="font-medium text-primary hover:underline"
                    href={`/rich-menus/${log.richMenu.id}/edit`}
                  >
                    {log.richMenu.name}
                  </NextLink>
                  <p className="truncate text-xs text-default-500">
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
  );
}

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
    pendingLineAccountRequests,
    failedDeploys,
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
    prisma.deployLog.findMany({
      where: deployWhere,
      orderBy: { deployedAt: "desc" },
      take: 5,
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
    (systemAdmin && pendingLineAccountRequests.count > 0) ||
    failedDeploys.length > 0;

  const hasAnalytics = byMenu.length > 0 && byArea.length > 0;

  const menuMeta: Record<string, { name: string; lineAccountName: string }> =
    Object.fromEntries(
      richMenus.map((menu) => [
        menu.id,
        { name: menu.name, lineAccountName: menu.lineAccount.name },
      ]),
    );

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
          <AnalyticsCharts
            byArea={byArea}
            byMenu={byMenu}
            menuMeta={menuMeta}
            menuNames={menuNames}
            totalClicks={totalClicks}
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2 [&_>_*]:h-full">
              <RichMenuAnalyticsSection
                menus={richMenuAnalyticsMenus}
                totalClicks={totalClicks}
              />
            </div>
            <RecentDeploysCard deploys={recentDeploys} />
          </div>
        </section>
      ) : (
        <>
          <Card className="border border-default-200 shadow-none">
            <CardBody>
              <p className="text-sm text-default-500">
                ยังไม่มีข้อมูลการคลิกในช่วง {periodText}
              </p>
            </CardBody>
          </Card>
          <section className="max-w-2xl">
            <RecentDeploysCard deploys={recentDeploys} />
          </section>
        </>
      )}
    </PageShell>
  );
}
