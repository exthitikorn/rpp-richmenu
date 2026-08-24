"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";

import { useAppToast } from "@/components/AppToastProvider";

interface ProfileFormProps {
  initialName: string | null;
  ldapUsername: string | null;
  email: string | null;
  lineConnected: boolean;
  lineDisplayName?: string | null;
}

export function ProfileForm({
  initialName,
  ldapUsername,
  email,
  lineConnected,
  lineDisplayName,
}: ProfileFormProps) {
  const router = useRouter();
  const toast = useAppToast();
  const [name, setName] = useState(initialName ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [isConfirmDisconnectOpen, setIsConfirmDisconnectOpen] = useState(false);

  function handleConnectLine() {
    setError(null);
    setSuccessMessage(null);
    setLinking(true);

    window.location.href = "/api/line/connect";
  }

  async function handleDisconnectLine() {
    setError(null);
    setSuccessMessage(null);

    try {
      setUnlinking(true);
      const response = await fetch("/api/line/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "ยกเลิกการเชื่อมต่อ LINE ไม่สำเร็จ");
      }

      setSuccessMessage("ยกเลิกการเชื่อมต่อ LINE เรียบร้อยแล้ว");
      toast.success("ยกเลิกการเชื่อมต่อ LINE เรียบร้อยแล้ว");
      router.refresh();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "ยกเลิกการเชื่อมต่อ LINE ไม่สำเร็จ";

      setError(message);
      toast.error(message);
    } finally {
      setUnlinking(false);
      setIsConfirmDisconnectOpen(false);
    }
  }

  async function handleSaveProfile() {
    setError(null);
    setSuccessMessage(null);

    try {
      setSaving(true);
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "บันทึกโปรไฟล์ไม่สำเร็จ");
      }

      setSuccessMessage("บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว");
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "บันทึกโปรไฟล์ไม่สำเร็จ";

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full min-w-0 space-y-4">
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {successMessage && (
        <p className="text-sm text-success" role="status">
          {successMessage}
        </p>
      )}

      <Card as="section" className="w-full min-w-0 overflow-hidden">
        <CardHeader>
          <h2 className="text-lg font-semibold">ข้อมูลโปรไฟล์</h2>
          <p className="text-sm text-default-500">
            แก้ไขชื่อที่ใช้แสดงในระบบ (รหัสผ่านจัดการผ่านบัญชีโรงพยาบาล)
          </p>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input isDisabled label="ชื่อผู้ใช้" value={ldapUsername ?? "—"} />
          <Input isDisabled label="อีเมล" value={email ?? "—"} />
          <Input
            label="ชื่อ"
            placeholder="ชื่อที่ต้องการใช้แสดง"
            value={name}
            onValueChange={setName}
          />
          <div className="flex justify-end border-t border-default-200 pt-4">
            <Button
              color="primary"
              isLoading={saving}
              type="button"
              onPress={() => {
                void handleSaveProfile();
              }}
            >
              บันทึก
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card as="section" className="w-full min-w-0 overflow-hidden">
        <CardHeader>
          <h2 className="text-lg font-semibold">เชื่อมต่อบัญชี LINE</h2>
          <p className="text-sm text-default-500">
            เชื่อมบัญชี LINE ของคุณกับบัญชีในระบบ
            เพื่อให้ระบุตัวผู้ใช้จากกิจกรรมใน LINE ได้
          </p>
        </CardHeader>
        <CardBody className="space-y-4">
          {lineConnected ? (
            <p className="text-sm text-default-600">
              เชื่อมต่อกับ LINE แล้ว
              {lineDisplayName ? ` (${lineDisplayName})` : ""}
            </p>
          ) : (
            <p className="text-sm text-default-500">
              ยังไม่ได้เชื่อมต่อบัญชี LINE
            </p>
          )}
          <div className="flex justify-end border-t border-default-200 pt-4">
            {lineConnected ? (
              <Button
                color="danger"
                isLoading={unlinking}
                type="button"
                variant="flat"
                onPress={() => {
                  setIsConfirmDisconnectOpen(true);
                }}
              >
                ยกเลิกการเชื่อมต่อ
              </Button>
            ) : (
              <Button
                color="success"
                isLoading={linking}
                type="button"
                onPress={handleConnectLine}
              >
                เชื่อมต่อ LINE
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      <Modal
        backdrop="blur"
        isDismissable={!unlinking}
        isKeyboardDismissDisabled={unlinking}
        isOpen={isConfirmDisconnectOpen}
        onOpenChange={setIsConfirmDisconnectOpen}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                ยืนยันการยกเลิกการเชื่อมต่อ LINE
              </ModalHeader>
              <ModalBody>
                <p>
                  คุณต้องการยกเลิกการเชื่อมต่อบัญชี LINE
                  ของคุณออกจากระบบนี้หรือไม่?
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  onPress={() => {
                    if (!unlinking) {
                      onClose();
                    }
                  }}
                >
                  ยกเลิก
                </Button>
                <Button
                  color="danger"
                  isLoading={unlinking}
                  onPress={() => {
                    void handleDisconnectLine();
                  }}
                >
                  ยืนยันการยกเลิก
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
