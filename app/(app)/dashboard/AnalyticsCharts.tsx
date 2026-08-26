"use client";

import type { LabelProps } from "recharts";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Text,
} from "recharts";

type ByMenu = { richMenuId: string; count: number };
type ByArea = { richMenuId: string; areaIndex: number; _count: number };

type SingleLineBarLabelProps = LabelProps & {
  value?: string | number;
  width?: number | string;
  height?: number | string;
  x?: number;
  y?: number;
};

const SingleLineBarLabel = (props: SingleLineBarLabelProps) => {
  const { value } = props;

  const viewBox =
    props.viewBox && typeof props.viewBox === "object"
      ? (props.viewBox as unknown as {
          x?: number;
          y?: number;
          width?: number;
          height?: number;
        })
      : undefined;

  const x = typeof props.x === "number" ? props.x : (viewBox?.x ?? 0);
  const y = typeof props.y === "number" ? props.y : (viewBox?.y ?? 0);
  const width =
    typeof props.width === "number"
      ? props.width
      : typeof viewBox?.width === "number"
        ? viewBox.width
        : undefined;
  const height =
    typeof props.height === "number"
      ? props.height
      : typeof viewBox?.height === "number"
        ? viewBox.height
        : 0;

  const pad = Math.max(props.offset ?? 0, 0);
  const text = value != null ? String(value) : "";
  const yCenter = y + height / 2;

  return (
    <Text
      fill="white"
      fontSize={14}
      maxLines={1}
      scaleToFit={false}
      textAnchor="start"
      verticalAnchor="middle"
      width={typeof width === "number" ? Math.max(width - pad * 2, 0) : width}
      x={x + pad}
      y={yCenter}
    >
      {text}
    </Text>
  );
};

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

  const areaData = byArea.slice(0, 15).map((a, index) => {
    const menuName = menuNames[a.richMenuId] ?? a.richMenuId.slice(0, 6);
    const label = `เมนู ${menuName} ปุ่ม #${a.areaIndex + 1}`;

    return {
      // ป้ายสั้นๆ บนแกน Y เพื่อไม่ให้ยาวเกินไป
      indexLabel: `#${index + 1}`,
      // ชื่อปุ่มแบบเต็มสำหรับแสดงบนแท่งกราฟ
      label,
      คลิก: a._count,
    };
  });

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
            <BarChart responsive data={menuData}>
              <CartesianGrid
                stroke={chartTheme.gridStroke}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="name"
                stroke={chartTheme.axisTick}
                tick={{ fontSize: 14, fill: chartTheme.axisTick }}
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
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <caption className="sr-only">
            ตารางจำนวนการกดต่อ Rich Menu สำหรับผู้อ่านหน้าจอ
          </caption>
          <thead>
            <tr className="border-b border-default-200 text-left text-[0.7rem] text-default-500">
              <th className="py-1 pr-3" scope="col">
                Rich Menu
              </th>
              <th className="py-1 pr-3 text-right" scope="col">
                จำนวนคลิก
              </th>
            </tr>
          </thead>
          <tbody>
            {menuData.map((row) => (
              <tr
                key={row.name}
                className="border-b border-default-100 last:border-0"
              >
                <td className="py-1 pr-3">{row.name}</td>
                <td className="py-1 pr-3 text-right">
                  {row.คลิก.toLocaleString("th-TH")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
            <BarChart data={areaData} layout="vertical" margin={{ left: 30 }}>
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
                dataKey="indexLabel"
                stroke={chartTheme.axisTick}
                tick={{ fontSize: 14, fill: chartTheme.axisTick }}
                type="category"
                width={10}
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
                radius={[0, 10, 10, 0]}
              >
                <LabelList
                  content={<SingleLineBarLabel />}
                  dataKey="label"
                  offset={10}
                  position="insideLeft"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <caption className="sr-only">
              ตารางปุ่มที่ถูกกดสูงสุดสำหรับผู้อ่านหน้าจอ
            </caption>
            <thead>
              <tr className="border-b border-default-200 text-left text-[0.7rem] text-default-500">
                <th className="py-1 pr-3" scope="col">
                  อันดับ
                </th>
                <th className="py-1 pr-3" scope="col">
                  ปุ่ม
                </th>
                <th className="py-1 pr-3 text-right" scope="col">
                  จำนวนคลิก
                </th>
              </tr>
            </thead>
            <tbody>
              {areaData.map((row, index) => (
                <tr
                  key={`${row.indexLabel}-${index}`}
                  className="border-b border-default-100 last:border-0"
                >
                  <td className="py-1 pr-3">{index + 1}</td>
                  <td className="py-1 pr-3">{row.label}</td>
                  <td className="py-1 pr-3 text-right">
                    {row.คลิก.toLocaleString("th-TH")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
