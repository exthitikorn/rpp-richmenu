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
  const [selectedOrgIds, setSelectedOrgIds] = useState<Set<string>>(
    () =>
      new Set(user.memberships.map((membership) => membership.organization.id)),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    setLoading(true);

    try {
      const organizationIds = Array.from(selectedOrgIds);
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationIds }),
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
              เลือกองค์กรที่ต้องการผูกกับผู้ใช้{" "}
              <span className="font-semibold">{user.email}</span>
            </p>
            <Select
              aria-label="เลือกองค์กรของผู้ใช้"
              className="mt-2"
              items={organizations}
              label="องค์กร"
              placeholder="เลือกหนึ่งหรือหลายองค์กร"
              selectedKeys={selectedOrgIds}
              selectionMode="multiple"
              onSelectionChange={(keys) => {
                if (keys === "all") {
                  setSelectedOrgIds(
                    new Set(organizations.map((org) => org.id)),
                  );

                  return;
                }

                const next = new Set<string>();

                (keys as Set<React.Key>).forEach((key) => {
                  next.add(String(key));
                });
                setSelectedOrgIds(next);
              }}
            >
              {(org) => <SelectItem key={org.id}>{org.name}</SelectItem>}
            </Select>
            <p className="text-default-500 text-xs">
              ถ้าไม่เลือกองค์กรใดเลย ผู้ใช้จะไม่ได้ผูกกับองค์กรใด
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
          <TableColumn className="text-center">องค์กร</TableColumn>
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
                  : user.memberships
                      .map((membership) => membership.organization.name)
                      .join(", ")}
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
