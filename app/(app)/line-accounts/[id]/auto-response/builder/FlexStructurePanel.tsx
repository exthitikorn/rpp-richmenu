"use client";

import type { FlexPath } from "@/lib/line/flex-tree";

import { Button } from "@heroui/button";
import { Radio, RadioGroup } from "@heroui/radio";
import clsx from "clsx";

import { emptyBubble, emptyCarousel } from "@/lib/line/flex-contents";
import {
  appendChild,
  defaultNode,
  deleteAtPath,
  getAtPath,
  moveSibling,
  parsePath,
} from "@/lib/line/flex-tree";

const PALETTE = [
  { type: "box" as const, label: "กล่อง" },
  { type: "text" as const, label: "ข้อความ" },
  { type: "image" as const, label: "รูปภาพ" },
  { type: "button" as const, label: "ปุ่ม" },
  { type: "separator" as const, label: "เส้นคั่น" },
];

const TYPE_LABEL: Record<string, string> = {
  bubble: "บับเบิล",
  carousel: "คารูเซล",
  box: "กล่อง",
  image: "รูปภาพ",
  separator: "เส้นคั่น",
  text: "ข้อความ",
  button: "ปุ่ม",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function joinPath(parent: FlexPath, child: string | number): FlexPath {
  if (parent === "") return String(child);

  return `${parent}.${child}`;
}

function parentNodePath(path: FlexPath): FlexPath {
  const segs = parsePath(path);

  if (segs.length === 0) return "";

  const last = segs[segs.length - 1];

  if (typeof last === "number") {
    const withoutIndex = segs.slice(0, -1);
    const parentKey = withoutIndex[withoutIndex.length - 1];

    if (parentKey === "contents") {
      return withoutIndex.slice(0, -1).join(".");
    }

    return withoutIndex.join(".");
  }

  return segs.slice(0, -1).join(".");
}

function nodeType(value: unknown): string | undefined {
  const rec = asRecord(value);

  return typeof rec?.type === "string" ? rec.type : undefined;
}

function nodeLabel(node: unknown, path: FlexPath): string {
  const last = path === "" ? "" : String(parsePath(path).at(-1) ?? "");

  if (last === "body") return "เนื้อหา";
  if (last === "hero") return "รูปหัว";
  if (last === "footer") return "ส่วนท้าย";

  const rec = asRecord(node);
  const type = nodeType(node);

  if (type === "text") {
    const text = typeof rec?.text === "string" ? rec.text.trim() : "";

    if (!text) return "ข้อความ";

    return text.length > 24 ? `${text.slice(0, 24)}…` : text;
  }

  if (type === "button") {
    const action = asRecord(rec?.action);
    const label = typeof action?.label === "string" ? action.label.trim() : "";

    return label || "ปุ่ม";
  }

  return (type && TYPE_LABEL[type]) || type || "ไม่รองรับ";
}

function childEntries(
  node: unknown,
  path: FlexPath,
): { path: FlexPath; node: unknown }[] {
  const rec = asRecord(node);

  if (!rec) return [];

  if (rec.type === "carousel" && Array.isArray(rec.contents)) {
    return rec.contents.map((child, i) => ({
      path: joinPath(path, `contents.${i}`),
      node: child,
    }));
  }

  if (rec.type === "bubble") {
    const entries: { path: FlexPath; node: unknown }[] = [];

    if (rec.hero != null) {
      entries.push({ path: joinPath(path, "hero"), node: rec.hero });
    }
    if (rec.body != null) {
      entries.push({ path: joinPath(path, "body"), node: rec.body });
    }
    if (rec.footer != null) {
      entries.push({ path: joinPath(path, "footer"), node: rec.footer });
    }

    return entries;
  }

  if (rec.type === "box" && Array.isArray(rec.contents)) {
    return rec.contents.map((child, i) => ({
      path: joinPath(path, `contents.${i}`),
      node: child,
    }));
  }

  return [];
}

function appendTargetPath(
  contents: unknown,
  selectedPath: FlexPath,
): FlexPath | null {
  const type = nodeType(getAtPath(contents, selectedPath));

  if (type === "box") return selectedPath;
  if (type === "bubble") {
    return selectedPath === "" ? "body" : `${selectedPath}.body`;
  }

  return null;
}

function siblingInfo(
  contents: unknown,
  path: FlexPath,
): { index: number; length: number } | null {
  const segs = parsePath(path);
  const last = segs[segs.length - 1];

  if (typeof last !== "number") return null;

  const parent = getAtPath(contents, segs.slice(0, -1).join("."));

  if (!Array.isArray(parent)) return null;

  return { index: last, length: parent.length };
}

function canDelete(contents: unknown, path: FlexPath): boolean {
  if (path === "") return false;

  const segs = parsePath(path);

  if (segs[segs.length - 1] === "body") return false;

  const type = nodeType(getAtPath(contents, path));
  const root = asRecord(contents);

  if (
    type === "bubble" &&
    root?.type === "carousel" &&
    Array.isArray(root.contents) &&
    root.contents.length <= 2 &&
    segs.length === 2 &&
    segs[0] === "contents"
  ) {
    return false;
  }

  return true;
}

function defaultSelectPath(contents: unknown): FlexPath {
  return nodeType(contents) === "carousel" ? "contents.0.body" : "body";
}

function TreeRows({
  node,
  path,
  selectedPath,
  onSelect,
}: {
  node: unknown;
  path: FlexPath;
  selectedPath: FlexPath;
  onSelect: (path: FlexPath) => void;
}) {
  const children = childEntries(node, path);

  return (
    <li>
      <button
        className={clsx(
          "w-full rounded-md px-2 py-1 text-left text-sm",
          selectedPath === path
            ? "bg-primary/10 font-medium text-primary"
            : "text-default-700 hover:bg-default-100",
        )}
        type="button"
        onClick={() => onSelect(path)}
      >
        {nodeLabel(node, path)}
      </button>
      {children.length > 0 ? (
        <ul className="ml-3 border-l border-default-200 pl-2">
          {children.map((child) => (
            <TreeRows
              key={child.path}
              node={child.node}
              path={child.path}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function FlexStructurePanel({
  contents,
  selectedPath,
  onSelect,
  onChangeContents,
}: {
  contents: unknown;
  selectedPath: string;
  onSelect: (path: string) => void;
  onChangeContents: (next: unknown) => void;
}) {
  const rootType = nodeType(contents) === "carousel" ? "carousel" : "bubble";
  const targetPath = appendTargetPath(contents, selectedPath);
  const siblings = siblingInfo(contents, selectedPath);
  const carouselLen =
    rootType === "carousel" && Array.isArray(asRecord(contents)?.contents)
      ? (asRecord(contents)!.contents as unknown[]).length
      : 0;

  function switchRoot(next: "bubble" | "carousel") {
    if (next === rootType) return;

    if (next === "carousel") {
      if (
        !window.confirm(
          "เปลี่ยนเป็นคารูเซล? จะเก็บบับเบิลปัจจุบันและเพิ่มบับเบิลว่างอีกใบ",
        )
      ) {
        return;
      }

      const rec = asRecord(contents);
      const wrapped =
        rec?.type === "bubble"
          ? { type: "carousel", contents: [contents, emptyBubble()] }
          : emptyCarousel();

      onChangeContents(wrapped);
      onSelect("contents.0.body");

      return;
    }

    if (!window.confirm("เปลี่ยนเป็นบับเบิลเดียว? จะเก็บเฉพาะบับเบิลแรก")) {
      return;
    }

    const rec = asRecord(contents);
    const items = Array.isArray(rec?.contents) ? rec.contents : [];
    const first = items[0];
    const bubble = nodeType(first) === "bubble" ? first : emptyBubble();

    onChangeContents(bubble);
    onSelect("body");
  }

  function handleAppend(
    type: "box" | "text" | "image" | "button" | "separator",
  ) {
    if (targetPath == null) return;

    onChangeContents(appendChild(contents, targetPath, defaultNode(type)));
  }

  function handleDelete() {
    if (!canDelete(contents, selectedPath)) return;

    onChangeContents(deleteAtPath(contents, selectedPath));
    onSelect(parentNodePath(selectedPath) || defaultSelectPath(contents));
  }

  function handleMove(dir: -1 | 1) {
    const next = moveSibling(contents, selectedPath, dir);

    onChangeContents(next);

    if (next === contents) return;

    const segs = parsePath(selectedPath);
    const last = segs[segs.length - 1];

    if (typeof last !== "number") return;

    segs[segs.length - 1] = last + dir;
    onSelect(segs.join("."));
  }

  return (
    <div className="space-y-3 pt-3">
      <RadioGroup
        classNames={{
          base: "flex-row flex-wrap items-center gap-x-4 gap-y-2",
          label: "mb-0 shrink-0",
          wrapper: "gap-4",
        }}
        label="ชนิด Flex"
        orientation="horizontal"
        value={rootType}
        onValueChange={(v) => {
          if (v === "bubble" || v === "carousel") switchRoot(v);
        }}
      >
        <Radio value="bubble">บับเบิล</Radio>
        <Radio value="carousel">คารูเซล</Radio>
      </RadioGroup>

      <div>
        <p className="mb-2 text-sm font-medium text-default-700">
          เพิ่มองค์ประกอบ
        </p>
        <div className="flex flex-wrap gap-2">
          {PALETTE.map((item) => (
            <Button
              key={item.type}
              isDisabled={targetPath == null}
              size="sm"
              variant="flat"
              onPress={() => handleAppend(item.type)}
            >
              {item.label}
            </Button>
          ))}
          {rootType === "carousel" ? (
            <Button
              isDisabled={carouselLen >= 10}
              size="sm"
              variant="flat"
              onPress={() => {
                onChangeContents(appendChild(contents, "", emptyBubble()));
                onSelect(`contents.${carouselLen}.body`);
              }}
            >
              เพิ่มบับเบิล
            </Button>
          ) : null}
        </div>
        {targetPath == null ? (
          <p className="mt-1 text-xs text-default-500">
            เลือกกล่องหรือบับเบิลเพื่อเพิ่มองค์ประกอบ
          </p>
        ) : null}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-default-700">โครงสร้าง</p>
        <ul className="rounded-medium border border-default-200 p-2">
          <TreeRows
            node={contents}
            path=""
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        </ul>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            color="danger"
            isDisabled={!canDelete(contents, selectedPath)}
            size="sm"
            variant="flat"
            onPress={handleDelete}
          >
            ลบ
          </Button>
          <Button
            isDisabled={!siblings || siblings.index <= 0}
            size="sm"
            variant="flat"
            onPress={() => handleMove(-1)}
          >
            ขึ้น
          </Button>
          <Button
            isDisabled={!siblings || siblings.index >= siblings.length - 1}
            size="sm"
            variant="flat"
            onPress={() => handleMove(1)}
          >
            ลง
          </Button>
        </div>
      </div>
    </div>
  );
}
