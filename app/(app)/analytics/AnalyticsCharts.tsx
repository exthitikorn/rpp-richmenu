"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ByMenu = { richMenuId: string; count: number };
type ByArea = { richMenuId: string; areaIndex: number; _count: number };

export function AnalyticsCharts({
  byArea,
  byMenu,
  menuNames,
}: {
  byArea: ByArea[];
  byMenu: ByMenu[];
  menuNames: Record<string, string>;
}) {
  const menuData = byMenu.map((m) => ({
    name: menuNames[m.richMenuId] ?? m.richMenuId.slice(0, 8),
    คลิก: m.count,
  }));

  const areaData = byArea.slice(0, 15).map((a) => ({
    name: `เมนู ${menuNames[a.richMenuId] ?? a.richMenuId.slice(0, 6)} ปุ่ม #${a.areaIndex + 1}`,
    คลิก: a._count,
  }));

  const chartTheme = {
    gridStroke: "hsl(var(--heroui-default-200))",
    axisTick: "hsl(var(--heroui-foreground) / 0.7)",
    barPrimary: "hsl(var(--heroui-primary))",
    barSecondary: "hsl(var(--heroui-secondary))",
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-w-0 rounded-lg border border-default-200 p-4">
        <h3 className="mb-4 font-medium">คลิกต่อ Rich Menu</h3>
        <div className="h-64 min-h-0 w-full">
          <ResponsiveContainer
            height="100%"
            minHeight={0}
            minWidth={0}
            width="100%"
          >
            <BarChart data={menuData}>
              <CartesianGrid
                stroke={chartTheme.gridStroke}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="name"
                stroke={chartTheme.axisTick}
                tick={{ fontSize: 12, fill: chartTheme.axisTick }}
              />
              <YAxis
                stroke={chartTheme.axisTick}
                tick={{ fill: chartTheme.axisTick }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--heroui-background))",
                  border: "1px solid hsl(var(--heroui-default-200))",
                  borderRadius: "var(--heroui-radius-medium)",
                }}
                labelStyle={{ color: "hsl(var(--heroui-foreground))" }}
              />
              <Bar
                dataKey="คลิก"
                fill={chartTheme.barPrimary}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="min-w-0 rounded-lg border border-default-200 p-4">
        <h3 className="mb-4 font-medium">Top ปุ่ม (คลิกสูงสุด)</h3>
        <div className="h-64 min-h-0 w-full">
          <ResponsiveContainer
            height="100%"
            minHeight={0}
            minWidth={0}
            width="100%"
          >
            <BarChart data={areaData} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid
                stroke={chartTheme.gridStroke}
                strokeDasharray="3 3"
              />
              <XAxis
                stroke={chartTheme.axisTick}
                tick={{ fill: chartTheme.axisTick }}
                type="number"
              />
              <YAxis
                dataKey="name"
                stroke={chartTheme.axisTick}
                tick={{ fontSize: 11, fill: chartTheme.axisTick }}
                type="category"
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--heroui-background))",
                  border: "1px solid hsl(var(--heroui-default-200))",
                  borderRadius: "var(--heroui-radius-medium)",
                }}
                labelStyle={{ color: "hsl(var(--heroui-foreground))" }}
              />
              <Bar
                dataKey="คลิก"
                fill={chartTheme.barSecondary}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
