"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { Card, CardBody } from "@heroui/card";

import { ImportRichMenuAreaPanel } from "./ImportRichMenuAreaPanel";
import { ImportRichMenuCanvas } from "./ImportRichMenuCanvas";
import {
  mapInitialAreasToDrafts,
  normalizeAreasForSubmit,
  type AreaDraft,
  type EditInitialData,
  type LineAccountOption,
  type RichMenuAliasOption,
} from "./import-rich-menu-types";

import { getRichMenuAliasId } from "@/lib/richmenu/alias";
import { validateImageByteSize } from "@/lib/richmenu/parser";
import { useAppToast } from "@/components/AppToastProvider";

export function ImportRichMenuForm({
  lineAccounts,
  defaultLineAccountId,
  mode = "import",
  initialData = null,
}: {
  lineAccounts: LineAccountOption[];
  defaultLineAccountId: string | null;
  mode?: "import" | "edit";
  initialData?: EditInitialData | null;
}) {
  const router = useRouter();
  const toast = useAppToast();
  const {
    isOpen: isClearAreasModalOpen,
    onOpen: onOpenClearAreasModal,
    onOpenChange: onClearAreasModalOpenChange,
  } = useDisclosure();
  const isEditMode = mode === "edit" && initialData !== null;
  const isLineAccountLocked =
    !!defaultLineAccountId &&
    lineAccounts.some((la) => la.id === defaultLineAccountId);
  const aliasId = initialData ? getRichMenuAliasId(initialData.richMenuId) : "";
  const [lineAccountId, setLineAccountId] = useState(
    initialData?.lineAccountId ?? defaultLineAccountId ?? "",
  );
  const [name, setName] = useState(initialData?.name ?? "");
  const [chatBarText, setChatBarText] = useState(
    initialData?.chatBarText ?? "Menu",
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(
    initialData?.imageUrl ?? "",
  );
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>(
    initialData
      ? { width: initialData.width, height: initialData.height }
      : { width: 0, height: 0 },
  );
  const [areas, setAreas] = useState<AreaDraft[]>(() =>
    initialData ? mapInitialAreasToDrafts(initialData.areas) : [],
  );
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [settingDefault, setSettingDefault] = useState(false);
  const [clearingAreas, setClearingAreas] = useState(false);
  const [loadingAliases, setLoadingAliases] = useState(false);
  const [availableAliases, setAvailableAliases] = useState<
    RichMenuAliasOption[]
  >([]);
  const [editStatus, setEditStatus] = useState(initialData?.status ?? "");
  const [isDefaultRichMenu, setIsDefaultRichMenu] = useState(
    initialData?.isDefault ?? false,
  );
  const [zoomPercent, setZoomPercent] = useState(25);

  useEffect(() => {
    if (!imageFile) {
      if (!isEditMode) {
        setImagePreviewUrl("");
        setImageSize({ width: 0, height: 0 });
      }

      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);

    setImagePreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile, isEditMode]);

  useEffect(() => {
    if (!lineAccountId) {
      setAvailableAliases([]);

      return;
    }

    let isCancelled = false;

    async function fetchAliases() {
      setLoadingAliases(true);
      try {
        const res = await fetch(
          `/api/rich-menus/aliases?lineAccountId=${encodeURIComponent(lineAccountId)}`,
        );
        const data = (await res.json()) as {
          success?: boolean;
          error?: string;
          aliases?: RichMenuAliasOption[];
        };

        if (!res.ok || !data.success) {
          throw new Error(data.error ?? "โหลด Alias ไม่สำเร็จ");
        }
        if (!isCancelled) {
          setAvailableAliases(data.aliases ?? []);
        }
      } catch {
        if (!isCancelled) {
          setAvailableAliases([]);
        }
      } finally {
        if (!isCancelled) {
          setLoadingAliases(false);
        }
      }
    }

    void fetchAliases();

    return () => {
      isCancelled = true;
    };
  }, [lineAccountId]);

  async function handleDeploy() {
    if (!isEditMode || !initialData) {
      return;
    }
    setDeploying(true);
    try {
      const res = await fetch(
        `/api/rich-menus/${initialData.richMenuId}/deploy`,
        {
          method: "POST",
        },
      );
      let data: { success?: boolean; error?: string; hint?: string } = {};
      const contentType = res.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        try {
          data = (await res.json()) as {
            success?: boolean;
            error?: string;
            hint?: string;
          };
        } catch {
          // ignore JSON parse error and show fallback message
        }
      }

      if (!res.ok || !data.success) {
        const message =
          data.error ??
          (!res.ok
            ? `Deploy ไม่สำเร็จ (status ${res.status})`
            : "Deploy ไม่สำเร็จ");

        toast.error(message);

        return;
      }

      setEditStatus("DEPLOYED");
      router.refresh();
      toast.success("Deploy สำเร็จ", {
        description: data.hint,
      });
    } finally {
      setDeploying(false);
    }
  }

  async function handleSetDefault() {
    if (!isEditMode || !initialData || !initialData.lineRichMenuId) {
      return;
    }
    setSettingDefault(true);
    try {
      const res = await fetch(
        `/api/rich-menus/${initialData.richMenuId}/set-default`,
        {
          method: "POST",
        },
      );
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        hint?: string;
      };

      if (!res.ok || !data.success) {
        toast.error(data.error ?? "ตั้ง Default ไม่สำเร็จ");

        return;
      }

      setIsDefaultRichMenu(true);
      router.refresh();
      toast.success("ตั้งเป็น Default แล้ว", {
        description: data.hint,
      });
    } finally {
      setSettingDefault(false);
    }
  }

  async function handleClearAreas() {
    if (!isEditMode || !initialData) {
      return;
    }
    setClearingAreas(true);
    try {
      const res = await fetch(
        `/api/rich-menus/${initialData.richMenuId}/areas`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ areas: [] }),
        },
      );
      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || !data.success) {
        toast.error(data.error ?? "ล้าง Areas ไม่สำเร็จ");

        return;
      }

      setAreas([]);
      setSelectedAreaId("");
      onClearAreasModalOpenChange();
      router.refresh();
      toast.success("ล้าง Areas เรียบร้อยแล้ว");
    } finally {
      setClearingAreas(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !lineAccountId ||
      (!isEditMode && !imageFile) ||
      (isEditMode && !imageFile && !imagePreviewUrl) ||
      imageSize.width <= 0 ||
      imageSize.height <= 0
    ) {
      const message = isEditMode
        ? "กรุณาตรวจสอบข้อมูล Rich Menu และรูปภาพให้เรียบร้อย"
        : "กรุณาเลือก LINE Account และอัปโหลดรูปภาพให้เรียบร้อย";

      toast.error(message);

      return;
    }
    if (areas.length === 0) {
      toast.error("กรุณาวาดพื้นที่กดอย่างน้อย 1 พื้นที่");

      return;
    }

    if (imageFile) {
      try {
        validateImageByteSize(imageFile.size);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "ขนาดไฟล์รูปไม่ถูกต้อง",
        );

        return;
      }
    }

    setLoading(true);
    try {
      const normalizedAreas = normalizeAreasForSubmit(areas);

      const richMenuJson = {
        size: {
          width: imageSize.width,
          height: imageSize.height,
        },
        selected: false,
        name: name.trim() || `Imported Rich Menu ${new Date().toISOString()}`,
        chatBarText: chatBarText.trim() || "Tap here",
        areas: normalizedAreas,
      };

      if (isEditMode && initialData) {
        const patchRes = await fetch(
          `/api/rich-menus/${initialData.richMenuId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: richMenuJson.name,
              chatBarText: richMenuJson.chatBarText,
            }),
          },
        );
        const patchData = (await patchRes.json()) as {
          success?: boolean;
          error?: string;
        };

        if (!patchRes.ok || !patchData.success) {
          throw new Error(patchData.error ?? "บันทึกชื่อ Rich Menu ไม่สำเร็จ");
        }

        const areasRes = await fetch(
          `/api/rich-menus/${initialData.richMenuId}/areas`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              areas: normalizedAreas.map((area, index) => ({
                x: area.bounds.x,
                y: area.bounds.y,
                width: area.bounds.width,
                height: area.bounds.height,
                order: index + 1,
                actionType: area.action.type,
                action: area.action,
              })),
            }),
          },
        );
        const areasData = (await areasRes.json()) as {
          success?: boolean;
          error?: string;
        };

        if (!areasRes.ok || !areasData.success) {
          throw new Error(areasData.error ?? "บันทึก Areas ไม่สำเร็จ");
        }

        if (imageFile) {
          const imageFormData = new FormData();

          imageFormData.set("image", imageFile);
          const imageRes = await fetch(
            `/api/rich-menus/${initialData.richMenuId}/image`,
            {
              method: "POST",
              body: imageFormData,
            },
          );
          const imageData = (await imageRes.json()) as {
            success?: boolean;
            error?: string;
            imageUrl?: string;
          };

          if (!imageRes.ok || !imageData.success) {
            throw new Error(imageData.error ?? "อัปโหลดรูปไม่สำเร็จ");
          }
        }

        setLoading(false);
        toast.success("บันทึก Rich Menu เรียบร้อยแล้ว");
        router.refresh();

        return;
      }

      if (!imageFile) {
        throw new Error("กรุณาอัปโหลดรูปภาพ");
      }

      const formData = new FormData();

      formData.set("lineAccountId", lineAccountId);
      const jsonBlob = new Blob([JSON.stringify(richMenuJson, null, 2)], {
        type: "application/json",
      });
      const jsonFile = new File([jsonBlob], "richmenu.json", {
        type: "application/json",
      });

      formData.set("json", jsonFile);
      formData.set("image", imageFile);
      const res = await fetch("/api/rich-menus/import", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        richMenuId?: string;
      };

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Import ไม่สำเร็จ");
      }
      if (data.richMenuId) {
        toast.success("นำเข้า Rich Menu เรียบร้อยแล้ว");
        router.push(`/rich-menus/${data.richMenuId}/edit`);

        return;
      }
      setLoading(false);
      toast.success("นำเข้า Rich Menu เรียบร้อยแล้ว");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";

      toast.error(message);
      setLoading(false);
    }
  }

  const canSetDefault =
    isEditMode &&
    Boolean(initialData?.lineRichMenuId) &&
    editStatus === "DEPLOYED";

  const selectedArea =
    areas.find((area) => area.id === selectedAreaId) ?? areas[0] ?? null;
  const selectedAreaIndex = selectedArea
    ? areas.findIndex((area) => area.id === selectedArea.id)
    : -1;

  return (
    <Card className="w-full">
      <CardBody>
        <form
          noValidate
          className="flex flex-col gap-6"
          onSubmit={handleSubmit}
        >
          <section
            className={
              isEditMode
                ? "grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3"
                : "grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4"
            }
          >
            {isEditMode ? null : isLineAccountLocked ? (
              <Input
                isReadOnly
                isRequired
                label="LINE Account"
                labelPlacement="outside"
                value={
                  lineAccounts.find((la) => la.id === lineAccountId)?.name ?? ""
                }
              />
            ) : (
              <Select
                isRequired
                classNames={{ trigger: "min-h-10" }}
                label="LINE Account"
                labelPlacement="outside"
                placeholder="เลือก account"
                selectedKeys={
                  lineAccountId ? new Set([lineAccountId]) : new Set()
                }
                onSelectionChange={(keys) => {
                  const k = Array.from(keys)[0];

                  setLineAccountId(k != null ? String(k) : "");
                }}
              >
                {lineAccounts.map((la) => (
                  <SelectItem key={la.id} textValue={la.name}>
                    {la.name}
                  </SelectItem>
                ))}
              </Select>
            )}

            <Input
              accept="image/jpeg,image/png"
              description="JPEG/PNG ไม่เกิน 1 MB (ข้อจำกัดของ LINE)"
              isRequired={!isEditMode}
              label={isEditMode ? "เปลี่ยนรูป" : "รูป Rich Menu"}
              labelPlacement="outside"
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;

                if (!file) {
                  setImageFile(null);

                  return;
                }

                try {
                  validateImageByteSize(file.size);
                  setImageFile(file);
                } catch (err) {
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : "ขนาดไฟล์รูปไม่ถูกต้อง",
                  );
                  e.target.value = "";
                  setImageFile(null);
                }
              }}
            />

            <Input
              isRequired
              label="ชื่อ Rich Menu"
              labelPlacement="outside"
              placeholder="เช่น Main Menu"
              value={name}
              onValueChange={setName}
            />
            <Input
              isRequired
              label="Chat Bar Text"
              labelPlacement="outside"
              placeholder="เช่น เมนูหลัก"
              value={chatBarText}
              onValueChange={setChatBarText}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,320px)]">
            <ImportRichMenuCanvas
              areas={areas}
              imagePreviewUrl={imagePreviewUrl}
              imageSize={imageSize}
              isEditMode={isEditMode}
              selectedAreaId={selectedAreaId}
              zoomPercent={zoomPercent}
              onAreasChange={setAreas}
              onImageSizeChange={setImageSize}
              onSelectAreaId={setSelectedAreaId}
              onZoomPercentChange={setZoomPercent}
            />

            <aside className="order-1 min-w-0 space-y-3 xl:order-2">
              <ImportRichMenuAreaPanel
                areas={areas}
                availableAliases={availableAliases}
                currentRichMenuAliasId={isEditMode ? aliasId : undefined}
                currentRichMenuId={
                  isEditMode ? initialData?.richMenuId : undefined
                }
                loadingAliases={loadingAliases}
                selectedArea={selectedArea}
                selectedAreaIndex={selectedAreaIndex}
                onAreasChange={setAreas}
                onSelectAreaId={setSelectedAreaId}
              />

              {isEditMode && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    color="warning"
                    isDisabled={areas.length === 0 || clearingAreas}
                    size="sm"
                    variant="flat"
                    onPress={onOpenClearAreasModal}
                  >
                    ล้าง Areas
                  </Button>
                  <Button
                    color="success"
                    isLoading={deploying}
                    size="sm"
                    variant="flat"
                    onPress={handleDeploy}
                  >
                    {editStatus === "DEPLOYED"
                      ? "Deploy ใหม่ไป LINE"
                      : "Deploy ไป LINE"}
                  </Button>
                  {canSetDefault && (
                    <Button
                      color="secondary"
                      isLoading={settingDefault}
                      size="sm"
                      variant={isDefaultRichMenu ? "flat" : "bordered"}
                      onPress={handleSetDefault}
                    >
                      {isDefaultRichMenu
                        ? "ตั้ง Default อีกครั้ง"
                        : "ตั้งเป็น Default"}
                    </Button>
                  )}
                </div>
              )}
            </aside>
          </section>

          <div className="flex items-center justify-center gap-3 border-t border-default-200 py-3">
            {isEditMode ? (
              <>
                <Button
                  as={NextLink}
                  className="text-white"
                  color="warning"
                  href={`/rich-menus?lineAccountId=${encodeURIComponent(lineAccountId)}`}
                  variant="solid"
                >
                  ย้อนกลับ
                </Button>
                <Button color="primary" isLoading={loading} type="submit">
                  บันทึกการแก้ไข
                </Button>
              </>
            ) : (
              <>
                <Button
                  as={NextLink}
                  className="text-white"
                  color="warning"
                  href={`/rich-menus?lineAccountId=${encodeURIComponent(lineAccountId)}`}
                  variant="solid"
                >
                  ย้อนกลับ
                </Button>
                <Button color="primary" isLoading={loading} type="submit">
                  นำเข้า Rich Menu
                </Button>
              </>
            )}
          </div>
        </form>
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
      </CardBody>
    </Card>
  );
}
