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

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-lg border border-default-200 p-4">
        <h3 className="mb-4 font-medium">คลิกต่อ Rich Menu</h3>
        <div className="h-64">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={menuData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="คลิก"
                fill="hsl(var(--heroui-primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-lg border border-default-200 p-4">
        <h3 className="mb-4 font-medium">Top ปุ่ม (คลิกสูงสุด)</h3>
        <div className="h-64">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={areaData} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                type="category"
                width={80}
              />
              <Tooltip />
              <Bar
                dataKey="คลิก"
                fill="hsl(var(--heroui-secondary))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
