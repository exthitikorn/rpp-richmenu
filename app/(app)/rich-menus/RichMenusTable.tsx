"use client";

import type { LineAccount, RichMenu } from "@/app/generated/prisma/client";

import { useState } from "react";
import Image from "next/image";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
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
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";

import { RichMenuStatusChip } from "@/components/rich-menu/RichMenuStatusChip";
import { EmptyState } from "@/components/ui/EmptyState";

type RichMenuWithRelations = RichMenu & {
  lineAccount: Pick<LineAccount, "id" | "name">;
  _count: { areas: number };
};

type ApiResponse = {
  success?: boolean;
  error?: string;
};

type ImagePreview = {
  name: string;
  imageUrl: string;
  width: number;
  height: number;
};

const TABLE_THUMB_W = 48;
const CARD_BANNER_MAX_H = 140;
const MODAL_MAX_W = 720;

function DeleteRichMenuButton({ id, name }: { id: string; name: string }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/rich-menus/${id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as ApiResponse;

      if (!res.ok || !data.success) {
        setError(data.error ?? "ลบไม่สำเร็จ");
        setLoading(false);

        return;
      }

      setLoading(false);
      onOpenChange();
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  return (
    <>
      <Button color="danger" size="sm" variant="light" onPress={onOpen}>
        ลบ
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>ลบ Rich Menu</ModalHeader>
          <ModalBody>
            {error && (
              <p className="text-danger text-sm" role="alert">
                {error}
              </p>
            )}
            <p>
              คุณต้องการลบ Rich Menu{" "}
              <span className="font-semibold">{name}</span> ใช่หรือไม่?
            </p>
            <p className="text-default-500 text-sm">
              การลบจะไม่สามารถย้อนกลับได้ และต้องไม่มี Areas, Deploy Logs หรือ
              Click Events ที่ผูกกับ Rich Menu นี้
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="light"
              onPress={() => onOpenChange()}
            >
              ยกเลิก
            </Button>
            <Button color="danger" isLoading={loading} onPress={handleDelete}>
              ลบ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

function RichMenuThumbButton({
  rm,
  variant,
  onPreview,
}: {
  rm: RichMenuWithRelations;
  variant: "table" | "card";
  onPreview: (preview: ImagePreview) => void;
}) {
  const openPreview = () =>
    onPreview({
      name: rm.name,
      imageUrl: rm.imageUrl,
      width: rm.width,
      height: rm.height,
    });

  if (variant === "card") {
    return (
      <button
        aria-label={`ดูรูป ${rm.name}`}
        className="relative block w-full overflow-hidden border-b border-default-200 bg-default-100"
        style={{ height: CARD_BANNER_MAX_H }}
        type="button"
        onClick={openPreview}
      >
        <Image
          fill
          alt=""
          className="object-contain"
          sizes="100vw"
          src={rm.imageUrl}
        />
      </button>
    );
  }

  const thumbH = Math.max(
    1,
    Math.round((TABLE_THUMB_W * rm.height) / Math.max(rm.width, 1)),
  );

  return (
    <button
      aria-label={`ดูรูป ${rm.name}`}
      className="inline-flex overflow-hidden rounded-md border border-default-200 bg-default-100"
      style={{ width: TABLE_THUMB_W, height: thumbH }}
      type="button"
      onClick={openPreview}
    >
      <Image
        alt=""
        className="object-contain"
        height={thumbH}
        src={rm.imageUrl}
        width={TABLE_THUMB_W}
      />
    </button>
  );
}

function RichMenuCardItem({
  rm,
  onPreview,
}: {
  rm: RichMenuWithRelations;
  onPreview: (preview: ImagePreview) => void;
}) {
  return (
    <Card className="w-full shadow-sm">
      <CardBody className="gap-0 p-0">
        <RichMenuThumbButton rm={rm} variant="card" onPreview={onPreview} />
        <div className="p-4 pb-3">
          <Link
            as={NextLink}
            className="text-base font-semibold text-foreground hover:opacity-80"
            href={`/rich-menus/${rm.id}/edit`}
          >
            {rm.name}
          </Link>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-default-500">LINE Account</dt>
            <dd className="text-foreground">{rm.lineAccount.name}</dd>
            <dt className="text-default-500">ขนาด</dt>
            <dd className="text-foreground">
              {rm.width}×{rm.height}
            </dd>
            <dt className="text-default-500">Areas</dt>
            <dd className="text-foreground">{rm._count.areas}</dd>
            <dt className="text-default-500">สถานะ</dt>
            <dd>
              <RichMenuStatusChip status={rm.status} />
            </dd>
          </dl>
        </div>
        <div className="border-t border-default-200 px-4 py-3 justify-center flex">
          <div className="flex flex-wrap items-center gap-2 [&_button]:min-w-[4.5rem] [&_button]:whitespace-nowrap">
            <Button
              as={NextLink}
              href={`/rich-menus/${rm.id}/edit`}
              size="sm"
              variant="light"
            >
              แก้ไข
            </Button>
            <DeleteRichMenuButton id={rm.id} name={rm.name} />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function ImagePreviewModal({
  preview,
  onClose,
}: {
  preview: ImagePreview | null;
  onClose: () => void;
}) {
  const scale =
    preview && preview.width > 0 ? Math.min(MODAL_MAX_W / preview.width, 1) : 1;
  const displayWidth = preview ? Math.round(preview.width * scale) : 0;
  const displayHeight = preview ? Math.round(preview.height * scale) : 0;

  return (
    <Modal
      isOpen={preview !== null}
      size="3xl"
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <ModalContent>
        {preview && (
          <>
            <ModalHeader>{preview.name}</ModalHeader>
            <ModalBody className="items-center">
              <div
                className="relative overflow-hidden rounded-lg border border-default-200 bg-default-100"
                style={{ width: displayWidth, height: displayHeight }}
              >
                <Image
                  alt={preview.name}
                  className="object-contain"
                  height={displayHeight}
                  src={preview.imageUrl}
                  width={displayWidth}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="flat" onPress={onClose}>
                ปิด
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export function RichMenusTable({
  richMenus,
}: {
  richMenus: RichMenuWithRelations[];
}) {
  const [preview, setPreview] = useState<ImagePreview | null>(null);

  if (richMenus.length === 0) {
    return (
      <Card className="w-full min-w-0 overflow-hidden border border-default-200 shadow-none">
        <CardBody>
          <EmptyState title="ยังไม่มี Rich Menu" />
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      {/* Mobile: Card list */}
      <div
        aria-label="รายการ Rich Menus"
        className="flex flex-col gap-3 md:hidden"
        role="list"
      >
        {richMenus.map((rm) => (
          <RichMenuCardItem key={rm.id} rm={rm} onPreview={setPreview} />
        ))}
      </div>

      {/* Desktop: Table */}
      <Card className="hidden min-w-0 overflow-hidden border border-default-200 shadow-none md:block">
        <CardBody className="p-0 overflow-x-auto">
          <Table
            fullWidth
            isStriped
            removeWrapper
            aria-label="รายการ Rich Menus"
            classNames={{
              base: "min-w-[640px]",
              td: "align-middle",
            }}
          >
            <TableHeader>
              <TableColumn className="w-16 text-center">รูป</TableColumn>
              <TableColumn className="text-center">ชื่อ</TableColumn>
              <TableColumn className="text-center">LINE Account</TableColumn>
              <TableColumn className="text-center">ขนาด</TableColumn>
              <TableColumn className="text-center">Areas</TableColumn>
              <TableColumn className="text-center">สถานะ</TableColumn>
              <TableColumn className="text-center">จัดการ</TableColumn>
            </TableHeader>
            <TableBody>
              {richMenus.map((rm) => (
                <TableRow key={rm.id}>
                  <TableCell className="text-center">
                    <RichMenuThumbButton
                      rm={rm}
                      variant="table"
                      onPreview={setPreview}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      as={NextLink}
                      className="font-medium"
                      href={`/rich-menus/${rm.id}/edit`}
                    >
                      {rm.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-default-500 text-center">
                    {rm.lineAccount.name}
                  </TableCell>
                  <TableCell className="text-default-400 text-center">
                    {rm.width}×{rm.height}
                  </TableCell>
                  <TableCell className="text-center">
                    {rm._count.areas}
                  </TableCell>
                  <TableCell className="text-center">
                    <RichMenuStatusChip status={rm.status} />
                  </TableCell>
                  <TableCell className="text-center space-x-2">
                    <Button
                      as={NextLink}
                      href={`/rich-menus/${rm.id}/edit`}
                      size="sm"
                      variant="light"
                    >
                      แก้ไข
                    </Button>
                    <DeleteRichMenuButton id={rm.id} name={rm.name} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <ImagePreviewModal preview={preview} onClose={() => setPreview(null)} />
    </>
  );
}
