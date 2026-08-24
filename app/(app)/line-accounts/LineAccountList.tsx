"use client";

import type {
  LineAccount,
  LineAccountAssignment,
  User,
} from "@/app/generated/prisma/client";

import { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
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

type LineAccountWithRelations = LineAccount & {
  assignments: (LineAccountAssignment & {
    user: Pick<User, "id" | "name" | "email" | "ldapUsername">;
  })[];
  _count: { richMenus: number };
};

type ApiResponse = {
  success?: boolean;
  error?: string;
};

function formatAssignees(la: LineAccountWithRelations) {
  if (la.assignments.length === 0) {
    return "ยังไม่มีผู้ได้รับสิทธิ์";
  }

  return la.assignments
    .map((assignment) => {
      const user = assignment.user;

      return user.name ?? user.ldapUsername ?? user.email ?? "—";
    })
    .join(", ");
}

function EditLineAccountButton({ la }: { la: LineAccountWithRelations }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();
  const [name, setName] = useState(la.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/line-accounts/${la.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as ApiResponse;

      if (!res.ok || !data.success) {
        setError(data.error ?? "แก้ไขไม่สำเร็จ");
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
      <Button size="sm" variant="light" onPress={onOpen}>
        แก้ไข
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>แก้ไข LINE Account</ModalHeader>
            <ModalBody>
              {error && (
                <p className="text-danger text-sm" role="alert">
                  {error}
                </p>
              )}
              <Input
                isRequired
                label="ชื่อ (แสดงในระบบ)"
                value={name}
                onValueChange={setName}
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
                บันทึก
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}

function DeleteLineAccountButton({
  laId,
  laName,
}: {
  laId: string;
  laName: string;
}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/line-accounts/${laId}`, {
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
          <ModalHeader>ลบ LINE Account</ModalHeader>
          <ModalBody>
            {error && (
              <p className="text-danger text-sm" role="alert">
                {error}
              </p>
            )}
            <p>
              คุณต้องการลบ LINE Account{" "}
              <span className="font-semibold">{laName}</span> ใช่หรือไม่?
            </p>
            <p className="text-default-500 text-sm">
              การลบจะไม่สามารถย้อนกลับได้ และต้องไม่มี Rich Menus หรือ Click
              Events ที่ผูกกับบัญชีนี้
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

function LineAccountCardItem({
  la,
  systemAdmin,
}: {
  la: LineAccountWithRelations;
  systemAdmin: boolean;
}) {
  return (
    <Card className="w-full shadow-sm" role="listitem">
      <CardBody className="gap-0 p-0">
        <div className="p-4 pb-3">
          <Link
            as={NextLink}
            className="text-base font-semibold text-foreground hover:opacity-80"
            href={`/line-accounts/${la.id}`}
          >
            {la.name}
          </Link>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-default-500">Channel ID</dt>
            <dd
              className="truncate font-mono text-default-700"
              title={la.channelId}
            >
              {la.channelId}
            </dd>
            <dt className="text-default-500">Rich Menus</dt>
            <dd className="text-foreground">{la._count.richMenus}</dd>
            <dt className="text-default-500">ผู้ได้รับสิทธิ์</dt>
            <dd className="text-foreground">{la.assignments.length}</dd>
          </dl>
          <p className="mt-3 text-xs text-default-500 line-clamp-2">
            {formatAssignees(la)}
          </p>
        </div>
        {systemAdmin ? (
          <div className="border-t border-default-200 px-4 py-3 justify-center flex">
            <div className="flex flex-wrap items-center gap-2 [&_button]:min-w-[4.5rem] [&_button]:whitespace-nowrap">
              <EditLineAccountButton la={la} />
              <DeleteLineAccountButton laId={la.id} laName={la.name} />
            </div>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

export function LineAccountList({
  lineAccounts,
  systemAdmin,
}: {
  lineAccounts: LineAccountWithRelations[];
  systemAdmin: boolean;
}) {
  if (lineAccounts.length === 0) {
    return (
      <Card className="w-full min-w-0 overflow-hidden">
        <CardBody className="text-center text-default-500 py-12">
          {systemAdmin
            ? "ยังไม่มี LINE Account เพิ่มจากปุ่มด้านบน"
            : "ยังไม่มี LINE Account ที่คุณได้รับสิทธิ์"}
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-4">
      {/* Mobile: Card list */}
      <div
        aria-label="รายการ LINE Accounts"
        className="flex flex-col gap-3 md:hidden"
        role="list"
      >
        {lineAccounts.map((la) => (
          <LineAccountCardItem key={la.id} la={la} systemAdmin={systemAdmin} />
        ))}
      </div>

      {/* Desktop: Table */}
      <Card className="hidden min-w-0 overflow-hidden md:block">
        <CardBody className="p-0 overflow-x-auto">
          <Table
            fullWidth
            isStriped
            removeWrapper
            aria-label="รายการ LINE Accounts"
            classNames={{
              base: "min-w-[520px]",
              td: "align-middle",
            }}
          >
            <TableHeader>
              {systemAdmin ? (
                <>
                  <TableColumn className="text-center">ชื่อ</TableColumn>
                  <TableColumn className="text-center">Channel ID</TableColumn>
                  <TableColumn className="text-center">Rich Menus</TableColumn>
                  <TableColumn className="text-center">
                    ผู้ได้รับสิทธิ์
                  </TableColumn>
                  <TableColumn className="text-center">จัดการ</TableColumn>
                </>
              ) : (
                <>
                  <TableColumn className="text-center">ชื่อ</TableColumn>
                  <TableColumn className="text-center">Channel ID</TableColumn>
                  <TableColumn className="text-center">Rich Menus</TableColumn>
                  <TableColumn className="text-center">
                    ผู้ได้รับสิทธิ์
                  </TableColumn>
                </>
              )}
            </TableHeader>
            <TableBody>
              {lineAccounts.map((la) => (
                <TableRow key={la.id}>
                  {systemAdmin ? (
                    <>
                      <TableCell>
                        <Link
                          as={NextLink}
                          className="font-medium"
                          href={`/line-accounts/${la.id}`}
                        >
                          {la.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-default-400 truncate text-center">
                        {la.channelId}
                      </TableCell>
                      <TableCell className="text-center">
                        {la._count.richMenus}
                      </TableCell>
                      <TableCell className="text-center text-default-500 text-sm">
                        {formatAssignees(la)}
                      </TableCell>
                      <TableCell className="text-center space-x-2">
                        <EditLineAccountButton la={la} />
                        <DeleteLineAccountButton
                          laId={la.id}
                          laName={la.name}
                        />
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>
                        <Link
                          as={NextLink}
                          className="font-medium"
                          href={`/line-accounts/${la.id}`}
                        >
                          {la.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-default-400 truncate text-center">
                        {la.channelId}
                      </TableCell>
                      <TableCell className="text-center">
                        {la._count.richMenus}
                      </TableCell>
                      <TableCell className="text-center text-default-500 text-sm">
                        {formatAssignees(la)}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
