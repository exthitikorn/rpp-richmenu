"use client";

import type {
  User,
  Membership,
  Organization,
} from "@/app/generated/prisma/client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
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
import { Switch } from "@heroui/switch";
import { Select, SelectItem } from "@heroui/select";

import { useAppToast } from "@/components/AppToastProvider";

type UserWithRelations = User & {
  memberships: (Membership & {
    organization: Pick<Organization, "id" | "name">;
  })[];
};

type OrganizationOption = Pick<Organization, "id" | "name">;

type MembershipFormState = Record<
  string,
  {
    isMember: boolean;
    role: Membership["role"];
  }
>;

const MEMBERSHIP_ROLE_OPTIONS: { value: Membership["role"]; label: string }[] =
  [
    { value: "ADMIN", label: "ผู้ดูแลหน่วยงาน" },
    { value: "USER", label: "ผู้ใช้งาน" },
  ];

function formatMembershipDisplay(
  membership: UserWithRelations["memberships"][number],
) {
  const found = MEMBERSHIP_ROLE_OPTIONS.find(
    (option) => option.value === membership.role,
  );

  if (!found) {
    return membership.organization.name;
  }

  return `${membership.organization.name} (${found.label})`;
}

type ApiResponse = {
  success?: boolean;
  error?: string;
};

function formatUserLabel(user: UserWithRelations) {
  return user.ldapUsername ?? user.email ?? user.name ?? "—";
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
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });
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
            {error && (
              <p className="text-danger text-sm" role="alert">
                {error}
              </p>
            )}
            <p>
              คุณต้องการลบผู้ใช้ <span className="font-semibold">{label}</span>{" "}
              ใช่หรือไม่?
            </p>
            <p className="text-default-500 text-sm">
              การลบจะไม่สามารถย้อนกลับได้
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

function EditUserOrganizationsButton({
  user,
  organizations,
}: {
  user: UserWithRelations;
  organizations: OrganizationOption[];
}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();
  const [membershipsState, setMembershipsState] = useState<MembershipFormState>(
    () => {
      const initialState: MembershipFormState = {};

      organizations.forEach((org) => {
        const existingMembership = user.memberships.find(
          (membership) => membership.organization.id === org.id,
        );

        initialState[org.id] = {
          isMember: Boolean(existingMembership),
          role: existingMembership?.role ?? "USER",
        };
      });

      return initialState;
    },
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useAppToast();

  async function handleSave() {
    setError("");
    setLoading(true);

    try {
      const memberships = organizations
        .filter((org) => membershipsState[org.id]?.isMember)
        .map((org) => ({
          organizationId: org.id,
          role: membershipsState[org.id].role,
        }));
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberships }),
      });
      const data = (await res.json()) as ApiResponse;

      if (!res.ok || !data.success) {
        const message = data.error ?? "บันทึกหน่วยงานไม่สำเร็จ";

        setError(message);
        toast.error(message);
        setLoading(false);

        return;
      }

      setLoading(false);
      onOpenChange();
      toast.success("บันทึกหน่วยงานของผู้ใช้เรียบร้อยแล้ว");
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
        isDisabled={organizations.length === 0}
        size="sm"
        variant="light"
        onPress={onOpen}
      >
        จัดการหน่วยงาน
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>จัดการหน่วยงานของผู้ใช้</ModalHeader>
          <ModalBody>
            {error && (
              <p className="text-danger text-sm" role="alert">
                {error}
              </p>
            )}
            <p className="text-sm">
              กำหนดหน่วยงานและสิทธิ์ของผู้ใช้{" "}
              <span className="font-semibold">{formatUserLabel(user)}</span>
            </p>
            <div className="mt-3 space-y-2">
              {organizations.map((org) => {
                const state = membershipsState[org.id];

                if (!state) {
                  return null;
                }

                return (
                  <div
                    key={org.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <Switch
                        aria-label={`กำหนดการเป็นสมาชิกในหน่วยงาน ${org.name}`}
                        isSelected={state.isMember}
                        size="sm"
                        onValueChange={(value) => {
                          setMembershipsState((prev) => ({
                            ...prev,
                            [org.id]: {
                              ...prev[org.id],
                              isMember: value,
                            },
                          }));
                        }}
                      >
                        {org.name}
                      </Switch>
                    </div>
                    <div className="w-40">
                      <Select
                        aria-label={`สิทธิ์ของผู้ใช้ในหน่วยงาน ${org.name}`}
                        className="w-full"
                        isDisabled={!state.isMember}
                        items={MEMBERSHIP_ROLE_OPTIONS}
                        label="สิทธิ์"
                        placeholder="เลือกสิทธิ์"
                        selectedKeys={new Set([state.role])}
                        size="sm"
                        onSelectionChange={(keys) => {
                          if (keys === "all") {
                            return;
                          }

                          const [first] = Array.from(keys as Set<string>);

                          setMembershipsState((prev) => ({
                            ...prev,
                            [org.id]: {
                              ...prev[org.id],
                              role: first as Membership["role"],
                            },
                          }));
                        }}
                      >
                        {(item) => (
                          <SelectItem key={item.value}>{item.label}</SelectItem>
                        )}
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-default-500 text-xs">
              ถ้าไม่ได้เปิดสวิตช์หน่วยงานใดเลย ผู้ใช้จะไม่ได้ผูกกับหน่วยงานใด
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
  organizations,
}: {
  user: UserWithRelations;
  currentUserId: string;
  updatingId: string | null;
  onToggleApproved: (user: UserWithRelations) => void;
  onToggleSystemAdmin: (user: UserWithRelations) => void;
  organizations: OrganizationOption[];
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
          <p className="mt-1 text-xs text-default-500 line-clamp-2">
            {user.memberships.length === 0
              ? "—"
              : user.memberships.map(formatMembershipDisplay).join(", ")}
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
            <EditUserOrganizationsButton
              organizations={organizations}
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
  organizations,
}: {
  users: UserWithRelations[];
  currentUserId: string;
  organizations: OrganizationOption[];
}) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const toast = useAppToast();

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
    return (
      <p className="text-default-500 text-center py-8">ยังไม่มีผู้ใช้ในระบบ</p>
    );
  }

  return (
    <div className="space-y-3 overflow-x-auto">
      {error && (
        <p className="text-danger text-sm" role="alert">
          {error}
        </p>
      )}

      {/* Mobile: Card list */}
      <div
        aria-label="รายการผู้ใช้"
        className="flex flex-col gap-3 md:hidden"
        role="list"
      >
        {users.map((user) => (
          <UserCardItem
            key={user.id}
            currentUserId={currentUserId}
            organizations={organizations}
            updatingId={updatingId}
            user={user}
            onToggleApproved={toggleApproved}
            onToggleSystemAdmin={toggleSystemAdmin}
          />
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block">
        <Table
          fullWidth
          isStriped
          removeWrapper
          aria-label="รายการผู้ใช้"
          classNames={{
            base: "min-w-[520px]",
            td: "align-middle",
          }}
        >
          <TableHeader>
            <TableColumn className="text-center">ชื่อผู้ใช้</TableColumn>
            <TableColumn className="text-center">ชื่อ</TableColumn>
            <TableColumn className="text-center">หน่วยงาน / สิทธิ์</TableColumn>
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
                <TableCell className="text-center text-default-500 text-sm">
                  {user.memberships.length === 0
                    ? "—"
                    : user.memberships.map(formatMembershipDisplay).join(", ")}
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
                  <EditUserOrganizationsButton
                    organizations={organizations}
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
