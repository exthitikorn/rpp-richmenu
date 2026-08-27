"use client";

import type { FlexContents } from "@/lib/line/flex-contents";

import { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Radio, RadioGroup } from "@heroui/radio";
import { Switch } from "@heroui/switch";
import { Tab, Tabs } from "@heroui/tabs";

import { useAppToast } from "@/components/AppToastProvider";
import { PageHeader } from "@/components/page-header";
import { emptyBubble, flexContentsSchema } from "@/lib/line/flex-contents";

export type BuilderRule = {
  id: string;
  keyword: string;
  isEnabled: boolean;
  responseType: "TEXT" | "FLEX";
  responsePayload: unknown;
};

type EditorTab = "builder" | "json";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function payloadText(payload: unknown): string {
  const rec = asRecord(payload);

  return typeof rec?.text === "string" ? rec.text : "";
}

function hydrateFlex(payload: unknown): {
  altText: string;
  contents: FlexContents;
  jsonDraft: string;
  editorTab: EditorTab;
  jsonError: string;
} {
  const rec = asRecord(payload);
  const altText = typeof rec?.altText === "string" ? rec.altText : "";
  const raw = rec?.contents ?? emptyBubble();
  const parsed = flexContentsSchema.safeParse(raw);

  if (parsed.success) {
    return {
      altText,
      contents: parsed.data,
      jsonDraft: JSON.stringify(parsed.data, null, 2),
      editorTab: "builder",
      jsonError: "",
    };
  }

  return {
    altText,
    contents: emptyBubble(),
    jsonDraft: JSON.stringify(raw, null, 2),
    editorTab: "json",
    jsonError: "Flex JSON มีชนิดที่ไม่รองรับ — แก้ในแท็บ JSON",
  };
}

