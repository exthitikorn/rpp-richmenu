"use client";

import { useCallback, useEffect, useState } from "react";
import NextLink from "next/link";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Link } from "@heroui/link";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";

import { EmptyState } from "@/components/ui/EmptyState";
import { badgeToneForRemaining } from "@/lib/line/rich-menu-limit";

type LineRichMenuRow = {
  richMenuId: string;
  name: string;
  chatBarText: string;
  selected: boolean;
  size: { width: number; height: number };
  linkedRichMenuId?: string;
  linkedName?: string;
  linkedStatus?: "DRAFT" | "DEPLOYED";
  isDefault?: boolean;
};

type ListResponse = {
  count: number;
  max: number;
  remaining: number;
  richMenus: LineRichMenuRow[];
  error?: string;
};

export function LineRichMenusOnLine({
  lineAccountId,
  systemAdmin,
}: {
  lineAccountId: string;
  systemAdmin: boolean;
}) {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [target, setTarget] = useState<LineRichMenuRow | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/line-accounts/${lineAccountId}/line-rich-menus`,
      );
      const json = (await res.json()) as ListResponse;

      if (!res.ok) {
        setError(json.error ?? "ดึงข้อมูลจาก LINE ไม่สำเร็จ");
        setData(null);
        setLoading(false);

        return;
      }

      setData(json);
      setLoading(false);
    } catch {
      setError("เกิดข้อผิดพลาด");
      setData(null);
      setLoading(false);
    }
  }, [lineAccountId]);

  useEffect(() => {
    void load();
  }, [load]);

  function openDelete(menu: LineRichMenuRow) {
    setTarget(menu);
    setDeleteError("");
    onOpen();
  }

  async function handleDelete() {
    if (!target) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(
        `/api/line-accounts/${lineAccountId}/line-rich-menus/${encodeURIComponent(target.richMenuId)}`,
        { method: "DELETE" },
      );
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!res.ok || !json.success) {
        setDeleteError(json.error ?? "ลบไม่สำเร็จ");
        setDeleting(false);

        return;
      }

      setDeleting(false);
      onOpenChange();
      setTarget(null);
      await load();
    } catch {
      setDeleteError("เกิดข้อผิดพลาด");
      setDeleting(false);
    }
  }

  const tone = data
    ? badgeToneForRemaining(data.remaining, data.count)
    : "default";
  const chipColor =
    tone === "danger" ? "danger" : tone === "warning" ? "warning" : "default";

  return (
    <>
      <Card className="border border-default-200 shadow-none">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">Rich Menus บน LINE</span>
            {data ? (
              <Chip color={chipColor} size="sm" variant="flat">
                {data.count}/{data.max}
              </Chip>
            ) : null}
          </div>
          <Button
            isDisabled={loading}
            size="sm"
            variant="flat"
            onPress={() => void load()}
          >
            รีเฟรช
          </Button>
        </CardHeader>
        <CardBody className="gap-3">
          <p className="text-default-500 text-sm">
            นับเฉพาะ Rich Menu ที่สร้างผ่าน Messaging API (ไม่รวมที่สร้างจาก
            LINE Official Account Manager) — สูงสุด 1,000 ต่อ OA
          </p>

          {loading ? (
            <p className="text-default-500 text-sm">กำลังโหลดจาก LINE…</p>
          ) : null}

          {error ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-danger text-sm" role="alert">
                {error}
              </p>
              <Button size="sm" variant="flat" onPress={() => void load()}>
                ลองใหม่
              </Button>
            </div>
          ) : null}

          {!loading && !error && data && data.richMenus.length === 0 ? (
            <EmptyState title="ยังไม่มี Rich Menu บน LINE (0/1000)" />
          ) : null}

          {!loading && !error && data && data.richMenus.length > 0 ? (
            <div className="overflow-x-auto">
              <Table
                removeWrapper
                aria-label="Rich Menus บน LINE"
                classNames={{ base: "min-w-[640px]" }}
              >
                <TableHeader>
                  <TableColumn>ชื่อบน LINE</TableColumn>
                  <TableColumn>ขนาด</TableColumn>
                  <TableColumn>Chat bar</TableColumn>
                  <TableColumn>ในระบบ</TableColumn>
                  <TableColumn>{systemAdmin ? "จัดการ" : " "}</TableColumn>
                </TableHeader>
                <TableBody>
                  {data.richMenus.map((menu) => (
                    <TableRow key={menu.richMenuId}>
                      <TableCell>
                        <div className="font-medium">{menu.name}</div>
                        <div className="text-default-400 font-mono text-xs">
                          {menu.richMenuId}
                        </div>
                      </TableCell>
                      <TableCell>
                        {menu.size.width}×{menu.size.height}
                      </TableCell>
                      <TableCell>{menu.chatBarText || "—"}</TableCell>
                      <TableCell>
                        {menu.linkedRichMenuId ? (
                          <Link
                            as={NextLink}
                            href={`/rich-menus/${menu.linkedRichMenuId}/edit`}
                          >
                            {menu.linkedName ?? "ดูในระบบ"}
                            {menu.linkedStatus ? ` (${menu.linkedStatus})` : ""}
                          </Link>
                        ) : (
                          <span className="text-default-400 text-sm">
                            ไม่พบในระบบ
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {systemAdmin ? (
                          <Button
                            color="danger"
                            size="sm"
                            variant="light"
                            onPress={() => openDelete(menu)}
                          >
                            ลบ
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>ลบ Rich Menu บน LINE</ModalHeader>
          <ModalBody>
            {deleteError ? (
              <p className="text-danger text-sm" role="alert">
                {deleteError}
              </p>
            ) : null}
            {target ? (
              <>
                <p>
                  ลบ <span className="font-semibold">{target.name}</span> (
                  <span className="font-mono text-sm">{target.richMenuId}</span>
                  ) จาก LINE?
                </p>
                {target.linkedRichMenuId ? (
                  <p className="text-default-500 text-sm">
                    เมนูนี้ผูกกับรายการในระบบ — การลบจะยกเลิกการผูก
                    (สถานะกลับเป็น DRAFT) แต่จะไม่ลบ record ในระบบ
                  </p>
                ) : null}
              </>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="light"
              onPress={() => onOpenChange()}
            >
              ยกเลิก
            </Button>
            <Button
              color="danger"
              isLoading={deleting}
              onPress={() => void handleDelete()}
            >
              ลบ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
