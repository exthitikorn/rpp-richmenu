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

export function CreateLineAccountForm({
  organizations,
}: {
  organizations: Organization[];
}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();
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
      setError("กรุณาเลือกองค์กร");

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
        setError(data.error ?? "สร้างไม่สำเร็จ");
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
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาด");
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
      <Modal isOpen={isOpen} size="2xl" onOpenChange={onOpenChange}>
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
                label="องค์กร"
                placeholder="เลือกองค์กร"
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
