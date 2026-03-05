"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Card, CardBody, CardHeader } from "@heroui/card";

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
  const [jsonText, setJsonText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedJson = jsonText.trim();

    if (!lineAccountId || !trimmedJson || !imageFile) {
      setError("กรุณาเลือก LINE Account, วาง JSON และอัปโหลดรูปภาพ");

      return;
    }
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();

      formData.set("lineAccountId", lineAccountId);
      const jsonBlob = new Blob([trimmedJson], { type: "application/json" });
      const jsonFile = new File([jsonBlob], "richmenu.json", {
        type: "application/json",
      });

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
    <Card className="w-full">
      <CardHeader className="flex flex-col items-start gap-1 pb-2">
        <h2 className="text-lg font-semibold">นำเข้า Rich Menu</h2>
        <p className="text-sm text-default-500">
          วาง JSON จาก LINE Bot Designer (richmenu.json)
          และอัปโหลดรูปภาพที่ขนาดตรงกับ size ใน JSON
        </p>
      </CardHeader>
      <CardBody className="pt-0">
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {error && (
            <div
              className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-danger text-sm dark:border-danger-800 dark:bg-danger-950/30"
              role="alert"
            >
              {error}
            </div>
          )}

          <section className="flex flex-col gap-4">
            <Select
              isRequired
              label="LINE Account"
              placeholder="เลือก account ที่จะนำ Rich Menu เข้า"
              selectedKeys={
                lineAccountId ? new Set([lineAccountId]) : new Set()
              }
              onSelectionChange={(keys) => {
                const k = Array.from(keys)[0];

                setLineAccountId(k != null ? String(k) : "");
              }}
            >
              {lineAccounts.map((la) => (
                <SelectItem
                  key={la.id}
                  textValue={`${la.name} (${la.organization.name})`}
                >
                  {la.name} ({la.organization.name})
                </SelectItem>
              ))}
            </Select>

            <div className="space-y-1.5">
              <Textarea
                isRequired
                aria-label="ข้อมูล Rich Menu (JSON)"
                classNames={{
                  input: "font-mono text-sm min-h-[360px]",
                  inputWrapper: "min-h-[380px] items-start",
                }}
                description="คัดลอกจาก LINE Bot Designer หรือไฟล์ richmenu.json"
                id="import-json-field"
                label="ข้อมูล Rich Menu (JSON)"
                minRows={20}
                placeholder='วางเนื้อหา richmenu.json ที่นี่ เช่น {"size": {"width": 2500, "height": ...}, ...}'
                value={jsonText}
                onValueChange={setJsonText}
              />
            </div>

            <div className="space-y-1">
              <Input
                isRequired
                accept="image/jpeg,image/png"
                description="JPEG หรือ PNG ขนาดต้องตรงกับ width/height ใน JSON"
                label="รูป Rich Menu"
                type="file"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
              {imageFile && (
                <p className="text-xs text-default-500">
                  เลือกแล้ว: {imageFile.name}
                </p>
              )}
            </div>
          </section>

          <div className="flex justify-end border-t border-default-200 pt-4">
            <Button color="primary" isLoading={loading} size="lg" type="submit">
              นำเข้า Rich Menu
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
