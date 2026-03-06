import { Card, CardBody, CardHeader } from "@heroui/card";

import { AnalyticsCharts } from "../analytics/AnalyticsCharts";

import {
  type RichMenuAnalyticsMenu,
  RichMenuAnalyticsSection,
} from "./RichMenuAnalyticsSection";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  const isOwner = user.memberships.some((m) => m.role === "OWNER");

  const [
    orgCount,
    lineAccountCount,
    richMenuCount,
    totalClicks,
    byAreaRaw,
    byMenuRaw,
    pendingSummary,
  ] = await Promise.all([
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
    isOwner
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
      key: "organizations",
      label: "องค์กร",
      description: "จำนวนองค์กรที่คุณเป็นสมาชิก",
      value: orgCount,
    },
    {
      key: "lineAccounts",
      label: "บัญชี LINE",
      description: "จำนวนบัญชี LINE ทั้งหมดที่เชื่อมต่อ",
      value: lineAccountCount,
    },
    {
      key: "richMenus",
      label: "Rich Menu",
      description: "จำนวน Rich Menu ที่สร้างไว้",
      value: richMenuCount,
    },
    {
      key: "clicks",
      label: "การกดทั้งหมด",
      description: "จำนวนการกด Rich Menu รวมทั้งหมด",
      value: totalClicks,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        description={`สวัสดี, ${user.name ?? user.email} — ดูสถิติการใช้งาน Rich Menu และบัญชี LINE ของคุณได้ที่นี่`}
        title="แดชบอร์ดภาพรวม"
      />
      <section className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overviewMetrics.map((metric) => (
            <Card
              key={metric.key}
              className="relative overflow-hidden border border-default-100/80 bg-gradient-to-br from-default-50/80 via-background to-background shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.2),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.28),_transparent_55%)]" />
              <CardHeader className="relative z-10 flex flex-col gap-1 pb-1">
                <p className="text-xs font-medium uppercase tracking-wide text-default-500">
                  {metric.label}
                </p>
                <p className="text-[0.75rem] text-default-400">
                  {metric.description}
                </p>
              </CardHeader>
              <CardBody className="relative z-10 pt-1 flex items-center justify-center">
                <p className="text-3xl font-semibold tracking-tight">
                  {metric.value.toLocaleString("th-TH")}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {isOwner && pendingSummary.count > 0 ? (
        <Card>
          <CardHeader className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold">ผู้ใช้รออนุมัติ</p>
              <p className="text-sm text-default-500">
                มีผู้ใช้รออนุมัติทั้งหมด{" "}
                <span className="font-semibold">
                  {pendingSummary.count.toLocaleString("th-TH")}
                </span>{" "}
                คน (แสดงรายการล่าสุด 5 คน)
              </p>
            </div>
            <span className="mt-1 inline-flex items-center rounded-full bg-default-100 px-3 py-1 text-xs font-medium text-default-600">
              {pendingSummary.count.toLocaleString("th-TH")} คนรออนุมัติ
            </span>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-default-200 text-left text-xs text-default-500">
                    <th className="py-2 pr-4">อีเมล</th>
                    <th className="py-2 pr-4">ชื่อ</th>
                    <th className="py-2 pr-4">วันที่สร้าง</th>
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
              Rich Menu Analytics
            </h2>
            <p className="text-sm text-default-500">
              วิเคราะห์สถิติการกดแต่ละ Rich Menu และพื้นที่ภายใน Rich Menu
            </p>
          </div>
          <Card className="border border-default-100/80 bg-background/60 shadow-sm backdrop-blur-sm">
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
    </div>
  );
}
