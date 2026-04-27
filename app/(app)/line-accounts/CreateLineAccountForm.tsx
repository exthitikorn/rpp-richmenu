"use client";

import type { Organization } from "@/app/generated/prisma/client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";

import { useAppToast } from "@/components/AppToastProvider";

export function CreateLineAccountForm({
  organizations,
}: {
  organizations: Organization[];
}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();
  const toast = useAppToast();
  const [organizationId, setOrganizationId] = useState("");
  const [name, setName] = useState("");
  const [channelId, setChannelId] = useState("");
  const [channelSecret, setChannelSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!organizationId) {
      setError("กรุณาเลือกหน่วยงาน");
      toast.error("กรุณาเลือกหน่วยงาน");

      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/line-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          name,
          channelId,
          channelSecret,
          accessToken,
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || !data.success) {
        const message = data.error ?? "สร้างไม่สำเร็จ";

        setError(message);
        toast.error(message);
        setLoading(false);

        return;
      }
      onOpenChange();
      setName("");
      setChannelId("");
      setChannelSecret("");
      setAccessToken("");
      setOrganizationId("");
      setLoading(false);
      toast.success("สร้าง LINE Account เรียบร้อยแล้ว");
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาด");
      toast.error("เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        color="primary"
        isDisabled={organizations.length === 0}
        onPress={onOpen}
      >
        เพิ่ม LINE Account
      </Button>
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        placement="center"
        size="2xl"
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>เพิ่ม LINE Official Account</ModalHeader>
            <ModalBody>
              {error && (
                <p className="text-danger text-sm" role="alert">
                  {error}
                </p>
              )}
              <Select
                isRequired
                label="หน่วยงาน"
                placeholder="เลือกหน่วยงาน"
                selectedKeys={organizationId ? [organizationId] : []}
                onSelectionChange={(keys) => {
                  const k = Array.from(keys)[0];

                  setOrganizationId(k ? String(k) : "");
                }}
              >
                {organizations.map((o) => (
                  <SelectItem key={o.id}>{o.name}</SelectItem>
                ))}
              </Select>
              <Input
                isRequired
                label="ชื่อ (แสดงในระบบ)"
                placeholder="เช่น LINE OA หลัก"
                value={name}
                onValueChange={setName}
              />
              <Input
                isRequired
                label="Channel ID"
                placeholder="จาก LINE Developers"
                value={channelId}
                onValueChange={setChannelId}
              />
              <Input
                isRequired
                label="Channel Secret"
                placeholder="จาก LINE Developers"
                type="password"
                value={channelSecret}
                onValueChange={setChannelSecret}
              />
              <Input
                isRequired
                label="Channel Access Token"
                placeholder="จาก LINE Developers"
                type="password"
                value={accessToken}
                onValueChange={setAccessToken}
              />
              <div className="rounded-medium border border-default-200 bg-default-50 p-3 text-sm text-default-700">
                <p className="font-medium text-default-900">
                  แหล่งที่มาข้อมูลสำหรับกรอกฟอร์ม
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  <li>
                    เข้าหน้า{" "}
                    <a
                      className="text-primary underline"
                      href="https://developers.line.biz/console/"
                      rel="noreferrer"
                      target="_blank"
                    >
                      LINE Developers Console
                    </a>{" "}
                    แล้วเลือก Provider และ Channel ของ OA ที่ต้องการ
                  </li>
                  <li>
                    `Channel ID` และ `Channel Secret` อยู่ที่หน้า{" "}
                    <span className="font-medium">
                      Basic settings &gt; Channel basic settings
                    </span>
                  </li>
                  <li>
                    `Channel Access Token` สร้าง/คัดลอกจากหน้า{" "}
                    <span className="font-medium">
                      Messaging API &gt; Channel access token
                    </span>
                  </li>
                  <li>
                    ชื่อ (แสดงในระบบ) เป็นชื่อที่ใช้แยกบัญชีในระบบนี้ เช่น
                    สาขา/แคมเปญ
                  </li>
                </ul>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                type="button"
                variant="light"
                onPress={() => onOpenChange()}
              >
                ยกเลิก
              </Button>
              <Button color="primary" isLoading={loading} type="submit">
                บันทึก
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}
