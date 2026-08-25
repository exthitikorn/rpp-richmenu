"use client";

import { useEffect, useRef, useState } from "react";
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

import { useAppToast } from "@/components/AppToastProvider";
import { getRichMenuAliasId } from "@/lib/rich-menu/alias";

type LineAccountOption = {
  id: string;
  name: string;
};

type InitialArea = {
  x: number;
  y: number;
  width: number;
  height: number;
  actionType: string;
  action: Record<string, unknown>;
};

type EditInitialData = {
  richMenuId: string;
  name: string;
  chatBarText?: string;
  imageUrl: string | null;
  width: number;
  height: number;
  lineAccountId: string;
  lineRichMenuId: string | null;
  status: string;
  isDefault: boolean;
  areas: InitialArea[];
};

type ActionType = "message" | "uri" | "richmenuswitch" | "location";

const AREA_ACTION_HINT: Record<ActionType, string> = {
  message: "msg",
  uri: "uri",
  richmenuswitch: "switch",
  location: "loc",
};

type AreaDraft = {
  id: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  actionType: ActionType;
  label: string;
  text: string;
  uri: string;
  data: string;
  richMenuAliasId: string;
};

type DragRect = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

type ResizeHandle = "nw" | "ne" | "sw" | "se";

type PointerDraftInteraction = {
  type: "draw";
  pointerId: number;
  draft: DragRect;
};

type PointerMoveInteraction = {
  type: "move";
  pointerId: number;
  areaId: string;
  startPoint: { x: number; y: number };
  initialBounds: AreaDraft["bounds"];
};

type PointerResizeInteraction = {
  type: "resize";
  pointerId: number;
  areaId: string;
  handle: ResizeHandle;
  startPoint: { x: number; y: number };
  initialBounds: AreaDraft["bounds"];
};

type PointerInteraction =
  | PointerDraftInteraction
  | PointerMoveInteraction
  | PointerResizeInteraction;

