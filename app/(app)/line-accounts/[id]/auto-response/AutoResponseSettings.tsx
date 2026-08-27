"use client";

import type { RuleRow } from "./types";

import { useCallback, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Switch } from "@heroui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { Textarea } from "@heroui/input";

import { KeywordRuleForm } from "./KeywordRuleForm";

import { useAppToast } from "@/components/AppToastProvider";
import { PageHeader } from "@/components/page-header";

type Settings = {
  autoResponseEnabled: boolean;
  fallbackMessage: string | null;
};

function responseTypeLabel(type: RuleRow["responseType"]): string {
  return type === "TEXT" ? "ข้อความ" : "Flex";
}

function flexSourceLabel(source: RuleRow["flexSource"]): string | null {
  if (!source) return null;

  return source === "FORM" ? "ฟอร์ม" : "JSON";
}

export function AutoResponseSettings({
  lineAccountId,
  channelId,
  webhookUrl,
  initialSettings,
  initialRules,
}: {
  lineAccountId: string;
  channelId: string;
  webhookUrl: string | null;
  initialSettings: Settings;
  initialRules: RuleRow[];
}) {
  const router = useRouter();
  const toast = useAppToast();
  const [settings, setSettings] = useState(initialSettings);
  const [rules, setRules] = useState(initialRules);
  const [savingSettings, setSavingSettings] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  async function saveSettings() {
    setSavingSettings(true);
    try {
      const res = await fetch(
        `/api/line-accounts/${lineAccountId}/auto-response`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        },
      );
      const data = (await res.json()) as Settings & { error?: string };

      if (!res.ok) {
        toast.error(data.error ?? "บันทึกไม่สำเร็จ");

        return;
      }

      setSettings(data);
      toast.success("บันทึกการตั้งค่าแล้ว");
      router.refresh();
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setSavingSettings(false);
    }
  }

  async function toggleRule(rule: RuleRow, isEnabled: boolean) {
    const res = await fetch(
      `/api/line-accounts/${lineAccountId}/keyword-rules/${rule.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled }),
      },
    );
    const data = (await res.json()) as { rule?: RuleRow; error?: string };

    if (!res.ok || !data.rule) {
      toast.error(data.error ?? "อัปเดตไม่สำเร็จ");

      return;
    }

    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, isEnabled } : r)),
    );
  }

  async function deleteRule(rule: RuleRow) {
    if (!confirm(`ลบ keyword "${rule.keyword}"?`)) return;

    const res = await fetch(
      `/api/line-accounts/${lineAccountId}/keyword-rules/${rule.id}`,
      { method: "DELETE" },
    );

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };

      toast.error(data.error ?? "ลบไม่สำเร็จ");

      return;
    }

    setRules((prev) => prev.filter((r) => r.id !== rule.id));
    toast.success("ลบ keyword แล้ว");
    router.refresh();
  }

  function copyWebhook() {
    if (!webhookUrl) return;
    void navigator.clipboard.writeText(webhookUrl);
    toast.success("คัดลอก Webhook URL แล้ว");
  }

  const handleRuleSaved = useCallback(
    (rule: RuleRow) => {
      setRules((prev) => {
        const idx = prev.findIndex((r) => r.id === rule.id);

        if (idx >= 0) {
          const next = [...prev];

          next[idx] = rule;

          return next.sort((a, b) => a.keyword.localeCompare(b.keyword));
        }

        return [...prev, rule].sort((a, b) =>
          a.keyword.localeCompare(b.keyword),
        );
      });
      router.refresh();
    },
    [router],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        description="จัดการ keyword ตอบกลับอัตโนมัติแทน LINE OA Manager"
        title="ตอบกลับอัตโนมัติ"
      />

      <Card className="border border-warning-200 bg-warning-50/50 shadow-none">
        <CardBody className="gap-2 text-sm">
          <p className="font-medium text-warning-800">
            ปิด Auto-reply ใน LINE OA Manager แล้วตั้ง Webhook URL ของระบบนี้
          </p>
          <p className="text-default-600">
            Channel ID: <code className="text-xs">{channelId}</code>
          </p>
          {webhookUrl ? (
            <div className="flex flex-wrap items-center gap-2">
              <code className="break-all rounded bg-default-100 px-2 py-1 text-xs">
                {webhookUrl}
              </code>
              <Button size="sm" variant="flat" onPress={copyWebhook}>
                คัดลอก Webhook
              </Button>
            </div>
          ) : (
            <p className="text-warning-700">
              ตั้ง NEXTAUTH_URL ใน .env เพื่อสร้าง Webhook URL
            </p>
          )}
        </CardBody>
      </Card>

      <Card className="border border-default-200 shadow-none">
        <CardHeader className="flex flex-col items-start gap-1 pb-2">
          <h2 className="text-lg font-semibold">การตั้งค่า</h2>
          <p className="text-sm font-normal text-default-500">
            เปิดใช้งานและข้อความ fallback เมื่อไม่ match keyword
          </p>
        </CardHeader>
        <CardBody className="gap-4">
          <Switch
            isSelected={settings.autoResponseEnabled}
            onValueChange={(v) =>
              setSettings((s) => ({ ...s, autoResponseEnabled: v }))
            }
          >
            เปิดใช้ตอบกลับอัตโนมัติ
          </Switch>
          <Textarea
            description="ส่งเมื่อไม่พบ keyword ที่ตรง (เว้นว่าง = ไม่ตอบ)"
            label="ข้อความสำรอง (ไม่ match)"
            labelPlacement="outside"
            minRows={3}
            placeholder="เช่น พิมพ์ ช่วยเหลือ เพื่อดูเมนู"
            value={settings.fallbackMessage ?? ""}
            onValueChange={(v) =>
              setSettings((s) => ({ ...s, fallbackMessage: v || null }))
            }
          />
          <div className="flex justify-end">
            <Button
              color="primary"
              isLoading={savingSettings}
              onPress={saveSettings}
            >
              บันทึกการตั้งค่า
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card className="border border-default-200 shadow-none">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2 pb-2">
          <div>
            <h2 className="text-lg font-semibold">รายการ Keyword</h2>
            <p className="text-sm font-normal text-default-500">
              ตรง keyword แบบพอดี (ไม่สนตัวพิมพ์เล็ก/ใหญ่)
            </p>
          </div>
          <Button
            color="primary"
            variant="flat"
            onPress={() => {
              setEditingRuleId(null);
              setFormOpen(true);
            }}
          >
            เพิ่ม Keyword
          </Button>
        </CardHeader>
        <CardBody className="gap-3 pt-0">
          {rules.length === 0 ? (
            <p className="text-sm text-default-500">ยังไม่มี keyword</p>
          ) : (
            <Table aria-label="Keyword rules">
              <TableHeader>
                <TableColumn>Keyword</TableColumn>
                <TableColumn>ประเภท</TableColumn>
                <TableColumn>เปิดใช้</TableColumn>
                <TableColumn> </TableColumn>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => {
                  const flexSource = flexSourceLabel(rule.flexSource);

                  return (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <code>{rule.keyword}</code>
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat">
                          {responseTypeLabel(rule.responseType)}
                          {flexSource ? ` (${flexSource})` : ""}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Switch
                          aria-label={`เปิดใช้ ${rule.keyword}`}
                          isSelected={rule.isEnabled}
                          size="sm"
                          onValueChange={(v) => void toggleRule(rule, v)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="light"
                            onPress={() => {
                              setEditingRuleId(rule.id);
                              setFormOpen(true);
                            }}
                          >
                            แก้ไข
                          </Button>
                          <Button
                            color="danger"
                            size="sm"
                            variant="light"
                            onPress={() => void deleteRule(rule)}
                          >
                            ลบ
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button
          as={NextLink}
          className="text-white"
          color="warning"
          href={`/line-accounts/${lineAccountId}`}
          variant="solid"
        >
          กลับ
        </Button>
      </div>

      <KeywordRuleForm
        editingRuleId={editingRuleId}
        isOpen={formOpen}
        lineAccountId={lineAccountId}
        onOpenChange={setFormOpen}
        onSaved={handleRuleSaved}
      />
    </div>
  );
}
