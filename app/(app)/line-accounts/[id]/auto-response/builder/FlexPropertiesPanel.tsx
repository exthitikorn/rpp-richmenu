"use client";

import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";

import { deleteAtPath, getAtPath, setAtPath } from "@/lib/line/flex-tree";

const TEXT_SIZES = ["xs", "sm", "md", "lg", "xl", "xxl", "3xl", "4xl", "5xl"];
const IMAGE_SIZES = [
  "xxs",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "xxl",
  "3xl",
  "4xl",
  "5xl",
  "full",
];
const SPACING = ["none", "xs", "sm", "md", "lg", "xl", "xxl"];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function fieldPath(selectedPath: string, key: string): string {
  return selectedPath === "" ? key : `${selectedPath}.${key}`;
}

function OptionalSelect({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value: string;
  options: string[];
  onPick: (next: string | null) => void;
}) {
  const selected = value || "default";
  const items = [
    { key: "default", label: "ค่าเริ่มต้น" },
    ...options.map((opt) => ({ key: opt, label: opt })),
  ];

  return (
    <Select
      items={items}
      label={label}
      labelPlacement="outside"
      selectedKeys={[selected]}
      onSelectionChange={(keys) => {
        const key = Array.from(keys)[0];

        if (!key || key === "default") onPick(null);
        else onPick(String(key));
      }}
    >
      {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
    </Select>
  );
}

export function FlexPropertiesPanel({
  contents,
  selectedPath,
  onChangeContents,
}: {
  contents: unknown;
  selectedPath: string;
  onChangeContents: (next: unknown) => void;
}) {
  const node = getAtPath(contents, selectedPath);
  const rec = asRecord(node);
  const type = typeof rec?.type === "string" ? rec.type : undefined;

  function setField(key: string, value: unknown) {
    onChangeContents(setAtPath(contents, fieldPath(selectedPath, key), value));
  }

  function clearField(key: string) {
    onChangeContents(deleteAtPath(contents, fieldPath(selectedPath, key)));
  }

  if (!rec || !type) {
    return (
      <p className="text-sm text-default-500">
        เลือกโหนดทางซ้ายเพื่อแก้ไขคุณสมบัติ
      </p>
    );
  }

  if (type === "text") {
    return (
      <div className="space-y-4">
        <Textarea
          label="ข้อความ"
          labelPlacement="outside"
          minRows={3}
          value={str(rec.text)}
          onValueChange={(v) => setField("text", v)}
        />
        <Switch
          isSelected={rec.wrap !== false}
          onValueChange={(v) => setField("wrap", v)}
        >
          ขึ้นบรรทัดใหม่
        </Switch>
        <Select
          label="น้ำหนักตัวอักษร"
          labelPlacement="outside"
          selectedKeys={[str(rec.weight) || "regular"]}
          onSelectionChange={(keys) => {
            const key = Array.from(keys)[0];

            if (key) setField("weight", String(key));
          }}
        >
          <SelectItem key="regular">ปกติ</SelectItem>
          <SelectItem key="bold">ตัวหนา</SelectItem>
        </Select>
        <OptionalSelect
          label="ขนาด"
          options={TEXT_SIZES}
          value={str(rec.size)}
          onPick={(v) => (v ? setField("size", v) : clearField("size"))}
        />
        <Input
          label="สี"
          labelPlacement="outside"
          placeholder="#111111"
          value={str(rec.color)}
          onValueChange={(v) =>
            v ? setField("color", v) : clearField("color")
          }
        />
      </div>
    );
  }

  if (type === "image") {
    return (
      <div className="space-y-4">
        <Input
          isRequired
          label="URL รูป"
          labelPlacement="outside"
          placeholder="https://"
          value={str(rec.url)}
          onValueChange={(v) => setField("url", v)}
        />
        <OptionalSelect
          label="ขนาด"
          options={IMAGE_SIZES}
          value={str(rec.size)}
          onPick={(v) => (v ? setField("size", v) : clearField("size"))}
        />
        <Input
          label="อัตราส่วน"
          labelPlacement="outside"
          placeholder="20:13"
          value={str(rec.aspectRatio)}
          onValueChange={(v) =>
            v ? setField("aspectRatio", v) : clearField("aspectRatio")
          }
        />
        <Select
          label="การครอบตัด"
          labelPlacement="outside"
          selectedKeys={[str(rec.aspectMode) || "cover"]}
          onSelectionChange={(keys) => {
            const key = Array.from(keys)[0];

            if (key) setField("aspectMode", String(key));
          }}
        >
          <SelectItem key="cover">cover</SelectItem>
          <SelectItem key="fit">fit</SelectItem>
        </Select>
      </div>
    );
  }

  if (type === "button") {
    const action = asRecord(rec.action);

    return (
      <div className="space-y-4">
        <Input
          isRequired
          label="ข้อความปุ่ม"
          labelPlacement="outside"
          value={str(action?.label)}
          onValueChange={(v) => setField("action.label", v)}
        />
        <Input
          isRequired
          label="ลิงก์ (https)"
          labelPlacement="outside"
          placeholder="https://"
          value={str(action?.uri)}
          onValueChange={(v) => setField("action.uri", v)}
        />
      </div>
    );
  }

  if (type === "box") {
    const layout = str(rec.layout) || "vertical";

    return (
      <div className="space-y-4">
        <Select
          label="การจัดวาง"
          labelPlacement="outside"
          selectedKeys={[layout]}
          onSelectionChange={(keys) => {
            const key = Array.from(keys)[0];

            if (key === "vertical" || key === "horizontal") {
              setField("layout", key);
            }
          }}
        >
          <SelectItem key="vertical">แนวตั้ง</SelectItem>
          <SelectItem key="horizontal">แนวนอน</SelectItem>
        </Select>
        <OptionalSelect
          label="ระยะห่างภายใน"
          options={SPACING}
          value={str(rec.spacing)}
          onPick={(v) => (v ? setField("spacing", v) : clearField("spacing"))}
        />
        <OptionalSelect
          label="ระยะขอบ"
          options={SPACING}
          value={str(rec.margin)}
          onPick={(v) => (v ? setField("margin", v) : clearField("margin"))}
        />
      </div>
    );
  }

  if (type === "separator") {
    return (
      <div className="space-y-4">
        <OptionalSelect
          label="ระยะขอบ"
          options={SPACING}
          value={str(rec.margin)}
          onPick={(v) => (v ? setField("margin", v) : clearField("margin"))}
        />
        <Input
          label="สี"
          labelPlacement="outside"
          placeholder="#EEEEEE"
          value={str(rec.color)}
          onValueChange={(v) =>
            v ? setField("color", v) : clearField("color")
          }
        />
      </div>
    );
  }

  if (type === "bubble" || type === "carousel") {
    return (
      <p className="text-sm text-default-500">
        เลือกกล่องหรือองค์ประกอบย่อยเพื่อแก้ไขคุณสมบัติ
      </p>
    );
  }

  return <p className="text-sm text-default-500">แก้ในแท็บ JSON</p>;
}