type RenderedImageFrame = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type RichMenuAliasOption = {
  richMenuId: string;
  aliasId: string;
  name: string;
  lineAccountName: string;
};

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
  const aliasId = initialData ? getRichMenuAliasId(initialData.richMenuId) : "";
  const [lineAccountId, setLineAccountId] = useState(
    initialData?.lineAccountId ?? defaultLineAccountId ?? "",
  );
  const [name, setName] = useState(initialData?.name ?? "");
  const [chatBarText, setChatBarText] = useState(
    initialData?.chatBarText ?? "",
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
  const [areas, setAreas] = useState<AreaDraft[]>(() => {
    if (!initialData) {
      return [];
    }

    return initialData.areas.map((area) => {
      const actionType = (
        ["message", "uri", "richmenuswitch", "location"].includes(
          area.actionType,
        )
          ? area.actionType
          : "message"
      ) as ActionType;

      return {
        id: crypto.randomUUID(),
        bounds: {
          x: area.x,
          y: area.y,
          width: area.width,
          height: area.height,
        },
        actionType,
        label:
          typeof area.action?.label === "string"
            ? (area.action.label as string)
            : "",
        text:
          typeof area.action?.text === "string"
            ? (area.action.text as string)
            : "",
        uri:
          typeof area.action?.uri === "string"
            ? (area.action.uri as string)
            : "",
        data:
          typeof area.action?.data === "string" && area.action.data
            ? (area.action.data as string)
            : actionType === "richmenuswitch"
              ? "action=switch_menu"
              : "",
        richMenuAliasId:
          typeof area.action?.richMenuAliasId === "string"
            ? (area.action.richMenuAliasId as string)
            : "",
      };
    });
  });
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [dragRect, setDragRect] = useState<DragRect | null>(null);
  const [interaction, setInteraction] = useState<PointerInteraction | null>(
    null,
  );
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
  const [renderedFrame, setRenderedFrame] = useState<RenderedImageFrame | null>(
    null,
  );
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

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
    if (!imagePreviewUrl) {
      setRenderedFrame(null);

      return;
    }

    const container = imageContainerRef.current;
    const image = imageRef.current;

    if (!container || !image) {
      return;
    }

    const updateFrame = () => {
      const containerRect = container.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();

      if (!imageRect.width || !imageRect.height) {
        setRenderedFrame(null);

        return;
      }

      setRenderedFrame({
        left: imageRect.left - containerRect.left,
        top: imageRect.top - containerRect.top,
        width: imageRect.width,
        height: imageRect.height,
      });
    };

    updateFrame();
    const observer = new ResizeObserver(updateFrame);

    observer.observe(container);
    observer.observe(image);
    window.addEventListener("resize", updateFrame);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateFrame);
    };
  }, [imagePreviewUrl, imageSize.width, imageSize.height]);

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

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }

  function toLocalPoint(event: React.PointerEvent<HTMLElement>) {
    const container = imageContainerRef.current;
    const frame = renderedFrame;

    if (!container || !frame) {
      return { x: 0, y: 0 };
    }

    const containerRect = container.getBoundingClientRect();
    const pointerXInContainer = event.clientX - containerRect.left;
    const pointerYInContainer = event.clientY - containerRect.top;

    return {
      x: clamp(pointerXInContainer - frame.left, 0, frame.width),
      y: clamp(pointerYInContainer - frame.top, 0, frame.height),
    };
  }

  function buildBoundsFromDrag(rect: DragRect) {
    const frame = renderedFrame;

    if (!frame || !imageSize.width || !imageSize.height) {
      return null;
    }

    const renderedWidth = frame.width;
    const renderedHeight = frame.height;

    if (
      !renderedWidth ||
      !renderedHeight ||
      !imageSize.width ||
      !imageSize.height
    ) {
      return null;
    }

    const left = Math.min(rect.startX, rect.endX);
    const top = Math.min(rect.startY, rect.endY);
    const width = Math.abs(rect.endX - rect.startX);
    const height = Math.abs(rect.endY - rect.startY);

    if (width < 8 || height < 8) {
      return null;
    }

    const scaleX = imageSize.width / renderedWidth;
    const scaleY = imageSize.height / renderedHeight;

    return {
      x: Math.round(left * scaleX),
      y: Math.round(top * scaleY),
      width: Math.round(width * scaleX),
      height: Math.round(height * scaleY),
    };
  }

  function getScaleInfo() {
    const frame = renderedFrame;

    if (!frame) {
      return null;
    }

    const renderedWidth = frame.width;
    const renderedHeight = frame.height;
    const naturalWidth = imageSize.width;
    const naturalHeight = imageSize.height;

    if (!renderedWidth || !renderedHeight || !naturalWidth || !naturalHeight) {
      return null;
    }

    return {
      frame,
      renderedWidth,
      renderedHeight,
      naturalWidth,
      naturalHeight,
      scaleX: naturalWidth / renderedWidth,
      scaleY: naturalHeight / renderedHeight,
    };
  }

  function toNaturalDelta(deltaX: number, deltaY: number) {
    const info = getScaleInfo();

    if (!info) {
      return null;
    }

    return {
      x: Math.round(deltaX * info.scaleX),
      y: Math.round(deltaY * info.scaleY),
    };
  }

  function clampBounds(bounds: AreaDraft["bounds"]) {
    const info = getScaleInfo();

    if (!info) {
      return bounds;
    }

    const minSize = 20;
    const maxWidth = info.naturalWidth;
    const maxHeight = info.naturalHeight;

    const width = clamp(bounds.width, minSize, maxWidth);
    const height = clamp(bounds.height, minSize, maxHeight);
    const x = clamp(bounds.x, 0, maxWidth - width);
    const y = clamp(bounds.y, 0, maxHeight - height);

    return { x, y, width, height };
  }

  function createAreaFromBounds(bounds: AreaDraft["bounds"]) {
    return {
      id: crypto.randomUUID(),
      bounds: clampBounds(bounds),
      actionType: "message" as const,
      label: "",
      text: "",
      uri: "",
      data: "",
      richMenuAliasId: "",
    };
  }

  function finalizeDraw(draft: DragRect) {
    const bounds = buildBoundsFromDrag(draft);

    setDragRect(null);
    setInteraction(null);
    if (!bounds) {
      return;
    }

    const newArea = createAreaFromBounds(bounds);

    setAreas((prev) => [...prev, newArea]);
    setSelectedAreaId(newArea.id);
  }

  function updateAreaBounds(areaId: string, nextBounds: AreaDraft["bounds"]) {
    setAreas((prev) =>
      prev.map((area) =>
        area.id === areaId
          ? { ...area, bounds: clampBounds(nextBounds) }
          : area,
      ),
    );
  }

  function updateAreaById(
    areaId: string,
    updater: (prev: AreaDraft) => AreaDraft,
  ) {
    setAreas((prev) =>
      prev.map((area) => (area.id === areaId ? updater(area) : area)),
    );
  }

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
      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || !data.success) {
        toast.error(data.error ?? "ตั้ง Default ไม่สำเร็จ");

        return;
      }

      setIsDefaultRichMenu(true);
      router.refresh();
      toast.success(
        "ตั้งเป็น Default แล้ว — เมนูนี้จะแสดงเป็นหน้าแรกให้ผู้ใช้ใหม่",
      );
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

    setLoading(true);
    try {
      const normalizedAreas = areas.map((area, index) => {
        if (area.actionType === "message" && !area.text.trim()) {
          throw new Error(
            `พื้นที่ที่ ${index + 1}: กรุณากรอกข้อความสำหรับ Message Action`,
          );
        }
        if (area.actionType === "uri" && !area.uri.trim()) {
          throw new Error(
            `พื้นที่ที่ ${index + 1}: กรุณากรอก URL สำหรับ URI Action`,
          );
        }
        if (
          area.actionType === "richmenuswitch" &&
          !area.richMenuAliasId.trim()
        ) {
          throw new Error(
            `พื้นที่ที่ ${index + 1}: กรุณาเลือก Rich Menu ปลายทาง`,
          );
        }

        const baseAction = area.label.trim()
          ? { label: area.label.trim() }
          : {};

        if (area.actionType === "message") {
          return {
            bounds: area.bounds,
            action: {
              ...baseAction,
              type: "message" as const,
              text: area.text.trim(),
            },
          };
        }
        if (area.actionType === "uri") {
          return {
            bounds: area.bounds,
            action: {
              ...baseAction,
              type: "uri" as const,
              uri: area.uri.trim(),
            },
          };
        }

        if (area.actionType === "richmenuswitch") {
          return {
            bounds: area.bounds,
            action: {
              ...baseAction,
              type: "richmenuswitch" as const,
              richMenuAliasId: area.richMenuAliasId.trim(),
              data: area.data.trim() || "action=switch_menu",
            },
          };
        }

        return {
          bounds: area.bounds,
          action: {
            ...baseAction,
            type: "location" as const,
          },
        };
      });

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
                ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                : "grid gap-4 md:grid-cols-2 xl:grid-cols-4"
            }
          >
            {isEditMode ? null : (
              <Select
                isRequired
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
              isRequired={!isEditMode}
              label={isEditMode ? "เปลี่ยนรูป" : "รูป Rich Menu"}
              labelPlacement="outside"
              type="file"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
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
            <div className="order-2 space-y-3 xl:order-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-default-500">
                  ลากเพื่อวาด · ลากกรอบเพื่อย้าย · มุมเพื่อ resize
                </p>
                <label className="flex items-center gap-2 text-xs text-default-600">
                  <span>Zoom {zoomPercent}%</span>
                  <input
                    aria-label="Zoom preview"
                    className="w-28"
                    max={100}
                    min={25}
                    step={5}
                    type="range"
                    value={zoomPercent}
                    onChange={(event) =>
                      setZoomPercent(Number(event.currentTarget.value))
                    }
                  />
                </label>
              </div>
              <div className="overflow-auto rounded-lg border border-default-200 bg-content1">
                <div
                  ref={imageContainerRef}
                  className="relative w-fit touch-none"
                  role="presentation"
                  onPointerCancel={() => {
                    if (
                      interaction &&
                      imageContainerRef.current?.hasPointerCapture(
                        interaction.pointerId,
                      )
                    ) {
                      imageContainerRef.current.releasePointerCapture(
                        interaction.pointerId,
                      );
                    }
                    setDragRect(null);
                    setInteraction(null);
                  }}
                  onPointerDown={(event) => {
                    if (event.button !== 0 || interaction || !imagePreviewUrl) {
                      return;
                    }

                    const point = toLocalPoint(event);
                    const draft = {
                      startX: point.x,
                      startY: point.y,
                      endX: point.x,
                      endY: point.y,
                    };

                    setDragRect(draft);
                    setInteraction({
                      type: "draw",
                      pointerId: event.pointerId,
                      draft,
                    });
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                  onPointerMove={(event) => {
                    if (
                      !interaction ||
                      interaction.pointerId !== event.pointerId
                    ) {
                      return;
                    }
                    const point = toLocalPoint(event);

                    if (interaction.type === "draw") {
                      const nextDraft = {
                        ...interaction.draft,
                        endX: point.x,
                        endY: point.y,
                      };

                      setDragRect(nextDraft);
                      setInteraction({
                        ...interaction,
                        draft: nextDraft,
                      });

                      return;
                    }

                    const deltaX = point.x - interaction.startPoint.x;
                    const deltaY = point.y - interaction.startPoint.y;
                    const naturalDelta = toNaturalDelta(deltaX, deltaY);

                    if (!naturalDelta) {
                      return;
                    }

                    if (interaction.type === "move") {
                      updateAreaBounds(interaction.areaId, {
                        ...interaction.initialBounds,
                        x: interaction.initialBounds.x + naturalDelta.x,
                        y: interaction.initialBounds.y + naturalDelta.y,
                      });

                      return;
                    }

                    const b = interaction.initialBounds;
                    const dx = naturalDelta.x;
                    const dy = naturalDelta.y;
                    let nextBounds = { ...b };

                    if (interaction.handle === "nw") {
                      nextBounds = {
                        x: b.x + dx,
                        y: b.y + dy,
                        width: b.width - dx,
                        height: b.height - dy,
                      };
                    } else if (interaction.handle === "ne") {
                      nextBounds = {
                        x: b.x,
                        y: b.y + dy,
                        width: b.width + dx,
                        height: b.height - dy,
                      };
                    } else if (interaction.handle === "sw") {
                      nextBounds = {
                        x: b.x + dx,
                        y: b.y,
                        width: b.width - dx,
                        height: b.height + dy,
                      };
                    } else if (interaction.handle === "se") {
                      nextBounds = {
                        x: b.x,
                        y: b.y,
                        width: b.width + dx,
                        height: b.height + dy,
                      };
                    }

                    updateAreaBounds(interaction.areaId, nextBounds);
                  }}
                  onPointerUp={(event) => {
                    if (
                      !interaction ||
                      interaction.pointerId !== event.pointerId
                    ) {
                      return;
                    }
                    if (
                      imageContainerRef.current?.hasPointerCapture(
                        event.pointerId,
                      )
                    ) {
                      imageContainerRef.current.releasePointerCapture(
                        event.pointerId,
                      );
                    }
                    if (interaction.type === "draw") {
                      finalizeDraw(interaction.draft);

                      return;
                    }

                    setInteraction(null);
                  }}
                >
                  {imagePreviewUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        ref={imageRef}
                        alt="Rich menu preview"
                        className="block h-auto max-w-none select-none"
                        src={imagePreviewUrl}
                        style={
                          imageSize.width > 0
                            ? {
                                width: `${Math.round((imageSize.width * zoomPercent) / 100)}px`,
                              }
                            : undefined
                        }
                        onLoad={(e) => {
                          const target = e.currentTarget;

                          setImageSize({
                            width: target.naturalWidth,
                            height: target.naturalHeight,
                          });
                        }}
                      />
                      {renderedFrame && (
                        <div
                          className="absolute"
                          style={{
                            left: `${renderedFrame.left}px`,
                            top: `${renderedFrame.top}px`,
                            width: `${renderedFrame.width}px`,
                            height: `${renderedFrame.height}px`,
                          }}
                        >
                          {areas.map((area, index) => {
                            const widthRatio =
                              imageSize.width > 0
                                ? area.bounds.width / imageSize.width
                                : 0;
                            const heightRatio =
                              imageSize.height > 0
                                ? area.bounds.height / imageSize.height
                                : 0;
                            const xRatio =
                              imageSize.width > 0
                                ? area.bounds.x / imageSize.width
                                : 0;
                            const yRatio =
                              imageSize.height > 0
                                ? area.bounds.y / imageSize.height
                                : 0;
                            const isSelected = area.id === selectedAreaId;

                            return (
                              <div
                                key={area.id}
                                className={`absolute box-border select-none border-2 text-[10px] font-semibold ${
                                  isSelected
                                    ? "border-primary bg-primary/20 text-primary-700"
                                    : "border-warning bg-warning/15 text-warning-700"
                                }`}
                                style={{
                                  left: `${xRatio * 100}%`,
                                  top: `${yRatio * 100}%`,
                                  width: `${widthRatio * 100}%`,
                                  height: `${heightRatio * 100}%`,
                                }}
                              >
                                <button
                                  className="flex h-full w-full items-start justify-start p-1 text-left"
                                  type="button"
                                  onClick={() => setSelectedAreaId(area.id)}
                                  onPointerDown={(event) => {
                                    event.stopPropagation();
                                    if (event.button !== 0 || interaction) {
                                      return;
                                    }
                                    const point = toLocalPoint(event);

                                    setSelectedAreaId(area.id);
                                    setInteraction({
                                      type: "move",
                                      pointerId: event.pointerId,
                                      areaId: area.id,
                                      startPoint: point,
                                      initialBounds: area.bounds,
                                    });
                                    imageContainerRef.current?.setPointerCapture(
                                      event.pointerId,
                                    );
                                  }}
                                >
                                  Area {index + 1}
                                </button>
                                {(
                                  [
                                    [
                                      "nw",
                                      "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
                                    ],
                                    [
                                      "ne",
                                      "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
                                    ],
                                    [
                                      "sw",
                                      "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
                                    ],
                                    [
                                      "se",
                                      "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
                                    ],
                                  ] as Array<[ResizeHandle, string]>
                                ).map(([handle, positionClass]) => (
                                  <button
                                    key={handle}
                                    aria-label={`Resize ${handle}`}
                                    className={`absolute h-3 w-3 rounded-full border border-primary-700 bg-primary ${positionClass}`}
                                    type="button"
                                    onPointerDown={(event) => {
                                      event.stopPropagation();
                                      if (event.button !== 0 || interaction) {
                                        return;
                                      }
                                      const point = toLocalPoint(event);

                                      setSelectedAreaId(area.id);
                                      setInteraction({
                                        type: "resize",
                                        pointerId: event.pointerId,
                                        areaId: area.id,
                                        handle,
                                        startPoint: point,
                                        initialBounds: area.bounds,
                                      });
                                      imageContainerRef.current?.setPointerCapture(
                                        event.pointerId,
                                      );
                                    }}
                                  />
                                ))}
                              </div>
                            );
                          })}
                          {dragRect && (
                            <div
                              className="pointer-events-none absolute box-border border-2 border-success bg-success/10"
                              style={{
                                left: `${Math.min(dragRect.startX, dragRect.endX)}px`,
                                top: `${Math.min(dragRect.startY, dragRect.endY)}px`,
                                width: `${Math.abs(dragRect.endX - dragRect.startX)}px`,
                                height: `${Math.abs(dragRect.endY - dragRect.startY)}px`,
                              }}
                            />
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex min-h-[380px] items-center justify-center px-4 text-sm text-default-500">
                      {isEditMode
                        ? "ยังไม่มีรูป Rich Menu กรุณาอัปโหลดรูปใหม่"
                        : "อัปโหลดรูป Rich Menu เพื่อเริ่มวาดพื้นที่"}
                    </div>
                  )}
                </div>
              </div>
              {imageSize.width > 0 && imageSize.height > 0 && (
                <p className="text-xs text-default-500">
                  ขนาดรูป: {imageSize.width} × {imageSize.height} px
                </p>
              )}
            </div>

            <aside className="order-1 space-y-3 xl:order-2">
              <h3 className="text-sm font-semibold text-foreground">
                Areas ({areas.length})
              </h3>

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
                      color={isDefaultRichMenu ? "default" : "secondary"}
                      isDisabled={isDefaultRichMenu}
                      isLoading={settingDefault}
                      size="sm"
                      variant={isDefaultRichMenu ? "flat" : "bordered"}
                      onPress={handleSetDefault}
                    >
                      {isDefaultRichMenu
                        ? "เป็น Default อยู่แล้ว"
                        : "ตั้งเป็น Default"}
                    </Button>
                  )}
                </div>
              )}

              {areas.length === 0 ? (
                <p className="text-sm text-default-500">
                  ลากบนรูปเพื่อสร้าง Area
                </p>
              ) : (
                <>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {areas.map((area, index) => {
                      const active = area.id === selectedArea?.id;

                      return (
                        <Button
                          key={area.id}
                          className="shrink-0"
                          color={active ? "primary" : "default"}
                          size="sm"
                          variant={active ? "flat" : "light"}
                          onPress={() => setSelectedAreaId(area.id)}
                        >
                          Area {index + 1} · {AREA_ACTION_HINT[area.actionType]}
                        </Button>
                      );
                    })}
                  </div>

                  {selectedArea ? (
                    <div className="grid gap-2 border-t border-default-200 pt-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">
                            Area {selectedAreaIndex + 1}
                          </p>
                          <p className="text-xs text-default-500">
                            ({selectedArea.bounds.x}, {selectedArea.bounds.y}) ·{" "}
                            {selectedArea.bounds.width}×
                            {selectedArea.bounds.height}
                          </p>
                        </div>
                        <Button
                          color="danger"
                          size="sm"
                          variant="solid"
                          onPress={() => {
                            const id = selectedArea.id;

                            setAreas((prev) =>
                              prev.filter((item) => item.id !== id),
                            );
                            setSelectedAreaId("");
                          }}
                        >
                          ลบ
                        </Button>
                      </div>

                      <Select
                        label="Action Type"
                        labelPlacement="outside"
                        selectedKeys={[selectedArea.actionType]}
                        onSelectionChange={(keys) => {
                          const key = Array.from(keys)[0];

                          if (!key) return;
                          const nextType = String(key) as ActionType;

                          updateAreaById(selectedArea.id, (prev) => ({
                            ...prev,
                            actionType: nextType,
                            ...(nextType === "richmenuswitch" &&
                            !prev.data.trim()
                              ? { data: "action=switch_menu" }
                              : {}),
                          }));
                        }}
                      >
                        <SelectItem key="message">message</SelectItem>
                        <SelectItem key="uri">uri</SelectItem>
                        <SelectItem key="richmenuswitch">
                          richmenuswitch
                        </SelectItem>
                        <SelectItem key="location">location</SelectItem>
                      </Select>

                      {selectedArea.actionType === "message" && (
                        <Input
                          label="ข้อความ"
                          labelPlacement="outside"
                          placeholder="เช่น ติดต่อแอดมิน"
                          value={selectedArea.text}
                          onValueChange={(value) =>
                            updateAreaById(selectedArea.id, (prev) => ({
                              ...prev,
                              text: value,
                            }))
                          }
                        />
                      )}
                      {selectedArea.actionType === "uri" && (
                        <Input
                          label="URL"
                          labelPlacement="outside"
                          placeholder="https://example.com"
                          value={selectedArea.uri}
                          onValueChange={(value) =>
                            updateAreaById(selectedArea.id, (prev) => ({
                              ...prev,
                              uri: value,
                            }))
                          }
                        />
                      )}
                      {selectedArea.actionType === "richmenuswitch" && (
                        <>
                          <Input
                            label="Data"
                            labelPlacement="outside"
                            placeholder="เช่น action=switch_menu"
                            value={selectedArea.data}
                            onValueChange={(value) =>
                              updateAreaById(selectedArea.id, (prev) => ({
                                ...prev,
                                data: value,
                              }))
                            }
                          />
                          <Select
                            disallowEmptySelection
                            isLoading={loadingAliases}
                            label="Rich Menu ปลายทาง"
                            labelPlacement="outside"
                            placeholder={
                              loadingAliases
                                ? "กำลังโหลด..."
                                : "เลือก Rich Menu ปลายทาง"
                            }
                            selectedKeys={
                              selectedArea.richMenuAliasId
                                ? [selectedArea.richMenuAliasId]
                                : []
                            }
                            onSelectionChange={(keys) => {
                              const key = Array.from(keys)[0];

                              // HeroUI may fire empty selection when items re-render;
                              // ignore it so a chosen alias is not wiped before submit.
                              if (!key) return;
                              updateAreaById(selectedArea.id, (prev) => ({
                                ...prev,
                                richMenuAliasId: String(key),
                              }));
                            }}
                          >
                            {[
                              ...availableAliases.filter(
                                (alias) =>
                                  !isEditMode ||
                                  (alias.richMenuId !==
                                    initialData.richMenuId &&
                                    alias.aliasId !== aliasId),
                              ),
                              ...(selectedArea.richMenuAliasId &&
                              selectedArea.richMenuAliasId !== aliasId &&
                              !availableAliases.some(
                                (alias) =>
                                  alias.aliasId ===
                                  selectedArea.richMenuAliasId,
                              )
                                ? [
                                    {
                                      richMenuId: "custom",
                                      aliasId: selectedArea.richMenuAliasId,
                                      name: "Alias ปัจจุบัน",
                                      lineAccountName: "Custom",
                                    } satisfies RichMenuAliasOption,
                                  ]
                                : []),
                            ].map((alias) => (
                              <SelectItem
                                key={alias.aliasId}
                                textValue={`${alias.name} ${alias.lineAccountName} ${alias.aliasId}`}
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm">
                                    {alias.name} ({alias.lineAccountName})
                                  </span>
                                  <span className="font-mono text-xs text-default-500">
                                    {alias.aliasId}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </Select>
                        </>
                      )}
                    </div>
                  ) : null}
                </>
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
