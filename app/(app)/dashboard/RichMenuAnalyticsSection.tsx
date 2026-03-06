"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";

type HeatmapArea = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  clickCount: number;
};

export type RichMenuAnalyticsMenu = {
  id: string;
  name: string;
  lineAccountName: string;
  width: number;
  height: number;
  imageUrl: string;
  totalClicks: number;
  areas: HeatmapArea[];
};

type Props = {
  menus: RichMenuAnalyticsMenu[];
  totalClicks: number;
};

const MAX_PREVIEW = 400;

function RichMenuHeatmap({ menu }: { menu: RichMenuAnalyticsMenu }) {
  const { width, height, imageUrl, areas } = menu;
  const maxAreaClicks =
    areas.length > 0
      ? areas.reduce(
          (max, area) => (area.clickCount > max ? area.clickCount : max),
          0,
        )
      : 0;

  const scale = useMemo(() => {
    if (width <= 0 || height <= 0) return 1;

    const s = Math.min(MAX_PREVIEW / width, MAX_PREVIEW / height, 1);

    return s;
  }, [width, height]);

  const displayWidth = width * scale;
  const displayHeight = height * scale;

  return (
    <div className="space-y-3">
      <div
        className="relative inline-block overflow-hidden rounded-xl border border-default-200 bg-default-100/80 shadow-sm"
        style={{ width: displayWidth, height: displayHeight }}
      >
        <Image
          alt={menu.name || "Rich Menu"}
          className="block w-full h-full object-contain"
          draggable={false}
          height={displayHeight}
          src={imageUrl}
          width={displayWidth}
        />
        {areas.map((area) => {
          const intensity =
            maxAreaClicks > 0 ? area.clickCount / maxAreaClicks : 0;
          const baseAlpha = 0.18;
          const extraAlpha = intensity * 0.55;
          const backgroundColor = `hsl(var(--heroui-primary) / ${baseAlpha + extraAlpha})`;
          const borderColor = `hsl(var(--heroui-primary) / ${0.4 + intensity * 0.5})`;

          return (
            <div
              key={area.id}
              className="absolute flex items-center justify-center"
              style={{
                left: area.x * scale,
                top: area.y * scale,
                width: area.width * scale,
                height: area.height * scale,
                borderWidth: 2,
                borderStyle: "solid",
                borderColor,
                backgroundColor,
              }}
            >
              <span className="rounded-full bg-primary/90 px-2 py-0.5 text-[0.7rem] font-medium text-primary-foreground shadow-sm">
                #{area.index + 1} ({area.clickCount.toLocaleString("th-TH")})
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-default-500">
        สีเข้มขึ้นหมายถึงปุ่มที่ถูกกดบ่อยกว่า
      </p>
    </div>
  );
}

export function RichMenuAnalyticsSection({ menus, totalClicks }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    menus.length > 0 ? (menus[0]?.id ?? null) : null,
  );

  if (menus.length === 0) {
    return (
      <Card className="border border-dashed border-default-200 bg-default-50/60">
        <CardBody>
          <p className="text-sm text-default-500">
            ยังไม่มีข้อมูลการคลิก Rich Menu
          </p>
        </CardBody>
      </Card>
    );
  }

  const selectedMenu =
    menus.find((m) => m.id === selectedId) ?? menus[0] ?? null;

  if (!selectedMenu) {
    return null;
  }

  const totalForSelected = selectedMenu.totalClicks;
  const percentage =
    totalClicks > 0 ? Math.round((totalForSelected / totalClicks) * 100) : 0;

  const topAreas = [...selectedMenu.areas]
    .filter((area) => area.clickCount > 0)
    .sort((a, b) => b.clickCount - a.clickCount)
    .slice(0, 5);

  return (
    <Card className="border border-default-100/80 bg-background/60 shadow-sm backdrop-blur-sm">
      <CardHeader className="flex flex-col gap-3 border-b border-default-100 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Heat map การกด Rich Menu</p>
          <p className="text-xs text-default-500">
            เลือก Rich Menu เพื่อดูความถี่การกดในแต่ละปุ่มจากภาพรวมการใช้งานจริง
          </p>
        </div>
        <div className="w-full max-w-xs">
          <Select
            aria-label="เลือก Rich Menu"
            items={menus}
            label="Rich Menu"
            labelPlacement="outside"
            placeholder="เลือก Rich Menu"
            renderValue={(items) => {
              const item = items?.[0];
              const fromItem = item?.rendered ?? item?.textValue;

              if (fromItem) return fromItem;
              if (selectedId) {
                const menu = menus.find((m) => m.id === selectedId);

                return menu ? `${menu.name} (${menu.lineAccountName})` : null;
              }

              return null;
            }}
            selectedKeys={selectedId ? [selectedId] : []}
            size="sm"
            onSelectionChange={(keys) => {
              if (keys === "all") return;
              const [first] = Array.from(keys as Set<string>);

              setSelectedId(first ?? null);
            }}
          >
            {(menu) => {
              const label = `${menu.name} (${menu.lineAccountName})`;

              return (
                <SelectItem key={menu.id} textValue={label}>
                  {label}
                </SelectItem>
              );
            }}
          </Select>
        </div>
      </CardHeader>
      <CardBody>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="space-y-4 lg:w-2/3">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {selectedMenu.name} ({selectedMenu.lineAccountName})
              </p>
              <p className="text-xs text-default-500">
                คลิกทั้งหมดในเมนูนี้{" "}
                <span className="font-semibold">
                  {totalForSelected.toLocaleString("th-TH")}
                </span>{" "}
                ครั้ง ({percentage}% ของคลิกทั้งหมดในระบบ)
              </p>
            </div>
            <RichMenuHeatmap menu={selectedMenu} />
          </div>

          <div className="space-y-3 lg:w-1/3">
            <p className="text-sm font-medium">Top ปุ่มในเมนูนี้</p>
            {topAreas.length === 0 ? (
              <p className="text-xs text-default-500">
                ยังไม่มีการคลิกในเมนูนี้
              </p>
            ) : (
              <ul className="space-y-2 text-xs">
                {topAreas.map((area) => {
                  const areaRatio =
                    totalForSelected > 0
                      ? area.clickCount / totalForSelected
                      : 0;
                  const widthPercent = Math.max(areaRatio * 100, 10);

                  return (
                    <li
                      key={area.id}
                      className="overflow-hidden rounded-lg border border-default-200 bg-default-50/70"
                    >
                      <div className="flex items-center justify-between px-2 py-1.5">
                        <span className="text-[0.75rem] font-medium">
                          ปุ่ม #{area.index + 1}
                        </span>
                        <span className="text-[0.7rem] text-default-500">
                          {area.clickCount.toLocaleString("th-TH")} ครั้ง
                        </span>
                      </div>
                      <div className="relative h-1.5 bg-default-100">
                        <div
                          className="absolute inset-y-0 left-0 rounded-r-full bg-primary/80"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
