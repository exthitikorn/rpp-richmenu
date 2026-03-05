"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";

interface ProfileFormProps {
  initialName: string | null;
  email: string;
  lineConnected: boolean;
  lineDisplayName?: string | null;
}

export function ProfileForm({
  initialName,
  email,
  lineConnected,
  lineDisplayName,
}: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState<"profile" | "password" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  function handleConnectLine() {
    setError(null);
    setSuccessMessage(null);
    setLinking(true);

    // redirect ออกไปทำ LINE Login
    window.location.href = "/api/line/connect";
  }

  async function handleDisconnectLine() {
    setError(null);
    setSuccessMessage(null);

    const confirmed = window.confirm(
      "คุณต้องการยกเลิกการเชื่อมต่อบัญชี LINE หรือไม่?",
    );

    if (!confirmed) return;

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
      router.refresh();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "ยกเลิกการเชื่อมต่อ LINE ไม่สำเร็จ";

      setError(message);
    } finally {
      setUnlinking(false);
    }
  }

  async function handleSaveProfile() {
    setError(null);
    setSuccessMessage(null);

    try {
      setSaving("profile");
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
      setSaving(null);
    }
  }

  async function handleChangePassword() {
    setError(null);
    setSuccessMessage(null);

    if (!currentPassword || !newPassword) {
      setError("กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่");

      return;
    }

    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");

      return;
    }

    try {
      setSaving("password");
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      }

      setSuccessMessage("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "เปลี่ยนรหัสผ่านไม่สำเร็จ";

      setError(message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
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

      <Card as="section">
        <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">ข้อมูลโปรไฟล์</h2>
            <p className="text-sm text-default-500">
              แก้ไขชื่อที่ใช้แสดงในระบบ
            </p>
          </div>
          <Button
            color="primary"
            isLoading={saving === "profile"}
            size="sm"
            type="button"
            onPress={() => {
              void handleSaveProfile();
            }}
          >
            บันทึก
          </Button>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input isDisabled label="อีเมล" value={email} />
          <Input
            label="ชื่อ"
            placeholder="ชื่อที่ต้องการใช้แสดง"
            value={name}
            onValueChange={setName}
          />
        </CardBody>
      </Card>

      <Card as="section">
        <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">เปลี่ยนรหัสผ่าน</h2>
            <p className="text-sm text-default-500">
              ตั้งรหัสผ่านใหม่สำหรับการเข้าสู่ระบบ
            </p>
          </div>
          <Button
            color="primary"
            isLoading={saving === "password"}
            size="sm"
            type="button"
            onPress={() => {
              void handleChangePassword();
            }}
          >
            เปลี่ยนรหัสผ่าน
          </Button>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="รหัสผ่านปัจจุบัน"
            placeholder="กรอกรหัสผ่านปัจจุบัน"
            type="password"
            value={currentPassword}
            onValueChange={setCurrentPassword}
          />
          <Input
            label="รหัสผ่านใหม่"
            placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัว)"
            type="password"
            value={newPassword}
            onValueChange={setNewPassword}
          />
          <Input
            label="ยืนยันรหัสผ่านใหม่"
            placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
            type="password"
            value={confirmPassword}
            onValueChange={setConfirmPassword}
          />
        </CardBody>
      </Card>

      <Card as="section">
        <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">เชื่อมต่อบัญชี LINE</h2>
            <p className="text-sm text-default-500">
              เชื่อมบัญชี LINE ของคุณกับบัญชีในระบบ
              เพื่อให้ระบุตัวผู้ใช้จากกิจกรรมใน LINE ได้
            </p>
          </div>
          {lineConnected ? (
            <Button
              color="danger"
              isLoading={unlinking}
              size="sm"
              type="button"
              variant="flat"
              onPress={() => {
                void handleDisconnectLine();
              }}
            >
              ยกเลิกการเชื่อมต่อ
            </Button>
          ) : (
            <Button
              color="success"
              isLoading={linking}
              size="sm"
              type="button"
              onPress={handleConnectLine}
            >
              เชื่อมต่อ LINE
            </Button>
          )}
        </CardHeader>
        <CardBody className="space-y-2">
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
        </CardBody>
      </Card>
    </div>
  );
}
