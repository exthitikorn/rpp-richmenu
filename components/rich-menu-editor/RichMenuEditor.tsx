"use client";

import type { RichMenu, RichMenuArea } from "@/app/generated/prisma/client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";

import { RichMenuPreview } from "./RichMenuPreview";
import { AreaActionForm } from "./AreaActionForm";

import { getRichMenuAliasId } from "@/lib/rich-menu/alias";
import { useAppToast } from "@/components/AppToastProvider";

type RichMenuWithAreas = RichMenu & { areas: RichMenuArea[] };

export function RichMenuEditor({
  richMenu: initial,
}: {
  richMenu: RichMenuWithAreas;
}) {
  const router = useRouter();
  const toast = useAppToast();
  const [richMenu, setRichMenu] = useState(initial);
  const [selectedAreaIndex, setSelectedAreaIndex] = useState<number | null>(
    null,
  );
  const [deploying, setDeploying] = useState(false);
  const [settingDefault, setSettingDefault] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [clearingAreas, setClearingAreas] = useState(false);
  const {
    isOpen: isClearAreasModalOpen,
    onOpen: onOpenClearAreasModal,
    onOpenChange: onClearAreasModalOpenChange,
  } = useDisclosure();

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

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();

      formData.set("image", file);
      const res = await fetch(`/api/rich-menus/${richMenu.id}/image`, {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        imageUrl?: string;
      };

      if (!res.ok || !data.success) {
        const message = data.error ?? "อัปโหลดรูปไม่สำเร็จ";

        toast.error(message);

        return;
      }
      if (data.imageUrl) {
        setRichMenu((prev) => ({
          ...prev,
          imageUrl: data.imageUrl ?? prev.imageUrl,
        }));
      }
      router.refresh();
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  async function saveAreas() {
    const res = await fetch(`/api/rich-menus/${richMenu.id}/areas`, {
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

    let data: { success?: boolean; error?: string } = {};
    const contentType = res.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      try {
        data = (await res.json()) as { success?: boolean; error?: string };
      } catch {
        // ignore JSON parse error and fall back to generic message
      }
    }

    if (data.success) {
      toast.success("บันทึกการแก้ไขสำเร็จ");
      router.refresh();
    } else {
      const errorMessage =
        data.error ??
        (!res.ok
          ? `บันทึกไม่สำเร็จ (status ${res.status})`
          : "บันทึกไม่สำเร็จ");

      toast.error(errorMessage);
    }
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
          toast.success("Deploy สำเร็จ", {
            description: data.hint,
          });
        }
      } else {
        const errorMessage =
          data.error ??
          (!res.ok
            ? `Deploy ไม่สำเร็จ (status ${res.status})`
            : "Deploy ไม่สำเร็จ");

        toast.error(errorMessage);
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
        toast.success(
          "ตั้งเป็น Default แล้ว — เมนูนี้จะแสดงเป็นหน้าแรกให้ผู้ใช้ใหม่",
        );
      } else {
        const message = data.error ?? "ตั้ง Default ไม่สำเร็จ";

        toast.error(message);
      }
    } finally {
      setSettingDefault(false);
    }
  }

  async function handleClearAreas() {
    setClearingAreas(true);
    try {
      const res = await fetch(`/api/rich-menus/${richMenu.id}/areas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areas: [] }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || !data.success) {
        toast.error(data.error ?? "ล้าง Areas ไม่สำเร็จ");

        return;
      }

      setRichMenu((prev) => ({ ...prev, areas: [] }));
      setSelectedAreaIndex(null);
      onClearAreasModalOpenChange();
      router.refresh();
      toast.success("ล้าง Areas เรียบร้อยแล้ว");
    } finally {
      setClearingAreas(false);
    }
  }

  const canSetDefault =
    Boolean(richMenu.lineRichMenuId) && richMenu.status === "DEPLOYED";

  return (
    <Card>
      <CardBody>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="w-full space-y-4 lg:w-1/2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-default-700">
                Rich Menu Alias ID
              </p>
              <p className="text-xs text-default-500">
                ใช้ใน action แบบ Switch Rich Menu
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  isReadOnly
                  aria-label="Rich Menu Alias ID"
                  className="max-w-xs font-mono"
                  size="sm"
                  value={aliasId}
                  onClick={(event) => {
                    const target = event.currentTarget;

                    target.select();
                  }}
                />
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => {
                    void navigator.clipboard.writeText(aliasId);
                  }}
                >
                  คัดลอก
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-default-700">
                รูป Rich Menu
              </p>
              <p className="text-xs text-default-500">
                ขนาดต้องตรงกับ {richMenu.width}×{richMenu.height}px และเป็น JPEG
                หรือ PNG
              </p>
              <Input
                accept="image/jpeg,image/png"
                aria-label="อัปโหลดรูป Rich Menu ใหม่"
                className="max-w-xs"
                isDisabled={uploadingImage}
                size="sm"
                type="file"
                onChange={handleImageChange}
              />
            </div>

            <RichMenuPreview
              areas={richMenu.areas}
              height={richMenu.height}
              imageUrl={richMenu.imageUrl}
              selectedIndex={selectedAreaIndex}
              width={richMenu.width}
              onSelectArea={setSelectedAreaIndex}
            />

            <div className="flex flex-wrap gap-2">
              <Button color="primary" onPress={saveAreas}>
                บันทึกการแก้ไข
              </Button>
              <Button
                color="warning"
                isDisabled={richMenu.areas.length === 0}
                onPress={onOpenClearAreasModal}
              >
                ล้าง Areas
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
                  variant={richMenu.isDefault ? "flat" : "bordered"}
                  onPress={handleSetDefault}
                >
                  {richMenu.isDefault
                    ? "เป็น Default อยู่แล้ว"
                    : "ตั้งเป็น Default"}
                </Button>
              )}
            </div>
          </div>

          <div className="w-full space-y-3 lg:w-1/2 lg:max-w-xl">
            {selectedArea ? (
              <div className="items-center justify-center mt-30">
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
              </div>
            ) : (
              <p className="text-default-500 text-lg font-bold flex items-center justify-center mt-50">
                คลิกที่พื้นที่บนรูปเพื่อแก้ไข action
              </p>
            )}
          </div>
        </div>
      </CardBody>
      <Modal
        isOpen={isClearAreasModalOpen}
        onOpenChange={onClearAreasModalOpenChange}
      >
        <ModalContent>
          <ModalHeader>ยืนยันการล้าง Areas</ModalHeader>
          <ModalBody>
            <p>คุณต้องการล้าง Areas ทั้งหมดของ Rich Menu นี้ใช่หรือไม่?</p>
            <p className="text-default-500 text-sm">
              การล้าง Areas จะลบจุดกดทั้งหมดบนรูป และไม่สามารถย้อนกลับได้
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="light"
              onPress={() => onClearAreasModalOpenChange()}
            >
              ยกเลิก
            </Button>
            <Button
              color="warning"
              isLoading={clearingAreas}
              onPress={handleClearAreas}
            >
              ยืนยันล้าง Areas
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
}
