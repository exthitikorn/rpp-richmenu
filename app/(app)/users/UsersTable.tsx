"use client";

import type {
  LineAccount,
  LineAccountAssignment,
  User,
} from "@/app/generated/prisma/client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { Switch } from "@heroui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";

import { useAppToast } from "@/components/AppToastProvider";
import { EmptyState } from "@/components/ui/EmptyState";

type UserWithRelations = User & {
  lineAccountAssignments: (LineAccountAssignment & {
    lineAccount: Pick<LineAccount, "id" | "name">;
  })[];
};

type LineAccountOption = Pick<LineAccount, "id" | "name">;

type ApiResponse = {
  success?: boolean;
  error?: string;
};

function formatUserLabel(user: UserWithRelations) {
  return user.ldapUsername ?? user.email ?? user.name ?? "—";
}

function formatAssignments(user: UserWithRelations) {
  if (user.lineAccountAssignments.length === 0) {
    return "—";
  }

  return user.lineAccountAssignments
    .map((assignment) => assignment.lineAccount.name)
    .join(", ");
}

function DeleteUserButton({ id, label }: { id: string; label: string }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useAppToast();

  async function handleDelete() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = (await res.json()) as ApiResponse;

      if (!res.ok || !data.success) {
        const message = data.error ?? "ลบไม่สำเร็จ";

        setError(message);
        toast.error(message);
        setLoading(false);

        return;
      }

      setLoading(false);
      onOpenChange();
      toast.success("ลบผู้ใช้เรียบร้อยแล้ว");
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาด");
      toast.error("เกิดข้อผิดพลาด");
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
          <ModalHeader>ลบผู้ใช้</ModalHeader>
          <ModalBody>
            {error ? (
              <p className="text-danger text-sm" role="alert">
                {error}
              </p>
            ) : null}
            <p>
              คุณต้องการลบผู้ใช้ <span className="font-semibold">{label}</span>{" "}
              ใช่หรือไม่?
            </p>
            <p className="text-default-500 text-sm">
              การลบจะไม่สามารถย้อนกลับได้
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => onOpenChange()}>
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

