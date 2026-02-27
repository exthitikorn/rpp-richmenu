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

export function RichMenusTable({
  richMenus,
}: {
  richMenus: RichMenuWithRelations[];
}) {
  if (richMenus.length === 0) {
    return (
      <Card>
        <CardBody className="text-center text-default-500 py-12">
          ยังไม่มี Rich Menu — Import จาก LINE Bot Designer
          หรือสร้างใหม่จากปุ่มด้านบน
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="p-0">
        <Table
          fullWidth
          isStriped
          removeWrapper
          aria-label="รายการ Rich Menus"
          classNames={{
            td: "align-middle",
          }}
        >
          <TableHeader>
            <TableColumn className="text-center">ชื่อ</TableColumn>
            <TableColumn className="text-center">LINE Account</TableColumn>
            <TableColumn className="text-center">องค์กร</TableColumn>
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
                <TableCell className="text-center">{rm._count.areas}</TableCell>
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
  );
}
