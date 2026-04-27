"use client";

import type {
  Organization,
  LineAccount,
  RichMenu,
} from "@/app/generated/prisma/client";

import { useState } from "react";
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

type RichMenuWithRelations = RichMenu & {
  lineAccount: LineAccount & { organization: Organization };
  _count: { areas: number };
};

type ApiResponse = {
  success?: boolean;
  error?: string;
};

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

function RichMenuCardItem({ rm }: { rm: RichMenuWithRelations }) {
  return (
    <Card className="w-full shadow-sm">
      <CardBody className="gap-0 p-0">
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
            <dt className="text-default-500">หน่วยงาน</dt>
            <dd className="text-foreground">
              {rm.lineAccount.organization.name}
            </dd>
            <dt className="text-default-500">ขนาด</dt>
            <dd className="text-foreground">
              {rm.width}×{rm.height}
            </dd>
            <dt className="text-default-500">Areas</dt>
            <dd className="text-foreground">{rm._count.areas}</dd>
            <dt className="text-default-500">สถานะ</dt>
            <dd className="text-foreground">{rm.status}</dd>
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

export function RichMenusTable({
  richMenus,
}: {
  richMenus: RichMenuWithRelations[];
}) {
  if (richMenus.length === 0) {
    return (
      <Card className="w-full min-w-0 overflow-hidden">
        <CardBody className="text-center text-default-500 py-12">
          ยังไม่มี Rich Menu — Import จาก LINE Bot Designer
          หรือสร้างใหม่จากปุ่มด้านบน
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
          <RichMenuCardItem key={rm.id} rm={rm} />
        ))}
      </div>

      {/* Desktop: Table */}
      <Card className="hidden min-w-0 overflow-hidden md:block">
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
              <TableColumn className="text-center">ชื่อ</TableColumn>
              <TableColumn className="text-center">LINE Account</TableColumn>
              <TableColumn className="text-center">หน่วยงาน</TableColumn>
              <TableColumn className="text-center">ขนาด</TableColumn>
              <TableColumn className="text-center">Areas</TableColumn>
              <TableColumn className="text-center">สถานะ</TableColumn>
              <TableColumn className="text-center">จัดการ</TableColumn>
            </TableHeader>
            <TableBody>
              {richMenus.map((rm) => (
                <TableRow key={rm.id}>
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
                  <TableCell className="text-default-500 text-center">
                    {rm.lineAccount.organization.name}
                  </TableCell>
                  <TableCell className="text-default-400 text-center">
                    {rm.width}×{rm.height}
                  </TableCell>
                  <TableCell className="text-center">
                    {rm._count.areas}
                  </TableCell>
                  <TableCell className="text-center">{rm.status}</TableCell>
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
    </>
  );
}
