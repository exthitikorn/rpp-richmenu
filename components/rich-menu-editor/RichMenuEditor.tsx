"use client";

import type { RichMenu, RichMenuArea } from "@/app/generated/prisma/client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";

import { getRichMenuAliasId } from "@/lib/rich-menu/alias";
import { RichMenuPreview } from "./RichMenuPreview";
import { AreaActionForm } from "./AreaActionForm";

type RichMenuWithAreas = RichMenu & { areas: RichMenuArea[] };

export function RichMenuEditor({
  richMenu: initial,
}: {
  richMenu: RichMenuWithAreas;
}) {
  const router = useRouter();
  const [richMenu, setRichMenu] = useState(initial);
  const [selectedAreaIndex, setSelectedAreaIndex] = useState<number | null>(
    null,
  );
  const [deploying, setDeploying] = useState(false);
  const [settingDefault, setSettingDefault] = useState(false);

  useEffect(() => {
    setRichMenu(initial);
  }, [initial.id, initial.updatedAt, initial.areas.length]);

  const selectedArea =
    selectedAreaIndex !== null
      ? (richMenu.areas[selectedAreaIndex] ?? null)
      : null;

  const aliasId = getRichMenuAliasId(richMenu.id);

  function updateArea(index: number, data: Partial<RichMenuArea>) {
    setRichMenu((prev) => ({
      ...prev,
      areas: prev.areas.map((a, i) => (i === index ? { ...a, ...data } : a)),
    }));
  }

  async function saveAreas() {
    await fetch(`/api/rich-menus/${richMenu.id}/areas`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        areas: richMenu.areas.map((a) => ({
          x: a.x,
          y: a.y,
          width: a.width,
          height: a.height,
          order: a.order,
          actionType: a.actionType,
          action: a.action,
        })),
      }),
    });
    router.refresh();
  }

  async function handleDeploy() {
    setDeploying(true);
    try {
      const res = await fetch(`/api/rich-menus/${richMenu.id}/deploy`, {
        method: "POST",
      });
      let data: {
        success?: boolean;
        error?: string;
        hint?: string;
      } = {};
      const contentType = res.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        try {
          data = (await res.json()) as {
            success?: boolean;
            error?: string;
            hint?: string;
          };
        } catch {
          // ignore JSON parse error and fall back to generic message
        }
      }

      if (data.success) {
        router.refresh();
        if (data.hint) {
          alert(`Deploy สำเร็จ\n\n${data.hint}`);
        }
      } else {
        const errorMessage =
          data.error ??
          (!res.ok
            ? `Deploy ไม่สำเร็จ (status ${res.status})`
            : "Deploy ไม่สำเร็จ");
        alert(errorMessage);
      }
    } finally {
      setDeploying(false);
    }
  }

  async function handleSetDefault() {
    if (!richMenu.lineRichMenuId) return;
    setSettingDefault(true);
    try {
      const res = await fetch(`/api/rich-menus/${richMenu.id}/set-default`, {
        method: "POST",
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (data.success) {
        router.refresh();
        alert("ตั้งเป็น Default แล้ว — เมนูนี้จะแสดงเป็นหน้าแรกให้ผู้ใช้ใหม่");
      } else {
        alert(data.error ?? "ตั้ง Default ไม่สำเร็จ");
      }
    } finally {
      setSettingDefault(false);
    }
  }

  const canSetDefault =
    Boolean(richMenu.lineRichMenuId) && richMenu.status === "DEPLOYED";

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1">
        <p className="mb-2 text-sm text-default-500">
          Rich Menu Alias ID สำหรับใช้ใน action แบบ Switch Rich Menu คือ{" "}
          <span className="font-mono font-semibold">{aliasId}</span>
        </p>
        <RichMenuPreview
          areas={richMenu.areas}
          height={richMenu.height}
          imageUrl={richMenu.imageUrl}
          selectedIndex={selectedAreaIndex}
          width={richMenu.width}
          onSelectArea={setSelectedAreaIndex}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button color="primary" onPress={saveAreas}>
            บันทึกการแก้ไข
          </Button>
          <Button
            color="success"
            isLoading={deploying}
            onPress={handleDeploy}
          >
            {richMenu.status === "DEPLOYED"
              ? "Deploy ใหม่ไป LINE"
              : "Deploy ไป LINE"}
          </Button>
          {canSetDefault && (
            <Button
              color={richMenu.isDefault ? "default" : "secondary"}
              isDisabled={richMenu.isDefault}
              isLoading={settingDefault}
              onPress={handleSetDefault}
              variant={richMenu.isDefault ? "flat" : "bordered"}
            >
              {richMenu.isDefault ? "เป็น Default อยู่แล้ว" : "ตั้งเป็น Default"}
            </Button>
          )}
        </div>
      </div>
      <div className="w-full lg:w-80 shrink-0">
        {selectedArea ? (
          <AreaActionForm
            area={selectedArea}
            onClose={() => setSelectedAreaIndex(null)}
            onSave={(data) => {
              if (selectedAreaIndex !== null) {
                updateArea(selectedAreaIndex, {
                  actionType: data.actionType,
                  action: data.action as RichMenuArea["action"],
                });
              }
              setSelectedAreaIndex(null);
            }}
          />
        ) : (
          <p className="text-default-500 text-sm">
            คลิกที่พื้นที่บนรูปเพื่อแก้ไข action
          </p>
        )}
      </div>
    </div>
  );
}
