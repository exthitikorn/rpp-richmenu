"use client";

import type { FlexContents } from "@/lib/line/flex-contents";

import { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import { Link } from "@heroui/link";
import { Radio, RadioGroup } from "@heroui/radio";
import { Switch } from "@heroui/switch";

import { AutoResponseChatPreview } from "./AutoResponseChatPreview";

import { useAppToast } from "@/components/AppToastProvider";
import { PageHeader } from "@/components/page-header";
import {
  emptyBubble,
  flexContentsSchema,
  unwrapFlexJson,
} from "@/lib/line/flex-contents";

const FLEX_SIMULATOR_URL = "https://developers.line.biz/flex-simulator/";

export type BuilderRule = {
  id: string;
  keyword: string;
  isEnabled: boolean;
  responseType: "TEXT" | "FLEX";
  responsePayload: unknown;
};

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
      jsonError: "",
    };
  }

  return {
    altText,
    contents: emptyBubble(),
    jsonDraft: JSON.stringify(raw, null, 2),
    jsonError: "Flex JSON ไม่ถูกต้อง — แก้แล้วกดใช้ JSON",
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
  const [jsonDraft, setJsonDraft] = useState(flexStart.jsonDraft);
  const [jsonError, setJsonError] = useState(flexStart.jsonError);
  const [saving, setSaving] = useState(false);

  function applyJsonDraft(options?: {
    toastOnError?: boolean;
  }): FlexContents | null {
    const toastOnError = options?.toastOnError ?? true;
    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(jsonDraft);
    } catch {
      setJsonError("JSON ไม่ถูกต้อง");
      if (toastOnError) toast.error("JSON ไม่ถูกต้อง");

      return null;
    }

    const unwrapped = unwrapFlexJson(parsedJson);

    if (unwrapped.altText && !altText.trim()) {
      setAltText(unwrapped.altText);
    }

    const checked = flexContentsSchema.safeParse(unwrapped.contents);

    if (!checked.success) {
      const issue = checked.error.issues[0];
      const msg = issue?.message ?? "Flex JSON ไม่ถูกต้อง";

      setJsonError(msg);
      if (toastOnError) toast.error(msg);

      return null;
    }

    setContents(checked.data);
    setJsonDraft(JSON.stringify(checked.data, null, 2));
    setJsonError("");

    return checked.data;
  }

  async function handleSave() {
    setSaving(true);

    try {
      let body: Record<string, unknown>;

      if (responseType === "TEXT") {
        body = { keyword, isEnabled, responseType: "TEXT", text };
      } else {
        const nextContents = applyJsonDraft();

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
      <Card className="border border-default-200 shadow-none">
        <CardBody className="gap-4 p-4">
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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
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
                <>
                  <Input
                    isRequired
                    label="ข้อความสำรอง"
                    placeholder="เช่น เมนูช่วยเหลือ"
                    value={altText}
                    onValueChange={setAltText}
                  />
                  <div className="rounded-lg border border-default-200 bg-default-50 px-3 py-2 text-sm text-default-700">
                    ออกแบบ Flex ที่{" "}
                    <Link
                      isExternal
                      showAnchorIcon
                      href={FLEX_SIMULATOR_URL}
                      size="sm"
                    >
                      Flex Message Simulator
                    </Link>{" "}
                    แล้วคัดลอก JSON มาวางด้านล่าง (root ต้องเป็น{" "}
                    <code className="text-xs">bubble</code> หรือ{" "}
                    <code className="text-xs">carousel</code>)
                  </div>
                  <Textarea
                    classNames={{ input: "font-mono text-xs" }}
                    description="วาง contents (bubble/carousel) หรือทั้ง Flex Message จาก Simulator"
                    label="JSON เนื้อหา Flex"
                    labelPlacement="outside"
                    minRows={16}
                    placeholder='{"type":"bubble",...}'
                    value={jsonDraft}
                    onBlur={() => applyJsonDraft({ toastOnError: false })}
                    onValueChange={(v) => {
                      setJsonDraft(v);
                      setJsonError("");
                    }}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => {
                        if (applyJsonDraft()) {
                          toast.success("ใช้ JSON แล้ว — ดูตัวอย่างทางขวา");
                        }
                      }}
                    >
                      ใช้ JSON
                    </Button>
                    {jsonError ? (
                      <p className="text-sm text-danger" role="alert">
                        {jsonError}
                      </p>
                    ) : null}
                  </div>
                </>
              )}
            </section>

            <aside>
              <p className="mb-2 text-sm font-semibold text-default-700">
                ตัวอย่างแชท
              </p>
              <AutoResponseChatPreview
                accountName={accountName ?? "LINE OA"}
                contents={contents}
                responseType={responseType}
                text={text}
              />
            </aside>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
