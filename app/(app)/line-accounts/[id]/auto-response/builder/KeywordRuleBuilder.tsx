"use client";

import type { FlexContents } from "@/lib/line/flex-contents";

import { useEffect, useState } from "react";
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
const JSON_APPLY_MS = 350;

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

function parseFlexDraft(
  draft: string,
):
  | { ok: true; contents: FlexContents; altText?: string }
  | { ok: false; error: string } {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(draft);
  } catch {
    return { ok: false, error: "JSON ไม่ถูกต้อง" };
  }

  const unwrapped = unwrapFlexJson(parsedJson);
  const checked = flexContentsSchema.safeParse(unwrapped.contents);

  if (!checked.success) {
    const issue = checked.error.issues[0];

    return {
      ok: false,
      error: issue?.message ?? "Flex JSON ไม่ถูกต้อง",
    };
  }

  return {
    ok: true,
    contents: checked.data,
    altText: unwrapped.altText,
  };
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
    jsonError: "Flex JSON ไม่ถูกต้อง — แก้ในช่อง JSON",
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

  useEffect(() => {
    if (responseType !== "FLEX") return;

    const timer = setTimeout(() => {
      const parsed = parseFlexDraft(jsonDraft);

      if (!parsed.ok) {
        setJsonError(parsed.error);

        return;
      }

      setJsonError("");
      setContents(parsed.contents);
      if (parsed.altText) {
        setAltText((prev) => (prev.trim() ? prev : parsed.altText!));
      }
    }, JSON_APPLY_MS);

    return () => clearTimeout(timer);
  }, [jsonDraft, responseType]);

  async function handleSave() {
    setSaving(true);

    try {
      let body: Record<string, unknown>;

      if (responseType === "TEXT") {
        body = { keyword, isEnabled, responseType: "TEXT", text };
      } else {
        const parsed = parseFlexDraft(jsonDraft);

        if (!parsed.ok) {
          setJsonError(parsed.error);
          toast.error(parsed.error);
          setSaving(false);

          return;
        }

        const nextAlt = altText.trim() || parsed.altText?.trim() || "";

        if (!nextAlt) {
          toast.error("กรุณาระบุข้อความสำรอง");
          setSaving(false);

          return;
        }

        if (parsed.altText && !altText.trim()) {
          setAltText(parsed.altText);
        }

        body = {
          keyword,
          isEnabled,
          responseType: "FLEX",
          flex: { altText: nextAlt, contents: parsed.contents },
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
            description={accountName}
            title={mode === "edit" ? "แก้ไข Keyword" : "เพิ่ม Keyword"}
          />

          <div
            className={
              responseType === "FLEX"
                ? "grid grid-cols-1 gap-4 lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)_320px] lg:items-start"
                : "grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start"
            }
          >
            <section className="space-y-4">
              <Input
                isRequired
                label="Keyword"
                labelPlacement="outside"
                placeholder="ใส่ keyword ที่ต้องการตอบกลับ"
                value={keyword}
                onValueChange={setKeyword}
              />
              <Switch isSelected={isEnabled} onValueChange={setIsEnabled}>
                เปิดใช้กฎนี้
              </Switch>
              <RadioGroup
                classNames={{
                  base: "flex flex-col gap-2",
                  label: "mb-0",
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
                  <ol className="list-decimal space-y-1 rounded-lg border border-default-200 bg-default-50 px-3 py-2 pl-7 text-sm text-default-700">
                    <li>
                      ออกแบบที่{" "}
                      <Link
                        isExternal
                        showAnchorIcon
                        href={FLEX_SIMULATOR_URL}
                        size="sm"
                      >
                        Flex Message Simulator
                      </Link>
                    </li>
                    <li>วาง JSON ตรงกลาง</li>
                    <li>ตัวอย่างอัปเดตเอง</li>
                  </ol>
                </>
              )}
            </section>

            {responseType === "FLEX" ? (
              <section className="flex flex-col gap-2">
                <Textarea
                  classNames={{
                    inputWrapper: "min-h-[calc(100vh-14rem)] items-start",
                    input:
                      "min-h-[calc(100vh-16rem)] font-mono text-xs leading-relaxed!",
                  }}
                  label="JSON เนื้อหา Flex"
                  labelPlacement="outside"
                  minRows={40}
                  placeholder='{"type":"bubble",...}'
                  value={jsonDraft}
                  onValueChange={setJsonDraft}
                />
                {jsonError ? (
                  <p className="text-sm text-danger" role="alert">
                    {jsonError}
                  </p>
                ) : null}
              </section>
            ) : null}

            <aside className="w-full lg:w-[320px]">
              <p className="mb-2 text-sm font-semibold text-default-700">
                ตัวอย่างแชท
              </p>
              <AutoResponseChatPreview
                accountName={accountName ?? "LINE OA"}
                contents={contents}
                keyword={keyword}
                responseType={responseType}
                text={text}
              />
            </aside>
          </div>

          <div className="flex justify-center gap-3 border-t border-default-200 pt-4">
            <Button
              as={NextLink}
              className="text-white"
              color="warning"
              href={listHref}
              variant="solid"
            >
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
        </CardBody>
      </Card>
    </div>
  );
}
