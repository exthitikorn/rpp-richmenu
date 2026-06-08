"use client";

import type { RichMenuArea } from "@/app/generated/prisma/client";

import Image from "next/image";
import { useMemo } from "react";

interface RichMenuPreviewProps {
  imageUrl: string;
  width: number;
  height: number;
  areas: RichMenuArea[];
  selectedIndex: number | null;
  onSelectArea: (index: number) => void;
}

const MAX_PREVIEW = 400;

export function RichMenuPreview({
  imageUrl,
  width,
  height,
  areas,
  selectedIndex,
  onSelectArea,
}: RichMenuPreviewProps) {
  const scale = useMemo(() => {
    const s = Math.min(MAX_PREVIEW / width, MAX_PREVIEW / height, 1);

    return s;
  }, [width, height]);

  const displayWidth = width * scale;
  const displayHeight = height * scale;

  return (
    <div
      className="relative inline-block bg-default-100 rounded-lg overflow-hidden"
      style={{ width: displayWidth, height: displayHeight }}
    >
      <Image
        alt="Rich Menu"
        className="block w-full h-full object-contain"
        draggable={false}
        height={displayHeight}
        src={imageUrl}
        width={displayWidth}
      />
      {areas.map((area, index) => (
        <button
          key={area.id}
          aria-label={`พื้นที่ที่ ${index + 1}`}
          aria-pressed={selectedIndex === index}
          className="absolute border-2 border-primary/80 bg-primary/20 hover:bg-primary/30 transition-colors cursor-pointer"
          style={{
            left: area.x * scale,
            top: area.y * scale,
            width: area.width * scale,
            height: area.height * scale,
            borderColor:
              selectedIndex === index
                ? "hsl(var(--heroui-primary))"
                : "rgba(128,128,128,0.6)",
            backgroundColor:
              selectedIndex === index
                ? "hsl(var(--heroui-primary) / 0.3)"
                : "rgba(128,128,128,0.15)",
          }}
          type="button"
          onClick={() => onSelectArea(index)}
        />
      ))}
    </div>
  );
}
