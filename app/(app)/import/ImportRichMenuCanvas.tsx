"use client";

import { useEffect, useRef, useState } from "react";

import {
  clamp,
  type AreaDraft,
  type DragRect,
  type PointerInteraction,
  type RenderedImageFrame,
  type ResizeHandle,
} from "./import-rich-menu-types";

import { randomId } from "@/lib/random-id";

export function ImportRichMenuCanvas({
  imagePreviewUrl,
  imageSize,
  onImageSizeChange,
  zoomPercent,
  onZoomPercentChange,
  areas,
  selectedAreaId,
  onSelectAreaId,
  onAreasChange,
  isEditMode,
}: {
  imagePreviewUrl: string;
  imageSize: { width: number; height: number };
  onImageSizeChange: (size: { width: number; height: number }) => void;
  zoomPercent: number;
  onZoomPercentChange: (n: number) => void;
  areas: AreaDraft[];
  selectedAreaId: string;
  onSelectAreaId: (id: string) => void;
  onAreasChange: (updater: (prev: AreaDraft[]) => AreaDraft[]) => void;
  isEditMode: boolean;
}) {
  const [dragRect, setDragRect] = useState<DragRect | null>(null);
  const [interaction, setInteraction] = useState<PointerInteraction | null>(
    null,
  );
  const [renderedFrame, setRenderedFrame] = useState<RenderedImageFrame | null>(
    null,
  );
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

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
      id: randomId(),
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

    onAreasChange((prev) => [...prev, newArea]);
    onSelectAreaId(newArea.id);
  }

  function updateAreaBounds(areaId: string, nextBounds: AreaDraft["bounds"]) {
    onAreasChange((prev) =>
      prev.map((area) =>
        area.id === areaId
          ? { ...area, bounds: clampBounds(nextBounds) }
          : area,
      ),
    );
  }

  return (
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
              onZoomPercentChange(Number(event.currentTarget.value))
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
            if (!interaction || interaction.pointerId !== event.pointerId) {
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
            if (!interaction || interaction.pointerId !== event.pointerId) {
              return;
            }
            if (imageContainerRef.current?.hasPointerCapture(event.pointerId)) {
              imageContainerRef.current.releasePointerCapture(event.pointerId);
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

                  onImageSizeChange({
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
                      imageSize.width > 0 ? area.bounds.x / imageSize.width : 0;
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
                          onClick={() => onSelectAreaId(area.id)}
                          onPointerDown={(event) => {
                            event.stopPropagation();
                            if (event.button !== 0 || interaction) {
                              return;
                            }
                            const point = toLocalPoint(event);

                            onSelectAreaId(area.id);
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

                              onSelectAreaId(area.id);
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
  );
}
