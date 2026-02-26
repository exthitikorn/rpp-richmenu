"use client";

import type { RichMenu, RichMenuArea } from "@/app/generated/prisma/client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";

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

  useEffect(() => {
    setRichMenu(initial);
  }, [initial.id, initial.updatedAt, initial.areas.length]);

  const selectedArea =
    selectedAreaIndex !== null
      ? (richMenu.areas[selectedAreaIndex] ?? null)
      : null;

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
      const data = (await res.json()) as { success?: boolean; error?: string };

      if (data.success) router.refresh();
      else alert(data.error ?? "Deploy ไม่สำเร็จ");
    } finally {
      setDeploying(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1">
        <RichMenuPreview
          areas={richMenu.areas}
          height={richMenu.height}
          imageUrl={richMenu.imageUrl}
          selectedIndex={selectedAreaIndex}
          width={richMenu.width}
          onSelectArea={setSelectedAreaIndex}
        />
        <div className="mt-4 flex gap-2">
          <Button color="primary" onPress={saveAreas}>
            บันทึกการแก้ไข
          </Button>
          <Button
            color="success"
            isDisabled={richMenu.status === "DEPLOYED"}
            isLoading={deploying}
            onPress={handleDeploy}
          >
            {richMenu.status === "DEPLOYED"
              ? "Deployed แล้ว"
              : "Deploy ไป LINE"}
          </Button>
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
