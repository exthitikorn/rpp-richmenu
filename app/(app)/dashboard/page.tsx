import { Card, CardBody, CardHeader } from "@heroui/card";

import { AnalyticsCharts } from "../analytics/AnalyticsCharts";

import {
  type RichMenuAnalyticsMenu,
  RichMenuAnalyticsSection,
} from "./RichMenuAnalyticsSection";

import {
  clickEventWhere,
  isSystemAdmin,
  lineAccountWhere,
  richMenuWhere,
} from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/layouts/PageShell";
import { siteConfig } from "@/config/site";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  const systemAdmin = isSystemAdmin(user);
  const lineWhere = lineAccountWhere(user);
  const menuWhere = richMenuWhere(user);
  const clicksWhere = clickEventWhere(user);

  const [
    lineAccountCount,
    richMenuCount,
    totalClicks,
    byAreaRaw,
    byMenuRaw,
    pendingSummary,
  ] = await Promise.all([
    prisma.lineAccount.count({ where: lineWhere }),
    prisma.richMenu.count({ where: menuWhere }),
    prisma.clickEvent.count({ where: clicksWhere }),
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
            prisma.user.count({
              where: { isApproved: false },
            }),
          ]);

          return { users, count };
        })()
      : Promise.resolve({ users: [], count: 0 }),
  ]);

  const richMenuIds = Array.from(
    new Set(byMenuRaw.map((m) => m.richMenuId)),
  ).filter(Boolean);

  const richMenus =
    richMenuIds.length > 0
      ? await prisma.richMenu.findMany({
          where: { id: { in: richMenuIds } },
          include: {
            areas: { orderBy: { order: "asc" } },
            lineAccount: true,
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

      const menuTotalClicks = totalClicksByMenu.get(menu.id) ?? 0;

      return {
        id: menu.id,
        name: menu.name,
        lineAccountName: menu.lineAccount.name,
        width: menu.width,
        height: menu.height,
        imageUrl: menu.imageUrl,
        totalClicks: menuTotalClicks,
        areas,
      };
    },
  );

  const overviewMetrics = [
    {
      key: "lineAccounts",
      label: "บัญชี LINE",
      description: systemAdmin
        ? "จำนวนบัญชี LINE ทั้งหมดในระบบ"
        : "จำนวนบัญชี LINE ที่คุณได้รับสิทธิ์",
      value: lineAccountCount,
    },
    {
      key: "richMenus",
      label: "Rich Menu",
      description: systemAdmin
        ? "จำนวน Rich Menu ทั้งหมดในระบบ"
        : "จำนวน Rich Menu ในบัญชี LINE ที่คุณเข้าถึงได้",
      value: richMenuCount,
    },
    {
      key: "clicks",
      label: "การกดทั้งหมด",
      description: systemAdmin
        ? "จำนวนการกด Rich Menu รวมทั้งระบบ"
        : "จำนวนการกด Rich Menu ในบัญชี LINE ที่คุณเข้าถึงได้",
      value: totalClicks,
    },
  ];

  return (
    <PageShell className="space-y-8">
      <PageHeader
        badges={
          <>
            <span className="inline-flex items-center rounded-full border border-default-200/80 bg-background/80 px-3 py-1 text-xs font-medium text-default-600 shadow-sm">
              อัปเดตข้อมูลแบบเรียลไทม์
            </span>
            <span className="inline-flex items-center rounded-full border border-default-200/80 bg-background/80 px-3 py-1 text-xs font-medium text-default-600 shadow-sm">
              รวม {overviewMetrics[3]?.value.toLocaleString("th-TH")} การกด
            </span>
          </>
        }
        description={
          systemAdmin
            ? `สวัสดี, ${user.name ?? user.email} — ดูภาพรวมสถิติทั้งระบบได้ที่นี่`
            : `สวัสดี, ${user.name ?? user.email} — ดูสถิติการใช้งาน Rich Menu และบัญชี LINE ที่คุณได้รับสิทธิ์ได้ที่นี่`
        }
        title="แดชบอร์ดภาพรวม"
        variant="hero"
      />
      <section className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overviewMetrics.map((metric) => (
            <Card
              key={metric.key}
              className="group relative overflow-hidden border border-default-200 bg-gradient-to-br from-default-50/90 via-background to-background shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-200/70 hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_color-mix(in_srgb,var(--heroui-primary)_22%,transparent),_transparent_55%)] opacity-75 transition-opacity duration-300 group-hover:opacity-100" />
              <CardHeader className="relative z-10 flex flex-col gap-1 pb-1">
                <p className="text-xs font-medium uppercase tracking-wide text-default-500">
                  {metric.label}
                </p>
                <p className="text-[0.75rem] text-default-400">
                  {metric.description}
                </p>
              </CardHeader>
              <CardBody className="relative z-10 flex items-center justify-center pt-1">
                <p className="text-3xl font-bold tracking-tight text-primary">
                  {metric.value.toLocaleString("th-TH")}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {systemAdmin && pendingSummary.count > 0 ? (
        <Card className="border border-warning-300/30 bg-gradient-to-br from-warning-50/50 via-background to-background shadow-sm">
          <CardHeader className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-warning-700">
                ผู้ใช้รออนุมัติ
              </p>
              <p className="text-sm text-default-500">
                มีผู้ใช้รออนุมัติทั้งหมด{" "}
                <span className="font-semibold">
                  {pendingSummary.count.toLocaleString("th-TH")}
                </span>{" "}
                คน (แสดงรายการล่าสุด 5 คน)
              </p>
            </div>
            <span className="mt-1 inline-flex items-center rounded-full border border-warning-300/40 bg-warning-100/60 px-3 py-1 text-xs font-medium text-warning-700">
              {pendingSummary.count.toLocaleString("th-TH")} คนรออนุมัติ
            </span>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">
                  รายการผู้ใช้ที่รอการอนุมัติล่าสุด
                </caption>
                <thead>
                  <tr className="border-b border-default-200 text-left text-xs text-default-500">
                    <th className="py-2 pr-4" scope="col">
                      อีเมล
                    </th>
                    <th className="py-2 pr-4" scope="col">
                      ชื่อ
                    </th>
                    <th className="py-2 pr-4" scope="col">
                      วันที่สร้าง
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingSummary.users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-default-100 last:border-0 odd:bg-default-50/40"
                    >
                      <td className="py-1.5 pr-4">{u.email}</td>
                      <td className="py-1.5 pr-4">{u.name ?? "—"}</td>
                      <td className="py-1.5 pr-4 text-default-500">
                        {u.createdAt.toLocaleString("th-TH")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {byMenu.length > 0 && byArea.length > 0 ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-default-500">
              {siteConfig.labels.analyticsTitle}
            </h2>
            <p className="text-sm text-default-500">
              {systemAdmin
                ? "วิเคราะห์สถิติการกด Rich Menu ทั้งระบบ"
                : "วิเคราะห์สถิติการกด Rich Menu ในบัญชี LINE ที่คุณเข้าถึงได้"}
            </p>
          </div>
          <Card className="border border-default-200 bg-gradient-to-br from-background via-background to-primary-50/30 shadow-sm">
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
      ) : null}
    </PageShell>
  );
}
