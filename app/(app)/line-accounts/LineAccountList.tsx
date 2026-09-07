"use client";

import type {
  LineAccount,
  LineAccountAssignment,
  User,
} from "@/app/generated/prisma/client";

import { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@heroui/avatar";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
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

import { EmptyState } from "@/components/ui/EmptyState";

type LineAccountPublic = Pick<
  LineAccount,
  "id" | "name" | "pictureUrl" | "channelId" | "createdAt" | "updatedAt"
>;

type LineAccountWithRelations = LineAccountPublic & {
  assignments: (LineAccountAssignment & {
    user: Pick<User, "id" | "name" | "email" | "ldapUsername">;
  })[];
  _count: { richMenus: number };
  richMenus: { id: string; name: string }[];
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

function DefaultRichMenuChip({ la }: { la: LineAccountWithRelations }) {
  const defaultMenu = la.richMenus[0];

  if (!defaultMenu) {
    return (
      <Chip color="default" size="sm" variant="flat">
        ยังไม่มี default
      </Chip>
    );
  }

  return (
    <Chip
      classNames={{ base: "max-w-full", content: "truncate" }}
      color="success"
      size="sm"
      title={defaultMenu.name}
      variant="flat"
    >
      {defaultMenu.name}
    </Chip>
  );
}

function EditLineAccountButton({ la }: { la: LineAccountWithRelations }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();
  const [channelSecret, setChannelSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleOpen() {
    setChannelSecret("");
    setAccessToken("");
    setError("");
    onOpen();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/line-accounts/${la.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelSecret: channelSecret.trim() || undefined,
          accessToken: accessToken.trim() || undefined,
        }),
      });
      const data = (await res.json()) as ApiResponse;

      if (!res.ok || !data.success) {
        setError(data.error ?? "แก้ไขไม่สำเร็จ");
        setLoading(false);

        return;
      }

      setLoading(false);
      setChannelSecret("");
      setAccessToken("");
      onOpenChange();
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="light" onPress={handleOpen}>
        แก้ไข
      </Button>
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        placement="center"
        size="2xl"
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          <form autoComplete="off" onSubmit={handleSubmit}>
            <ModalHeader>แก้ไข LINE Account</ModalHeader>
            <ModalBody>
              {error && (
                <p className="text-danger text-sm" role="alert">
                  {error}
                </p>
              )}
              <p className="text-sm text-default-600">
                ชื่อและรูปโปรไฟล์ดึงจาก LINE อัตโนมัติเมื่อเปิดหน้ารายละเอียด
              </p>
              <Input
                isReadOnly
                autoComplete="off"
                description="ไม่สามารถเปลี่ยนได้หลังสร้างแล้ว"
                label="Channel ID"
                labelPlacement="outside"
                name="line-channel-id"
                value={la.channelId}
              />
              <Input
                autoComplete="new-password"
                description="เว้นว่างหากไม่ต้องการเปลี่ยน — ระบบจะตรวจสอบกับ LINE ก่อนบันทึก"
                label="Channel Secret"
                labelPlacement="outside"
                name="line-channel-secret"
                placeholder="เว้นว่างหากไม่เปลี่ยน"
                type="password"
                value={channelSecret}
                onValueChange={setChannelSecret}
              />
              <Input
                autoComplete="new-password"
                description="เว้นว่างหากไม่ต้องการเปลี่ยน — ระบบจะตรวจสอบกับ LINE ก่อนบันทึก"
                label="Channel Access Token"
                labelPlacement="outside"
                name="line-channel-access-token"
                placeholder="เว้นว่างหากไม่เปลี่ยน"
                type="password"
                value={accessToken}
                onValueChange={setAccessToken}
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

function LineAccountNameCell({ la }: { la: LineAccountWithRelations }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar
        className="shrink-0"
        name={la.name}
        size="sm"
        src={la.pictureUrl ?? undefined}
      />
      <Link
        as={NextLink}
        className="min-w-0 truncate font-medium"
        href={`/line-accounts/${la.id}`}
      >
        {la.name}
      </Link>
    </div>
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
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              className="shrink-0"
              name={la.name}
              size="md"
              src={la.pictureUrl ?? undefined}
            />
            <Link
              as={NextLink}
              className="min-w-0 truncate text-base font-semibold text-foreground hover:opacity-80"
              href={`/line-accounts/${la.id}`}
            >
              {la.name}
            </Link>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-default-500">Default Rich Menu</dt>
            <dd>
              <DefaultRichMenuChip la={la} />
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
  hasRequestHint = false,
}: {
  lineAccounts: LineAccountWithRelations[];
  systemAdmin: boolean;
  hasRequestHint?: boolean;
}) {
  if (lineAccounts.length === 0) {
    return (
      <Card className="w-full min-w-0 overflow-hidden border border-default-200 shadow-none">
        <CardBody>
          <EmptyState
            description={
              systemAdmin
                ? "เพิ่มจากปุ่มด้านบน"
                : hasRequestHint
                  ? "กด ขอเพิ่มบัญชี เพื่อส่งคำขอให้ผู้ดูแลระบบอนุมัติ"
                  : undefined
            }
            title={
              systemAdmin
                ? "ยังไม่มี LINE Account"
                : "ยังไม่มี LINE Account ที่คุณได้รับสิทธิ์"
            }
          />
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
      {systemAdmin ? (
        <Card className="hidden min-w-0 overflow-hidden border border-default-200 shadow-none md:block">
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
                <TableColumn className="text-center">ชื่อ</TableColumn>
                <TableColumn className="text-center">
                  Default Rich Menu
                </TableColumn>
                <TableColumn className="text-center">Rich Menus</TableColumn>
                <TableColumn className="text-center">
                  ผู้ได้รับสิทธิ์
                </TableColumn>
                <TableColumn className="text-center">จัดการ</TableColumn>
              </TableHeader>
              <TableBody>
                {lineAccounts.map((la) => (
                  <TableRow key={la.id}>
                    <TableCell>
                      <LineAccountNameCell la={la} />
                    </TableCell>
                    <TableCell className="text-center">
                      <DefaultRichMenuChip la={la} />
                    </TableCell>
                    <TableCell className="text-center">
                      {la._count.richMenus}
                    </TableCell>
                    <TableCell className="text-center text-default-500 text-sm">
                      {formatAssignees(la)}
                    </TableCell>
                    <TableCell className="text-center space-x-2">
                      <EditLineAccountButton la={la} />
                      <DeleteLineAccountButton laId={la.id} laName={la.name} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      ) : (
        <Card className="hidden min-w-0 overflow-hidden border border-default-200 shadow-none md:block">
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
                <TableColumn className="text-center">ชื่อ</TableColumn>
                <TableColumn className="text-center">
                  Default Rich Menu
                </TableColumn>
                <TableColumn className="text-center">Rich Menus</TableColumn>
                <TableColumn className="text-center">
                  ผู้ได้รับสิทธิ์
                </TableColumn>
              </TableHeader>
              <TableBody>
                {lineAccounts.map((la) => (
                  <TableRow key={la.id}>
                    <TableCell>
                      <LineAccountNameCell la={la} />
                    </TableCell>
                    <TableCell className="text-center">
                      <DefaultRichMenuChip la={la} />
                    </TableCell>
                    <TableCell className="text-center">
                      {la._count.richMenus}
                    </TableCell>
                    <TableCell className="text-center text-default-500 text-sm">
                      {formatAssignees(la)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
