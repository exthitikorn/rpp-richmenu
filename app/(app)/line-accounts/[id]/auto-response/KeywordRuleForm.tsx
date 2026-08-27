"use client";

import type { RuleRow } from "./types";

import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Radio, RadioGroup } from "@heroui/radio";
import { Switch } from "@heroui/switch";
import { Tab, Tabs } from "@heroui/tabs";

import { useAppToast } from "@/components/AppToastProvider";

type FlexPattern = "single" | "carousel" | "json";

type CardFields = {
  imageUrl: string;
  title: string;
  body: string;
  actionLabel: string;
  actionUri: string;
};

const emptyCard = (): CardFields => ({
  imageUrl: "",
  title: "",
  body: "",
  actionLabel: "",
  actionUri: "",
});

const CAROUSEL_MIN_CARDS = 2;
const CAROUSEL_MAX_CARDS = 3;

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M3 6h18M8 6V4h8v2M19 6v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function KeywordRuleForm({
  lineAccountId,
  isOpen,
  onOpenChange,
  editingRuleId,
  onSaved,
}: {
  lineAccountId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingRuleId: string | null;
  onSaved: (rule: RuleRow) => void;
}) {
  const toast = useAppToast();
  const [loading, setLoading] = useState(false);
  const [loadingRule, setLoadingRule] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [responseType, setResponseType] = useState<"TEXT" | "FLEX">("TEXT");
  const [text, setText] = useState("");
  const [flexPattern, setFlexPattern] = useState<FlexPattern>("single");
  const [altText, setAltText] = useState("");
  const [card, setCard] = useState<CardFields>(emptyCard());
  const [cards, setCards] = useState<CardFields[]>([emptyCard(), emptyCard()]);
  const [activeCardTab, setActiveCardTab] = useState("0");
  const [contentsJson, setContentsJson] = useState("");
  const loadKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      loadKeyRef.current = null;

      return;
    }

    const loadKey = editingRuleId ?? "create";

    if (loadKeyRef.current === loadKey) return;
    loadKeyRef.current = loadKey;

    if (!editingRuleId) {
      setKeyword("");
      setIsEnabled(true);
      setResponseType("TEXT");
      setText("");
      setFlexPattern("single");
      setAltText("");
      setCard(emptyCard());
      setCards([emptyCard(), emptyCard()]);
      setActiveCardTab("0");
      setContentsJson("");

      return;
    }

    let cancelled = false;

    setLoadingRule(true);
    void fetch(
      `/api/line-accounts/${lineAccountId}/keyword-rules/${editingRuleId}`,
    )
      .then(async (res) => {
        const data = (await res.json()) as {
          rule?: {
            keyword: string;
            isEnabled: boolean;
            responseType: "TEXT" | "FLEX";
            responsePayload: {
              text?: string;
              altText?: string;
              contents?: unknown;
            };
          };
          error?: string;
        };

        if (cancelled) return;

        if (!res.ok || !data.rule) {
          toast.error(data.error ?? "โหลด rule ไม่สำเร็จ");
          onOpenChange(false);

          return;
        }

        const rule = data.rule;

        setKeyword(rule.keyword);
        setIsEnabled(rule.isEnabled);
        setResponseType(rule.responseType);

        if (rule.responseType === "TEXT") {
          setText(rule.responsePayload.text ?? "");
        } else {
          setFlexPattern("json");
          setAltText(rule.responsePayload.altText ?? "");
          setContentsJson(
            JSON.stringify(rule.responsePayload.contents ?? {}, null, 2),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRule(false);
      });

    return () => {
      cancelled = true;
    };
    // toast/onOpenChange omitted — useAppToast() returns a new object each render
  }, [isOpen, editingRuleId, lineAccountId]);

  function buildBody() {
    const base = { keyword, isEnabled, responseType };

    if (responseType === "TEXT") {
      return { ...base, text };
    }

    if (flexPattern === "single") {
      return {
        ...base,
        flex: {
          pattern: "single" as const,
          altText,
          card: {
            ...(card.imageUrl ? { imageUrl: card.imageUrl } : {}),
            ...(card.title ? { title: card.title } : {}),
            body: card.body,
            ...(card.actionLabel && card.actionUri
              ? { actionLabel: card.actionLabel, actionUri: card.actionUri }
              : {}),
          },
        },
      };
    }

    if (flexPattern === "carousel") {
      return {
        ...base,
        flex: {
          pattern: "carousel" as const,
          altText,
          cards: cards.map((c) => ({
            ...(c.imageUrl ? { imageUrl: c.imageUrl } : {}),
            ...(c.title ? { title: c.title } : {}),
            body: c.body,
            ...(c.actionLabel && c.actionUri
              ? { actionLabel: c.actionLabel, actionUri: c.actionUri }
              : {}),
          })),
        },
      };
    }

    return {
      ...base,
      flex: {
        pattern: "json" as const,
        altText,
        contentsJson,
      },
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingRuleId
        ? `/api/line-accounts/${lineAccountId}/keyword-rules/${editingRuleId}`
        : `/api/line-accounts/${lineAccountId}/keyword-rules`;
      const res = await fetch(url, {
        method: editingRuleId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody()),
      });
      const data = (await res.json()) as { rule?: RuleRow; error?: string };

      if (!res.ok || !data.rule) {
        toast.error(data.error ?? "บันทึกไม่สำเร็จ");
        setLoading(false);

        return;
      }

      toast.success(
        editingRuleId ? "อัปเดต keyword แล้ว" : "เพิ่ม keyword แล้ว",
      );
      onSaved(data.rule);
      onOpenChange(false);
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  function removeCard(index: number) {
    if (cards.length <= CAROUSEL_MIN_CARDS) return;

    const next = cards.filter((_, j) => j !== index);

    setCards(next);

    const current = Number(activeCardTab);

    if (current >= next.length) {
      setActiveCardTab(String(next.length - 1));
    } else if (current > index) {
      setActiveCardTab(String(current - 1));
    }
  }

  function renderCardFields(
    value: CardFields,
    onChange: (next: CardFields) => void,
    label?: string,
  ) {
    return (
      <div
        className={
          label
            ? "flex w-full flex-col gap-3 rounded-lg border border-default-200 bg-default-50/50 p-4"
            : "flex w-full flex-col gap-3 py-1"
        }
      >
        {label ? (
          <p className="text-sm font-semibold text-default-700">{label}</p>
        ) : null}
        <Input
          label="URL รูปภาพ"
          labelPlacement="inside"
          placeholder="https://example.com/image.jpg"
          value={value.imageUrl}
          onValueChange={(v) => onChange({ ...value, imageUrl: v })}
        />
        <Input
          label="หัวข้อ"
          labelPlacement="inside"
          placeholder="หัวข้อการ์ด (ไม่บังคับ)"
          value={value.title}
          onValueChange={(v) => onChange({ ...value, title: v })}
        />
        <Textarea
          isRequired
          label="เนื้อหา"
          labelPlacement="inside"
          minRows={1}
          placeholder="ข้อความในการ์ด"
          value={value.body}
          onValueChange={(v) => onChange({ ...value, body: v })}
        />
        <Input
          label="ข้อความปุ่ม"
          labelPlacement="inside"
          placeholder="เช่น ดูรายละเอียด"
          value={value.actionLabel}
          onValueChange={(v) => onChange({ ...value, actionLabel: v })}
        />
        <Input
          label="ลิงก์ปุ่ม"
          labelPlacement="inside"
          placeholder="https://example.com"
          value={value.actionUri}
          onValueChange={(v) => onChange({ ...value, actionUri: v })}
        />
      </div>
    );
  }

  return (
    <Modal
      hideCloseButton
      backdrop="blur"
      isOpen={isOpen}
      placement="center"
      scrollBehavior="inside"
      size="3xl"
      onOpenChange={onOpenChange}
    >
      <ModalContent className="max-h-[90vh]">
        {(onClose) => (
          <form
            className="flex max-h-[90vh] flex-col overflow-hidden"
            onSubmit={handleSubmit}
          >
            <ModalHeader className="flex shrink-0 items-center justify-between gap-4">
              <span>{editingRuleId ? "แก้ไข Keyword" : "เพิ่ม Keyword"}</span>
              <Switch isSelected={isEnabled} onValueChange={setIsEnabled}>
                เปิดใช้กฎนี้
              </Switch>
            </ModalHeader>
            <ModalBody className="min-h-0 flex-1 gap-5 overflow-y-auto py-2">
              {loadingRule ? (
                <p className="text-sm text-default-500">กำลังโหลด...</p>
              ) : (
                <>
                  <Input
                    isRequired
                    label="Keyword"
                    placeholder="ใส่ keyword ที่ต้องการตอบกลับ"
                    value={keyword}
                    onValueChange={setKeyword}
                  />
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
                      minRows={4}
                      placeholder="ข้อความที่จะส่งเมื่อ keyword ตรง"
                      value={text}
                      onValueChange={setText}
                    />
                  ) : (
                    <div className="space-y-5 border-t border-default-200 pt-5">
                      <RadioGroup
                        classNames={{
                          base: "flex-row flex-wrap items-center gap-x-4 gap-y-2",
                          label: "mb-0 shrink-0",
                          wrapper: "gap-3 flex-wrap",
                        }}
                        label="รูปแบบ Flex"
                        orientation="horizontal"
                        value={flexPattern}
                        onValueChange={(v) => {
                          if (
                            v === "single" ||
                            v === "carousel" ||
                            v === "json"
                          ) {
                            setFlexPattern(v);
                          }
                        }}
                      >
                        <Radio value="single">การ์ดเดียว</Radio>
                        <Radio value="carousel">หลายการ์ด (2–3)</Radio>
                        <Radio value="json">JSON ขั้นสูง</Radio>
                      </RadioGroup>
                      <Input
                        isRequired
                        label="ข้อความสำรอง"
                        placeholder="เช่น เมนูช่วยเหลือ"
                        value={altText}
                        onValueChange={setAltText}
                      />
                      {flexPattern === "single" &&
                        renderCardFields(card, setCard, "การ์ด")}
                      {flexPattern === "carousel" && (
                        <div className="flex flex-col gap-2">
                          <div className="relative">
                            <Tabs
                              aria-label="การ์ด carousel"
                              classNames={{
                                base: "w-full",
                                tabList: "h-10 max-w-[calc(100%-4.5rem)]",
                              }}
                              selectedKey={activeCardTab}
                              onSelectionChange={(key) =>
                                setActiveCardTab(String(key))
                              }
                            >
                              {cards.map((c, i) => (
                                <Tab key={String(i)} title={`การ์ด ${i + 1}`}>
                                  {renderCardFields(c, (next) => {
                                    const copy = [...cards];

                                    copy[i] = next;
                                    setCards(copy);
                                  })}
                                </Tab>
                              ))}
                            </Tabs>
                            <div className="absolute right-0 top-0 flex h-10 items-center gap-1">
                              {cards.length > CAROUSEL_MIN_CARDS && (
                                <Button
                                  isIconOnly
                                  aria-label={`ลบการ์ด ${Number(activeCardTab) + 1}`}
                                  color="danger"
                                  size="sm"
                                  variant="light"
                                  onPress={() =>
                                    removeCard(Number(activeCardTab))
                                  }
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              )}
                              {cards.length < CAROUSEL_MAX_CARDS && (
                                <Button
                                  isIconOnly
                                  aria-label="เพิ่มการ์ด"
                                  color="primary"
                                  size="sm"
                                  variant="solid"
                                  onPress={() => {
                                    setCards([...cards, emptyCard()]);
                                    setActiveCardTab(String(cards.length));
                                  }}
                                >
                                  <PlusIcon className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      {flexPattern === "json" && (
                        <Textarea
                          isRequired
                          description="วาง JSON ของ Flex contents ตามเอกสาร LINE"
                          label="JSON เนื้อหา Flex"
                          labelPlacement="outside"
                          minRows={8}
                          placeholder='{"type":"bubble",...}'
                          value={contentsJson}
                          onValueChange={setContentsJson}
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </ModalBody>
            <ModalFooter className="shrink-0">
              <Button variant="light" onPress={onClose}>
                ยกเลิก
              </Button>
              <Button color="primary" isLoading={loading} type="submit">
                บันทึก
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