function EditUserLineAccountsButton({
  user,
  lineAccounts,
}: {
  user: UserWithRelations;
  lineAccounts: LineAccountOption[];
}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();
  const toast = useAppToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () =>
      new Set(user.lineAccountAssignments.map((item) => item.lineAccount.id)),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredLineAccounts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return lineAccounts;
    }

    return lineAccounts.filter((lineAccount) =>
      lineAccount.name.toLowerCase().includes(query),
    );
  }, [lineAccounts, searchQuery]);

  function handleOpen() {
    setSelectedIds(
      new Set(user.lineAccountAssignments.map((item) => item.lineAccount.id)),
    );
    setSearchQuery("");
    setError("");
    onOpen();
  }

  function selectAllFiltered() {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      for (const lineAccount of filteredLineAccounts) {
        next.add(lineAccount.id);
      }

      return next;
    });
  }

  function clearAllFiltered() {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      for (const lineAccount of filteredLineAccounts) {
        next.delete(lineAccount.id);
      }

      return next;
    });
  }

  function toggleLineAccount(lineAccountId: string, value: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (value) {
        next.add(lineAccountId);
      } else {
        next.delete(lineAccountId);
      }

      return next;
    });
  }

  async function handleSave() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineAccountIds: Array.from(selectedIds) }),
      });
      const data = (await res.json()) as ApiResponse;

      if (!res.ok || !data.success) {
        const message = data.error ?? "บันทึกสิทธิ์ LineOA ไม่สำเร็จ";

        setError(message);
        toast.error(message);
        setLoading(false);

        return;
      }

      setLoading(false);
      onOpenChange();
      toast.success("อัปเดตสิทธิ์ LineOA ของผู้ใช้เรียบร้อยแล้ว");
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาด");
      toast.error("เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        isDisabled={lineAccounts.length === 0}
        size="sm"
        variant="light"
        onPress={handleOpen}
      >
        จัดการ LineOA
      </Button>
      <Modal isOpen={isOpen} size="lg" onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>กำหนดสิทธิ์ LineOA</ModalHeader>
          <ModalBody>
            {error ? (
              <p className="text-danger text-sm" role="alert">
                {error}
              </p>
            ) : null}
            <p className="text-sm">
              กำหนดบัญชี LINE OA ที่ผู้ใช้{" "}
              <span className="font-semibold">{formatUserLabel(user)}</span>{" "}
              สามารถเข้าถึงได้
            </p>
            <Input
              aria-label="ค้นหา LineOA"
              className="mt-3"
              placeholder="ค้นหาชื่อ LineOA"
              size="sm"
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <div className="mt-2 flex gap-2">
              <Button
                isDisabled={filteredLineAccounts.length === 0}
                size="sm"
                variant="flat"
                onPress={selectAllFiltered}
              >
                เลือกทั้งหมด
              </Button>
              <Button
                isDisabled={filteredLineAccounts.length === 0}
                size="sm"
                variant="light"
                onPress={clearAllFiltered}
              >
                ยกเลิกทั้งหมด
              </Button>
            </div>
            <div className="mt-2 max-h-80 overflow-auto">
              <Table removeWrapper aria-label="ตารางกำหนดสิทธิ์ LineOA">
                <TableHeader>
                  <TableColumn>ชื่อ LineOA</TableColumn>
                  <TableColumn className="w-24 text-center">สิทธิ์</TableColumn>
                </TableHeader>
                <TableBody emptyContent="ไม่พบ LineOA ที่ตรงกับการค้นหา">
                  {filteredLineAccounts.map((lineAccount) => (
                    <TableRow key={lineAccount.id}>
                      <TableCell>{lineAccount.name}</TableCell>
                      <TableCell className="text-center">
                        <Switch
                          aria-label={`กำหนดสิทธิ์เข้าถึง ${lineAccount.name}`}
                          isSelected={selectedIds.has(lineAccount.id)}
                          size="sm"
                          onValueChange={(value) =>
                            toggleLineAccount(lineAccount.id, value)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-default-500 text-xs">
              ถ้าไม่เลือก LineOA ใดเลย
              ผู้ใช้จะเข้าสู่ระบบได้แต่จะไม่มีบัญชีให้จัดการ
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => onOpenChange()}>
              ยกเลิก
            </Button>
            <Button color="primary" isLoading={loading} onPress={handleSave}>
              บันทึก
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

function SystemAdminSwitch({
  user,
  currentUserId,
  updatingId,
  onToggleSystemAdmin,
}: {
  user: UserWithRelations;
  currentUserId: string;
  updatingId: string | null;
  onToggleSystemAdmin: (user: UserWithRelations) => void;
}) {
  return (
    <Switch
      aria-label={
        user.isSystemAdmin ? "ถอดสิทธิ์ผู้ดูแลระบบ" : "ตั้งเป็นผู้ดูแลระบบ"
      }
      isDisabled={user.id === currentUserId || updatingId === user.id}
      isSelected={user.isSystemAdmin}
      size="sm"
      onValueChange={() => onToggleSystemAdmin(user)}
    />
  );
}

function UserCardItem({
  user,
  currentUserId,
  updatingId,
  onToggleApproved,
  onToggleSystemAdmin,
  lineAccounts,
}: {
  user: UserWithRelations;
  currentUserId: string;
  updatingId: string | null;
  onToggleApproved: (user: UserWithRelations) => void;
  onToggleSystemAdmin: (user: UserWithRelations) => void;
  lineAccounts: LineAccountOption[];
}) {
  return (
    <Card className="w-full shadow-sm" role="listitem">
      <CardBody className="gap-0 p-0">
        <div className="p-4 pb-3">
          <p className="text-sm font-semibold leading-tight">
            {formatUserLabel(user)}
          </p>
          <p className="mt-0.5 text-xs text-default-500">
            {user.name ?? user.ldapUsername ?? "—"}
          </p>
          <p className="mt-0.5 text-xs text-default-500">
            หน่วยงาน LDAP: {user.department ?? "—"}
          </p>
          <p className="mt-1 text-xs text-default-500 line-clamp-2">
            {formatAssignments(user)}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs text-default-500">ผู้ดูแลระบบ</span>
            <SystemAdminSwitch
              currentUserId={currentUserId}
              updatingId={updatingId}
              user={user}
              onToggleSystemAdmin={onToggleSystemAdmin}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-xs text-default-500">อนุมัติ</span>
            <Switch
              aria-label={
                user.isApproved
                  ? "ยกเลิกการอนุมัติผู้ใช้งาน"
                  : "อนุมัติผู้ใช้งาน"
              }
              isDisabled={user.id === currentUserId || updatingId === user.id}
              isSelected={user.isApproved}
              size="sm"
              onValueChange={() => onToggleApproved(user)}
            />
          </div>
        </div>
        <div className="border-t border-default-200 px-4 py-3 justify-center flex">
          <div className="flex flex-wrap items-center gap-2 [&_button]:whitespace-nowrap">
            <EditUserLineAccountsButton
              lineAccounts={lineAccounts}
              user={user}
            />
            <DeleteUserButton id={user.id} label={formatUserLabel(user)} />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export function UsersTable({
  users,
  currentUserId,
  lineAccounts,
}: {
  users: UserWithRelations[];
  currentUserId: string;
  lineAccounts: LineAccountOption[];
}) {
  const router = useRouter();
  const toast = useAppToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function toggleSystemAdmin(user: UserWithRelations) {
    setError("");
    setUpdatingId(user.id);

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSystemAdmin: !user.isSystemAdmin }),
      });
      const data = (await res.json()) as ApiResponse;

      if (!res.ok || !data.success) {
        const message = data.error ?? "อัปเดตสิทธิ์ไม่สำเร็จ";

        setError(message);
        toast.error(message);
        setUpdatingId(null);

        return;
      }

      setUpdatingId(null);
      toast.success("อัปเดตสิทธิ์ผู้ดูแลระบบเรียบร้อยแล้ว");
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาด");
      toast.error("เกิดข้อผิดพลาด");
      setUpdatingId(null);
    }
  }

  async function toggleApproved(user: UserWithRelations) {
    setError("");
    setUpdatingId(user.id);

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: !user.isApproved }),
      });
      const data = (await res.json()) as ApiResponse;

      if (!res.ok || !data.success) {
        const message = data.error ?? "อัปเดตสถานะไม่สำเร็จ";

        setError(message);
        toast.error(message);
        setUpdatingId(null);

        return;
      }

      setUpdatingId(null);
      toast.success("อัปเดตสถานะผู้ใช้เรียบร้อยแล้ว");
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาด");
      toast.error("เกิดข้อผิดพลาด");
      setUpdatingId(null);
    }
  }

  if (users.length === 0) {
    return <EmptyState title="ยังไม่มีผู้ใช้ในระบบ" />;
  }

  return (
    <div className="space-y-3 overflow-x-auto">
      {error ? (
        <p className="text-danger text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div
        aria-label="รายการผู้ใช้"
        className="flex flex-col gap-3 md:hidden"
        role="list"
      >
        {users.map((user) => (
          <UserCardItem
            key={user.id}
            currentUserId={currentUserId}
            lineAccounts={lineAccounts}
            updatingId={updatingId}
            user={user}
            onToggleApproved={toggleApproved}
            onToggleSystemAdmin={toggleSystemAdmin}
          />
        ))}
      </div>

      <div className="hidden md:block">
        <Table
          fullWidth
          isStriped
          removeWrapper
          aria-label="รายการผู้ใช้"
          classNames={{
            base: "min-w-[720px]",
            td: "align-middle",
          }}
        >
          <TableHeader>
            <TableColumn className="text-center">ชื่อผู้ใช้</TableColumn>
            <TableColumn className="text-center">ชื่อ</TableColumn>
            <TableColumn className="text-center">หน่วยงาน LDAP</TableColumn>
            <TableColumn className="text-center">
              LineOA ที่เข้าถึงได้
            </TableColumn>
            <TableColumn className="text-center">ผู้ดูแลระบบ</TableColumn>
            <TableColumn className="text-center">อนุมัติ</TableColumn>
            <TableColumn className="text-center">จัดการ</TableColumn>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="text-center">
                  {formatUserLabel(user)}
                </TableCell>
                <TableCell className="text-center">
                  {user.name ?? "—"}
                </TableCell>
                <TableCell className="text-center text-default-500">
                  {user.department ?? "—"}
                </TableCell>
                <TableCell className="text-center text-default-500 text-sm">
                  {formatAssignments(user)}
                </TableCell>
                <TableCell className="text-center">
                  <SystemAdminSwitch
                    currentUserId={currentUserId}
                    updatingId={updatingId}
                    user={user}
                    onToggleSystemAdmin={toggleSystemAdmin}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    aria-label={
                      user.isApproved
                        ? "ยกเลิกการอนุมัติผู้ใช้งาน"
                        : "อนุมัติผู้ใช้งาน"
                    }
                    isDisabled={
                      user.id === currentUserId || updatingId === user.id
                    }
                    isSelected={user.isApproved}
                    size="sm"
                    onValueChange={() => toggleApproved(user)}
                  />
                </TableCell>
                <TableCell className="text-center space-x-2">
                  <EditUserLineAccountsButton
                    lineAccounts={lineAccounts}
                    user={user}
                  />
                  <DeleteUserButton
                    id={user.id}
                    label={formatUserLabel(user)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
