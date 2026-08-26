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
import { Pagination } from "@heroui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";

import { RichMenuDefaultChip } from "@/components/rich-menu/RichMenuDefaultChip";
import { RichMenuStatusChip } from "@/components/rich-menu/RichMenuStatusChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { badgeToneForRemaining } from "@/lib/line/rich-menu-limit";

const PAGE_SIZE = 10;

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

/** HeroUI may pass `"all"` or a Set; with paged rows we keep a Set of ids across pages. */
type KeySelection = "all" | Set<string | number>;

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
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteProgress, setDeleteProgress] = useState("");
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
      setPage(1);
      setSelectedIds([]);
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

  const totalPages = data
    ? Math.max(1, Math.ceil(data.richMenus.length / PAGE_SIZE))
    : 1;
  const safePage = Math.min(page, totalPages);
  const pageItems = data
    ? data.richMenus.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
    : [];
  const pageIdSet = new Set(pageItems.map((m) => m.richMenuId));
  const selectedMenus =
    data?.richMenus.filter((m) => selectedIds.includes(m.richMenuId)) ?? [];
  const linkedSelectedCount = selectedMenus.filter(
    (m) => m.linkedRichMenuId,
  ).length;

  function handleSelectionChange(keys: KeySelection) {
    const next = new Set(selectedIds);
    const pageIds = Array.from(pageIdSet);

    if (keys === "all") {
      pageIds.forEach((id) => next.add(id));
    } else {
      const pageSelected = new Set(Array.from(keys).map(String));

      pageIds.forEach((id) => {
        if (pageSelected.has(id)) next.add(id);
        else next.delete(id);
      });
    }

    setSelectedIds(Array.from(next));
  }

  function openBulkDelete() {
    if (selectedIds.length === 0) return;
    setDeleteError("");
    setDeleteProgress("");
    onOpen();
  }

  async function handleDeleteSelected() {
    if (selectedIds.length === 0) return;
    setDeleting(true);
    setDeleteError("");
    setDeleteProgress("");

    const ids = [...selectedIds];
    let done = 0;

    try {
      for (const richMenuId of ids) {
        setDeleteProgress(`กำลังลบ ${done + 1}/${ids.length}…`);
        const res = await fetch(
          `/api/line-accounts/${lineAccountId}/line-rich-menus/${encodeURIComponent(richMenuId)}`,
          { method: "DELETE" },
        );
        const json = (await res.json()) as {
          success?: boolean;
          error?: string;
        };

        if (!res.ok || !json.success) {
          setDeleteError(
            json.error ?? `ลบไม่สำเร็จที่รายการที่ ${done + 1}/${ids.length}`,
          );
          setDeleting(false);
          await load();

          return;
        }

        done += 1;
      }

      setDeleting(false);
      onOpenChange();
      await load();
    } catch {
      setDeleteError("เกิดข้อผิดพลาด");
      setDeleting(false);
      await load();
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
        <CardHeader className="flex flex-wrap items-start justify-between gap-2 pb-2">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <Chip color="primary" size="sm" variant="flat">
                LINE API
              </Chip>
              <span className="text-lg font-semibold">Rich Menus บน LINE</span>
              {data ? (
                <Chip color={chipColor} size="sm" variant="flat">
                  {data.count}/{data.max}
                </Chip>
              ) : null}
            </div>
            <p className="text-default-500 text-sm font-normal">
              ดึงจาก LINE Messaging API แบบ real-time (ไม่รวมที่สร้างจาก LINE
              Official Account Manager) — สูงสุด 1,000 ต่อ OA
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {systemAdmin && selectedIds.length > 0 ? (
              <Button
                color="danger"
                size="sm"
                variant="flat"
                onPress={openBulkDelete}
              >
                ลบที่เลือก ({selectedIds.length})
              </Button>
            ) : null}
            <Button
              isDisabled={loading}
              size="sm"
              variant="flat"
              onPress={() => void load()}
            >
              รีเฟรช
            </Button>
          </div>
        </CardHeader>
        <CardBody className="gap-3 pt-0">
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
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <Table
                  removeWrapper
                  aria-label="Rich Menus บน LINE"
                  classNames={{ base: "min-w-[640px]" }}
                  selectedKeys={systemAdmin ? new Set(selectedIds) : new Set()}
                  selectionMode={systemAdmin ? "multiple" : "none"}
                  onSelectionChange={
                    systemAdmin
                      ? (keys) => handleSelectionChange(keys as KeySelection)
                      : undefined
                  }
                >
                  <TableHeader>
                    <TableColumn>ชื่อบน LINE</TableColumn>
                    <TableColumn>ขนาด</TableColumn>
                    <TableColumn>Chat bar</TableColumn>
                    <TableColumn>ในระบบ</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {pageItems.map((menu) => (
                      <TableRow key={menu.richMenuId}>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            <div>
                              <div className="font-medium">{menu.name}</div>
                              <div className="text-default-400 font-mono text-xs">
                                {menu.richMenuId}
                              </div>
                            </div>
                            {menu.selected ? <RichMenuDefaultChip /> : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          {menu.size.width}×{menu.size.height}
                        </TableCell>
                        <TableCell>{menu.chatBarText || "—"}</TableCell>
                        <TableCell>
                          {menu.linkedRichMenuId ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                as={NextLink}
                                href={`/rich-menus/${menu.linkedRichMenuId}/edit`}
                              >
                                {menu.linkedName ?? "ดูในระบบ"}
                              </Link>
                              {menu.linkedStatus ? (
                                <RichMenuStatusChip
                                  status={menu.linkedStatus}
                                />
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-default-400 text-sm">
                              ไม่พบในระบบ
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 ? (
                <div className="flex justify-center">
                  <Pagination
                    showControls
                    page={safePage}
                    size="sm"
                    total={totalPages}
                    onChange={setPage}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Modal
        isDismissable={!deleting}
        isKeyboardDismissDisabled={deleting}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          <ModalHeader>ลบ Rich Menu บน LINE</ModalHeader>
          <ModalBody>
            {deleteError ? (
              <p className="text-danger text-sm" role="alert">
                {deleteError}
              </p>
            ) : null}
            {deleteProgress ? (
              <p className="text-default-500 text-sm">{deleteProgress}</p>
            ) : null}
            <p>
              ลบ <span className="font-semibold">{selectedIds.length}</span>{" "}
              รายการที่เลือกจาก LINE?
            </p>
            {linkedSelectedCount > 0 ? (
              <p className="text-default-500 text-sm">
                มี {linkedSelectedCount} รายการที่ผูกกับระบบ —
                การลบจะยกเลิกการผูก (สถานะกลับเป็น DRAFT) แต่จะไม่ลบ record
                ในระบบ
              </p>
            ) : null}
            <p className="text-default-400 text-xs">
              LINE จำกัดการสร้าง/ลบประมาณ 100 ครั้ง/ชั่วโมง
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              isDisabled={deleting}
              type="button"
              variant="light"
              onPress={() => onOpenChange()}
            >
              ยกเลิก
            </Button>
            <Button
              color="danger"
              isLoading={deleting}
              onPress={() => void handleDeleteSelected()}
            >
              ลบที่เลือก
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
