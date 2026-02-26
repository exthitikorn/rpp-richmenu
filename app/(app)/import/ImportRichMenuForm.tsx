"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Card, CardBody } from "@heroui/card";

type LineAccountWithOrg = {
  id: string;
  name: string;
  organization: { name: string };
};

export function ImportRichMenuForm({
  lineAccounts,
  defaultLineAccountId,
}: {
  lineAccounts: LineAccountWithOrg[];
  defaultLineAccountId: string | null;
}) {
  const router = useRouter();
  const [lineAccountId, setLineAccountId] = useState(
    defaultLineAccountId ?? "",
  );
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lineAccountId || !jsonFile || !imageFile) {
      setError("กรุณาเลือก LINE Account, ไฟล์ JSON และรูปภาพ");

      return;
    }
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();

      formData.set("lineAccountId", lineAccountId);
      formData.set("json", jsonFile);
      formData.set("image", imageFile);
      const res = await fetch("/api/rich-menus/import", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        richMenuId?: string;
      };

      if (!res.ok || !data.success) {
        setError(data.error ?? "Import ไม่สำเร็จ");
        setLoading(false);

        return;
      }
      if (data.richMenuId) {
        router.push(`/rich-menus/${data.richMenuId}/edit`);

        return;
      }
      setLoading(false);
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-xl">
      <CardBody>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {error && (
            <p className="text-danger text-sm" role="alert">
              {error}
            </p>
          )}
          <Select
            isRequired
            label="LINE Account"
            placeholder="เลือก account"
            selectedKeys={lineAccountId ? [lineAccountId] : []}
            onSelectionChange={(keys) => {
              const k = Array.from(keys)[0];

              setLineAccountId(k ? String(k) : "");
            }}
          >
            {lineAccounts.map((la) => (
              <SelectItem key={la.id}>
                {la.name} ({la.organization.name})
              </SelectItem>
            ))}
          </Select>
          <Input
            isRequired
            accept=".json,application/json"
            label="richmenu.json"
            type="file"
            onChange={(e) => setJsonFile(e.target.files?.[0] ?? null)}
          />
          <Input
            isRequired
            accept="image/jpeg,image/png"
            label="รูป Rich Menu"
            type="file"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
          <Button color="primary" isLoading={loading} type="submit">
            Import
          </Button>
        </form>
        <p className="text-sm text-default-500 mt-4">
          อัปโหลดไฟล์จาก LINE Bot Designer: richmenu.json และรูปภาพที่ขนาดตรงกับ
          size ใน JSON
        </p>
      </CardBody>
    </Card>
  );
}
