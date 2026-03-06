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

export function CreateOrganizationForm() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();
  const toast = useAppToast();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function deriveSlug(value: string) {
    setSlug(
      value
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, ""),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: slug || undefined }),
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
      setSlug("");
      setLoading(false);
      toast.success("สร้างองค์กรเรียบร้อยแล้ว");
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
        สร้างองค์กร
      </Button>
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        placement="center"
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>สร้างองค์กร</ModalHeader>
            <ModalBody>
              {error && (
                <p className="text-danger text-sm" role="alert">
                  {error}
                </p>
              )}
              <Input
                isRequired
                label="ชื่อองค์กร"
                placeholder="เช่น ทีมการตลาด"
                value={name}
                onValueChange={(v) => {
                  setName(v);
                  deriveSlug(v);
                }}
              />
              <Input
                label="Slug (ใช้ใน URL)"
                placeholder="เช่น marketing-team"
                value={slug}
                onValueChange={setSlug}
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
                สร้าง
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}
