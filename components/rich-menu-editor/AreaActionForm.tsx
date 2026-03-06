"use client";

import type { RichMenuArea } from "@/app/generated/prisma/client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Card, CardBody, CardHeader } from "@heroui/card";

import { useAppToast } from "@/components/AppToastProvider";

type ActionPayload = Record<string, unknown>;

export function AreaActionForm({
  area,
  onSave,
  onClose,
}: {
  area: RichMenuArea;
  onSave: (data: { actionType: string; action: ActionPayload }) => void;
  onClose: () => void;
}) {
  const toast = useAppToast();
  const [actionType, setActionType] = useState(area.actionType);
  const [action, setAction] = useState<ActionPayload>(
    (area.action as ActionPayload) ?? {},
  );

  useEffect(() => {
    setActionType(area.actionType);
    setAction((area.action as ActionPayload) ?? {});
  }, [area.id, area.actionType, area.action]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = buildActionPayload(actionType, action);

    onSave({ actionType, action: payload });
    toast.success("บันทึก Action สำเร็จ");
  }

  function buildActionPayload(type: string, raw: ActionPayload): ActionPayload {
    switch (type) {
      case "uri":
        return {
          type: "uri",
          uri: (raw.uri as string) ?? "",
          ...(raw.label ? { label: raw.label } : {}),
        };
      case "message":
        return {
          type: "message",
          text: (raw.text as string) ?? "",
          ...(raw.label ? { label: raw.label } : {}),
        };
      case "postback":
        return {
          type: "postback",
          data: (raw.data as string) ?? "",
          ...(raw.displayText ? { displayText: raw.displayText } : {}),
          ...(raw.label ? { label: raw.label } : {}),
        };
      case "richmenuswitch":
        return {
          type: "richmenuswitch",
          richMenuAliasId: (raw.richMenuAliasId as string) ?? "",
          data: (raw.data as string) ?? "",
          ...(raw.label ? { label: raw.label } : {}),
        };
      default:
        return { type: "message", text: "" };
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <span>แก้ไข Action (ปุ่ม #{area.order + 1})</span>
        <Button size="sm" variant="light" onPress={onClose}>
          ปิด
        </Button>
      </CardHeader>
      <CardBody>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Select
            label="ประเภท"
            selectedKeys={[actionType]}
            onSelectionChange={(keys) => {
              const k = Array.from(keys)[0];

              if (k) setActionType(String(k));
            }}
          >
            <SelectItem key="uri">URI</SelectItem>
            <SelectItem key="message">Message</SelectItem>
            <SelectItem key="postback">Postback</SelectItem>
            <SelectItem key="richmenuswitch">Switch Rich Menu</SelectItem>
          </Select>

          {actionType === "uri" && (
            <Input
              label="URL"
              placeholder="https://..."
              value={(action.uri as string) ?? ""}
              onValueChange={(v) => setAction((prev) => ({ ...prev, uri: v }))}
            />
          )}
          {actionType === "message" && (
            <Input
              label="ข้อความ"
              placeholder="ข้อความที่ส่งกลับ"
              value={(action.text as string) ?? ""}
              onValueChange={(v) => setAction((prev) => ({ ...prev, text: v }))}
            />
          )}
          {actionType === "postback" && (
            <>
              <Input
                label="Data"
                placeholder="postback data"
                value={(action.data as string) ?? ""}
                onValueChange={(v) =>
                  setAction((prev) => ({ ...prev, data: v }))
                }
              />
              <Input
                label="Display Text"
                placeholder="ข้อความแสดง (optional)"
                value={(action.displayText as string) ?? ""}
                onValueChange={(v) =>
                  setAction((prev) => ({ ...prev, displayText: v }))
                }
              />
            </>
          )}
          {actionType === "richmenuswitch" && (
            <>
              <Input
                label="Rich Menu Alias ID"
                placeholder="alias id"
                value={(action.richMenuAliasId as string) ?? ""}
                onValueChange={(v) =>
                  setAction((prev) => ({ ...prev, richMenuAliasId: v }))
                }
              />
              <Input
                label="Data"
                placeholder="data"
                value={(action.data as string) ?? ""}
                onValueChange={(v) =>
                  setAction((prev) => ({ ...prev, data: v }))
                }
              />
            </>
          )}

          <Button color="primary" type="submit">
            บันทึก
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