export function KeywordRuleBuilder({
  mode,
  lineAccountId,
  accountName,
  initialRule,
}: {
  mode: "create" | "edit";
  lineAccountId: string;
  accountName?: string;
  initialRule?: BuilderRule;
}) {
  const router = useRouter();
  const toast = useAppToast();
  const listHref = `/line-accounts/${lineAccountId}/auto-response`;
  const [flexStart] = useState(() =>
    hydrateFlex(
      initialRule?.responseType === "FLEX" ? initialRule.responsePayload : null,
    ),
  );

  const [keyword, setKeyword] = useState(initialRule?.keyword ?? "");
  const [isEnabled, setIsEnabled] = useState(initialRule?.isEnabled ?? true);
  const [responseType, setResponseType] = useState<"TEXT" | "FLEX">(
    initialRule?.responseType ?? "TEXT",
  );
  const [text, setText] = useState(
    initialRule?.responseType === "TEXT"
      ? payloadText(initialRule.responsePayload)
      : "",
  );
  const [altText, setAltText] = useState(flexStart.altText);
  const [contents, setContents] = useState<FlexContents>(flexStart.contents);
  const [selectedPath] = useState("body");
  const [editorTab, setEditorTab] = useState<EditorTab>(flexStart.editorTab);
  const [jsonDraft, setJsonDraft] = useState(flexStart.jsonDraft);
  const [jsonError, setJsonError] = useState(flexStart.jsonError);
  const [saving, setSaving] = useState(false);

  function applyJsonDraft(): FlexContents | null {
    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(jsonDraft);
    } catch {
      setJsonError("JSON ไม่ถูกต้อง — แก้ก่อนกลับไปตัวสร้าง");
      toast.error("JSON ไม่ถูกต้อง");

      return null;
    }

    const checked = flexContentsSchema.safeParse(parsedJson);

    if (!checked.success) {
      setJsonError("Flex JSON ไม่ถูกต้อง — แก้ก่อนกลับไปตัวสร้าง");
      toast.error("Flex JSON ไม่ถูกต้อง");

      return null;
    }

    setContents(checked.data);
    setJsonError("");

    return checked.data;
  }

  function handleEditorTab(key: string) {
    if (key !== "builder" && key !== "json") return;

    if (key === "json") {
      setJsonDraft(JSON.stringify(contents, null, 2));
      setEditorTab("json");

      return;
    }

    if (!applyJsonDraft()) return;

    setEditorTab("builder");
  }

  async function handleSave() {
    setSaving(true);

    try {
      let body: Record<string, unknown>;

      if (responseType === "TEXT") {
        body = { keyword, isEnabled, responseType: "TEXT", text };
      } else {
        const nextContents = editorTab === "json" ? applyJsonDraft() : contents;

        if (!nextContents) {
          setSaving(false);

          return;
        }

        body = {
          keyword,
          isEnabled,
          responseType: "FLEX",
          flex: { altText, contents: nextContents },
        };
      }

      const url =
        mode === "edit" && initialRule
          ? `/api/line-accounts/${lineAccountId}/keyword-rules/${initialRule.id}`
          : `/api/line-accounts/${lineAccountId}/keyword-rules`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        toast.error(data.error ?? "บันทึกไม่สำเร็จ");

        return;
      }

      toast.success(
        mode === "edit" ? "อัปเดต keyword แล้ว" : "เพิ่ม keyword แล้ว",
      );
      router.push(listHref);
      router.refresh();
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button as={NextLink} href={listHref} variant="light">
              กลับ
            </Button>
            <Button
              color="primary"
              isLoading={saving}
              onPress={() => void handleSave()}
            >
              บันทึก
            </Button>
          </div>
        }
        description={accountName}
        title={mode === "edit" ? "แก้ไข Keyword" : "เพิ่ม Keyword"}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(260px,320px)]">
        <section className="space-y-4">
          <Input
            isRequired
            label="Keyword"
            placeholder="ใส่ keyword ที่ต้องการตอบกลับ"
            value={keyword}
            onValueChange={setKeyword}
          />
          <Switch isSelected={isEnabled} onValueChange={setIsEnabled}>
            เปิดใช้กฎนี้
          </Switch>
          <RadioGroup
            classNames={{
              base: "flex-row flex-wrap items-center gap-x-4 gap-y-2",
              label: "mb-0 shrink-0",
              wrapper: "gap-4",
            }}
            label="ประเภทข้อความตอบ"
            orientation="horizontal"
            value={responseType}
            onValueChange={(v) => {
              if (v === "TEXT" || v === "FLEX") setResponseType(v);
            }}
          >
            <Radio value="TEXT">ข้อความ</Radio>
            <Radio value="FLEX">Flex Message</Radio>
          </RadioGroup>

          {responseType === "FLEX" ? (
            <>
              <Input
                isRequired
                label="ข้อความสำรอง"
                placeholder="เช่น เมนูช่วยเหลือ"
                value={altText}
                onValueChange={setAltText}
              />
              <Tabs
                aria-label="โหมดแก้ไข Flex"
                selectedKey={editorTab}
                onSelectionChange={(key) => handleEditorTab(String(key))}
              >
                <Tab key="builder" title="ตัวสร้าง">
                  <p className="pt-3 text-sm text-default-500">
                    ตัวสร้าง Flex จะพร้อมในขั้นตอนถัดไป —
                    ใส่ข้อความสำรองแล้วบันทึกบับเบิลว่างได้
                    {selectedPath ? ` (โหนด: ${selectedPath})` : ""}
                  </p>
                </Tab>
                <Tab key="json" title="JSON">
                  <Textarea
                    className="pt-3"
                    description="วาง JSON ของ Flex contents ตามชนิดที่ระบบรองรับ"
                    label="JSON เนื้อหา Flex"
                    labelPlacement="outside"
                    minRows={10}
                    placeholder='{"type":"bubble",...}'
                    value={jsonDraft}
                    onValueChange={(v) => {
                      setJsonDraft(v);
                      setJsonError("");
                    }}
                  />
                  {jsonError ? (
                    <p className="text-sm text-danger" role="alert">
                      {jsonError}
                    </p>
                  ) : null}
                </Tab>
              </Tabs>
            </>
          ) : null}
        </section>

        <section className="space-y-4">
          {responseType === "TEXT" ? (
            <Textarea
              isRequired
              label="ข้อความตอบกลับ"
              labelPlacement="outside"
              minRows={8}
              placeholder="ข้อความที่จะส่งเมื่อ keyword ตรง"
              value={text}
              onValueChange={setText}
            />
          ) : (
            <p className="text-sm text-default-500">
              เลือกโหนดทางซ้ายเพื่อแก้ไขคุณสมบัติ
            </p>
          )}
        </section>

        <aside>
          <p className="mb-2 text-sm font-semibold text-default-700">
            ตัวอย่างแชท
          </p>
          <div
            aria-label={`จำลองแชท LINE ของ ${accountName ?? "LINE OA"}`}
            className="mx-auto flex min-h-[420px] w-full max-w-[320px] flex-col overflow-hidden rounded-[2rem] border border-default-300 bg-black shadow-sm"
          >
            <div className="flex min-h-0 flex-1 flex-col bg-[#849bb4]">
              <div className="flex items-center justify-between px-5 pt-2.5 text-[10px] font-semibold text-black">
                <span>11:48</span>
              </div>
              <div className="bg-white/35 px-3 py-1.5 text-[13px] font-semibold text-black">
                <p className="truncate">{accountName ?? "LINE OA"}</p>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-2.5 px-2.5 pb-2 pt-2">
                {responseType === "TEXT" && text.trim() ? (
                  <div className="flex items-end gap-1.5">
                    <span
                      aria-hidden
                      className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ffcc00] text-[8px] font-bold text-[#1c1c1e]"
                    >
                      OA
                    </span>
                    <div className="whitespace-pre-wrap rounded-2xl rounded-bl-md bg-white px-3 py-2 text-[12px] leading-snug text-black shadow-sm">
                      {text}
                    </div>
                  </div>
                ) : (
                  <p className="py-4 text-center text-xs text-white/80">
                    {responseType === "FLEX"
                      ? "ตัวอย่าง Flex จะแสดงในขั้นตอนถัดไป"
                      : "พิมพ์ข้อความเพื่อดูตัวอย่าง"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
