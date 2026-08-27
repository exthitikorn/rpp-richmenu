"use client";

import type { CSSProperties, MouseEvent, ReactNode } from "react";

import clsx from "clsx";

const TEXT_SIZE_PX: Record<string, string> = {
  xs: "11px",
  sm: "13px",
  md: "14px",
  lg: "16px",
  xl: "19px",
  xxl: "22px",
  "3xl": "27px",
  "4xl": "32px",
  "5xl": "40px",
};

const SPACING_PX: Record<string, string> = {
  none: "0px",
  xs: "2px",
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  xxl: "20px",
};

const IMAGE_WIDTH: Record<string, string> = {
  xxs: "40px",
  xs: "60px",
  sm: "80px",
  md: "100px",
  lg: "120px",
  xl: "140px",
  xxl: "160px",
  "3xl": "180px",
  "4xl": "200px",
  "5xl": "220px",
  full: "100%",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function joinPath(parent: string, child: string | number): string {
  if (parent === "") return String(child);

  return `${parent}.${child}`;
}

function nodeType(value: unknown): string | undefined {
  const rec = asRecord(value);

  return typeof rec?.type === "string" ? rec.type : undefined;
}

function spacingPx(value: unknown): string | undefined {
  const key = str(value);

  return key ? SPACING_PX[key] : undefined;
}

function aspectRatioCss(value: unknown): string | undefined {
  const raw = str(value);
  const match = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(raw);

  if (!match) return undefined;

  return `${match[1]} / ${match[2]}`;
}

function selectedOutline(
  path: string,
  selectedPath: string,
): CSSProperties | undefined {
  if (path !== selectedPath) return undefined;

  return { outline: "2px solid hsl(var(--heroui-primary))" };
}

function NodeFrame({
  path,
  selectedPath,
  onSelectPath,
  className,
  style,
  children,
}: {
  path: string;
  selectedPath: string;
  onSelectPath: (path: string) => void;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  function handleClick(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
    onSelectPath(path);
  }

  return (
    <div
      className={clsx("cursor-pointer", className)}
      role="presentation"
      style={{ ...style, ...selectedOutline(path, selectedPath) }}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}

function Placeholder({ type }: { type: string }) {
  return (
    <div className="rounded-md bg-default-200 px-2 py-1.5 text-[11px] text-default-500">
      {type || "ไม่รองรับ"}
    </div>
  );
}

function FlexNode({
  node,
  path,
  selectedPath,
  onSelectPath,
}: {
  node: unknown;
  path: string;
  selectedPath: string;
  onSelectPath: (path: string) => void;
}) {
  const rec = asRecord(node);
  const type = nodeType(node);

  if (!rec || !type) {
    return (
      <NodeFrame
        path={path}
        selectedPath={selectedPath}
        onSelectPath={onSelectPath}
      >
        <Placeholder type={type || "unknown"} />
      </NodeFrame>
    );
  }

  if (type === "carousel") {
    const items = Array.isArray(rec.contents) ? rec.contents : [];

    return (
      <NodeFrame
        className="min-w-0"
        path={path}
        selectedPath={selectedPath}
        onSelectPath={onSelectPath}
      >
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((child, index) => (
            <div key={index} className="w-[210px] shrink-0">
              <FlexNode
                node={child}
                path={joinPath(path, `contents.${index}`)}
                selectedPath={selectedPath}
                onSelectPath={onSelectPath}
              />
            </div>
          ))}
        </div>
      </NodeFrame>
    );
  }

  if (type === "bubble") {
    return (
      <NodeFrame
        className="overflow-hidden rounded-xl bg-white shadow-sm"
        path={path}
        selectedPath={selectedPath}
        onSelectPath={onSelectPath}
      >
        {rec.hero != null ? (
          <FlexNode
            node={rec.hero}
            path={joinPath(path, "hero")}
            selectedPath={selectedPath}
            onSelectPath={onSelectPath}
          />
        ) : null}
        {rec.body != null ? (
          <div className="p-3">
            <FlexNode
              node={rec.body}
              path={joinPath(path, "body")}
              selectedPath={selectedPath}
              onSelectPath={onSelectPath}
            />
          </div>
        ) : null}
        {rec.footer != null ? (
          <div className="border-t border-default-200 p-2">
            <FlexNode
              node={rec.footer}
              path={joinPath(path, "footer")}
              selectedPath={selectedPath}
              onSelectPath={onSelectPath}
            />
          </div>
        ) : null}
      </NodeFrame>
    );
  }

  if (type === "box") {
    const layout = str(rec.layout) === "horizontal" ? "horizontal" : "vertical";
    const children = Array.isArray(rec.contents) ? rec.contents : [];
    const gap = spacingPx(rec.spacing);
    const margin = spacingPx(rec.margin);

    return (
      <NodeFrame
        className="min-w-0"
        path={path}
        selectedPath={selectedPath}
        style={{
          display: "flex",
          flexDirection: layout === "horizontal" ? "row" : "column",
          alignItems: layout === "horizontal" ? "center" : "stretch",
          gap: gap ?? "4px",
          marginTop: margin,
          minHeight: children.length === 0 ? 20 : undefined,
        }}
        onSelectPath={onSelectPath}
      >
        {children.map((child, index) => (
          <FlexNode
            key={index}
            node={child}
            path={joinPath(path, `contents.${index}`)}
            selectedPath={selectedPath}
            onSelectPath={onSelectPath}
          />
        ))}
      </NodeFrame>
    );
  }

  if (type === "text") {
    const size = TEXT_SIZE_PX[str(rec.size)] ?? "13px";
    const wrap = rec.wrap === true;

    return (
      <NodeFrame
        path={path}
        selectedPath={selectedPath}
        style={{
          color: str(rec.color) || "#111111",
          fontSize: size,
          fontWeight: rec.weight === "bold" ? 700 : 400,
          whiteSpace: wrap ? "pre-wrap" : "nowrap",
          overflow: wrap ? "visible" : "hidden",
          textOverflow: wrap ? undefined : "ellipsis",
        }}
        onSelectPath={onSelectPath}
      >
        {str(rec.text) || " "}
      </NodeFrame>
    );
  }

  if (type === "image") {
    const url = str(rec.url);
    const isHero = path === "hero" || path.endsWith(".hero");
    const width =
      isHero || str(rec.size) === "full"
        ? "100%"
        : (IMAGE_WIDTH[str(rec.size)] ?? IMAGE_WIDTH.md);
    const ratio =
      aspectRatioCss(rec.aspectRatio) ?? (isHero ? "20 / 13" : undefined);

    return (
      <NodeFrame
        className="overflow-hidden bg-default-100"
        path={path}
        selectedPath={selectedPath}
        style={{
          width,
          aspectRatio: ratio,
          marginTop: spacingPx(rec.margin),
        }}
        onSelectPath={onSelectPath}
      >
        {url ? (
          // ponytail: arbitrary https URLs; next/image needs a host allowlist
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="h-full w-full"
            draggable={false}
            src={url}
            style={{
              objectFit: rec.aspectMode === "fit" ? "contain" : "cover",
            }}
          />
        ) : (
          <Placeholder type="image" />
        )}
      </NodeFrame>
    );
  }

  if (type === "button") {
    const action = asRecord(rec.action);
    const label = str(action?.label) || "ปุ่ม";

    return (
      <NodeFrame
        className="rounded-md border border-[#06c755] px-2 py-1.5 text-center text-[13px] font-medium text-[#06c755]"
        path={path}
        selectedPath={selectedPath}
        style={{ marginTop: spacingPx(rec.margin) }}
        onSelectPath={onSelectPath}
      >
        {label}
      </NodeFrame>
    );
  }

  if (type === "separator") {
    return (
      <NodeFrame
        path={path}
        selectedPath={selectedPath}
        style={{
          marginTop: spacingPx(rec.margin),
          marginBottom: spacingPx(rec.margin),
        }}
        onSelectPath={onSelectPath}
      >
        <div
          className="h-px w-full"
          style={{ backgroundColor: str(rec.color) || "#EEEEEE" }}
        />
      </NodeFrame>
    );
  }

  return (
    <NodeFrame
      path={path}
      selectedPath={selectedPath}
      onSelectPath={onSelectPath}
    >
      <Placeholder type={type} />
    </NodeFrame>
  );
}

export function FlexMessagePreview({
  contents,
  selectedPath = "",
  onSelectPath = () => undefined,
}: {
  contents: unknown;
  selectedPath?: string;
  onSelectPath?: (path: string) => void;
}) {
  return (
    <FlexNode
      node={contents}
      path=""
      selectedPath={selectedPath}
      onSelectPath={onSelectPath}
    />
  );
}
