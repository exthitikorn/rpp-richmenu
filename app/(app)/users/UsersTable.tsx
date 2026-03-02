"use client";

import type {
  User,
  Membership,
  Organization,
} from "@/app/generated/prisma/client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
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
    { value: "OWNER", label: "Owner" },
    { value: "ADMIN", label: "Admin" },
    { value: "MEMBER", label: "Member" },
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

function DeleteUserButton({ id, email }: { id: string; email: string }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/users/${id}`, {
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
          <ModalHeader>ลบผู้ใช้</ModalHeader>
          <ModalBody>
            {error && (
              <p className="text-danger text-sm" role="alert">
                {error}
              </p>
            )}
            <p>
              คุณต้องการลบผู้ใช้ <span className="font-semibold">{email}</span>{" "}
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
          role: existingMembership?.role ?? "MEMBER",
        };
      });

      return initialState;
    },
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        setError(data.error ?? "บันทึกองค์กรไม่สำเร็จ");
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
      <Button
        isDisabled={organizations.length === 0}
        size="sm"
        variant="light"
        onPress={onOpen}
      >
        จัดการองค์กร
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>จัดการองค์กรของผู้ใช้</ModalHeader>
          <ModalBody>
            {error && (
              <p className="text-danger text-sm" role="alert">
                {error}
              </p>
            )}
            <p className="text-sm">
              กำหนดองค์กรและสิทธิ์ของผู้ใช้{" "}
              <span className="font-semibold">{user.email}</span>
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
                        aria-label={`กำหนดการเป็นสมาชิกในองค์กร ${org.name}`}
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
                        aria-label={`สิทธิ์ของผู้ใช้ในองค์กร ${org.name}`}
                        className="w-full"
                        isDisabled={!state.isMember}
                        items={MEMBERSHIP_ROLE_OPTIONS}
                        label="สิทธิ์"
                        labelPlacement="outside"
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
              ถ้าไม่ได้เปิดสวิตช์องค์กรใดเลย ผู้ใช้จะไม่ได้ผูกกับองค์กรใด
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
        setError(data.error ?? "อัปเดตสถานะไม่สำเร็จ");
        setUpdatingId(null);

        return;
      }

      setUpdatingId(null);
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาด");
      setUpdatingId(null);
    }
  }

  if (users.length === 0) {
    return (
      <p className="text-default-500 text-center py-8">ยังไม่มีผู้ใช้ในระบบ</p>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-danger text-sm" role="alert">
          {error}
        </p>
      )}
      <Table
        fullWidth
        isStriped
        removeWrapper
        aria-label="รายการผู้ใช้"
        classNames={{
          td: "align-middle",
        }}
      >
        <TableHeader>
          <TableColumn className="text-center">อีเมล</TableColumn>
          <TableColumn className="text-center">ชื่อ</TableColumn>
          <TableColumn className="text-center">องค์กร / สิทธิ์</TableColumn>
          <TableColumn className="text-center">อนุมัติ</TableColumn>
          <TableColumn className="text-center">จัดการ</TableColumn>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="text-center">{user.email}</TableCell>
              <TableCell className="text-center">{user.name ?? "—"}</TableCell>
              <TableCell className="text-center text-default-500 text-sm">
                {user.memberships.length === 0
                  ? "—"
                  : user.memberships.map(formatMembershipDisplay).join(", ")}
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
                <DeleteUserButton email={user.email} id={user.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
