"use client";

import type {
  Organization,
  Membership,
  User,
} from "@/app/generated/prisma/client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import NextLink from "next/link";
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

type OrgWithRelations = Organization & {
  memberships: (Membership & { user: User })[];
  _count: { lineAccounts: number };
};

type ApiResponse = {
  success?: boolean;
  error?: string;
};

function EditOrganizationButton({ org }: { org: OrgWithRelations }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();
  const [name, setName] = useState(org.name);
  const [slug, setSlug] = useState(org.slug);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function deriveSlug(value: string) {
    setSlug(
      value
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, ""),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/organizations/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
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
            <ModalHeader>แก้ไของค์กร</ModalHeader>
            <ModalBody>
              {error && (
                <p className="text-danger text-sm" role="alert">
                  {error}
                </p>
              )}
              <Input
                isRequired
                label="ชื่อองค์กร"
                value={name}
                onValueChange={(v) => {
                  setName(v);
                  deriveSlug(v);
                }}
              />
              <Input
                isRequired
                label="Slug (ใช้ใน URL)"
                value={slug}
                onValueChange={setSlug}
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

function DeleteOrganizationButton({
  orgId,
  orgName,
}: {
  orgId: string;
  orgName: string;
}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/organizations/${orgId}`, {
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
          <ModalHeader>ลบองค์กร</ModalHeader>
          <ModalBody>
            {error && (
              <p className="text-danger text-sm" role="alert">
                {error}
              </p>
            )}
            <p>
              คุณต้องการลบองค์กร{" "}
              <span className="font-semibold">{orgName}</span> ใช่หรือไม่?
            </p>
            <p className="text-default-500 text-sm">
              การลบจะไม่สามารถย้อนกลับได้ และต้องไม่มี LINE Accounts
              อยู่ในองค์กรนี้
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

export function OrganizationList({
  organizations,
}: {
  organizations: OrgWithRelations[];
}) {
  if (organizations.length === 0) {
    return (
      <Card>
        <CardBody className="text-center text-default-500 py-12">
          ยังไม่มีองค์กร สร้างองค์กรแรกหรือเพิ่มจากปุ่มด้านบน
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
          aria-label="รายการองค์กร"
          classNames={{
            td: "align-middle",
          }}
        >
          <TableHeader>
            <TableColumn className="text-center">ชื่อองค์กร</TableColumn>
            <TableColumn className="text-center">Slug</TableColumn>
            <TableColumn className="text-center">LINE Accounts</TableColumn>
            <TableColumn className="text-center">สมาชิก</TableColumn>
            <TableColumn className="text-center">จัดการ</TableColumn>
          </TableHeader>
          <TableBody>
            {organizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell>
                  <Link
                    as={NextLink}
                    className="font-medium"
                    href={`/organizations/${org.id}`}
                  >
                    {org.name}
                  </Link>
                </TableCell>
                <TableCell className="text-default-500">{org.slug}</TableCell>
                <TableCell className="text-center">
                  {org._count.lineAccounts}
                </TableCell>
                <TableCell className="text-center">
                  {org.memberships.length}
                </TableCell>
                <TableCell className="text-center space-x-2">
                  <EditOrganizationButton org={org} />
                  <DeleteOrganizationButton orgId={org.id} orgName={org.name} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}
