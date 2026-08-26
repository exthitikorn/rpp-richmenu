"use client";

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

import { useAppToast } from "@/components/AppToastProvider";

export function CreateLineAccountForm() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();
  const toast = useAppToast();
  const [name, setName] = useState("");
  const [channelId, setChannelId] = useState("");
  const [channelSecret, setChannelSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/line-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
      <Button color="primary" onPress={onOpen}>
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
              <p className="text-default-500 text-sm">
                ระบบจะตรวจสอบ Channel ID, Secret และ Access Token กับ LINE
                ก่อนบันทึก
              </p>
              <aside className="rounded-large border border-primary-100 bg-primary-50/60 p-4 text-sm text-default-700">
                <p className="font-semibold text-default-900">
                  วิธีหาค่าจาก LINE Developers
                </p>
                <p className="mt-1 text-default-600">
                  ใช้เฉพาะ{" "}
                  <span className="font-medium text-default-800">
                    Messaging API channel
                  </span>{" "}
                  ของ LINE Official Account — ไม่ใช้ Channel จาก LINE Login
                </p>
                <ol className="mt-3 space-y-2.5">
                  <li className="flex gap-2.5">
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground"
                    >
                      1
                    </span>
                    <span>
                      เปิด{" "}
                      <a
                        className="font-medium text-primary underline underline-offset-2"
                        href="https://developers.line.biz/console/"
                        rel="noreferrer"
                        target="_blank"
                      >
                        LINE Developers Console
                      </a>{" "}
                      → เลือก Provider → เลือก Messaging API channel ของ OA
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground"
                    >
                      2
                    </span>
                    <span>
                      <span className="font-medium text-default-800">
                        Channel ID
                      </span>{" "}
                      และ{" "}
                      <span className="font-medium text-default-800">
                        Channel Secret
                      </span>
                      : แท็บ <span className="font-medium">Basic settings</span>{" "}
                      → ส่วน Channel basic settings
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground"
                    >
                      3
                    </span>
                    <span>
                      <span className="font-medium text-default-800">
                        Channel Access Token
                      </span>
                      : แท็บ <span className="font-medium">Messaging API</span>{" "}
                      → Channel access token (รองรับ long-lived และ v2.1)
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground"
                    >
                      4
                    </span>
                    <span>
                      <span className="font-medium text-default-800">
                        ชื่อ (แสดงในระบบ)
                      </span>{" "}
                      ตั้งเองในแอปนี้ เช่น สาขา / แคมเปญ — ไม่ต้องตรงกับชื่อบน
                      LINE
                    </span>
                  </li>
                </ol>
              </aside>
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
