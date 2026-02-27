"use client";

import type { LineAccount, Organization } from "@/app/generated/prisma/client";

import { useState } from "react";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";
import { Select, SelectItem } from "@heroui/select";
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

type LineAccountWithRelations = LineAccount & {
  organization: Organization;
  _count: { richMenus: number };
};

type ApiResponse = {
  success?: boolean;
  error?: string;
};

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

export function LineAccountList({
  lineAccounts,
  currentOrganizationId,
  organizations,
}: {
  lineAccounts: LineAccountWithRelations[];
  currentOrganizationId: string | null;
  organizations: Organization[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onOrganizationChange(keys: "all" | Set<React.Key>) {
    const id = keys === "all" ? "" : Array.from(keys)[0];
    const next = new URLSearchParams(searchParams);

    if (id && id !== "all") next.set("organizationId", String(id));
    else next.delete("organizationId");
    router.push(`/line-accounts?${next.toString()}`);
  }

  const selectedKey =
    currentOrganizationId &&
    organizations.some((o) => o.id === currentOrganizationId)
      ? currentOrganizationId
      : "all";

  if (lineAccounts.length === 0) {
    return (
      <div className="space-y-4">
        {organizations.length > 1 && (
          <Select
            className="max-w-xs"
            items={[
              { id: "all", name: "ทั้งหมด" },
              ...organizations.map((o) => ({ id: o.id, name: o.name })),
            ]}
            label="องค์กร"
            placeholder="ทั้งหมด"
            selectedKeys={selectedKey === "all" ? ["all"] : [selectedKey]}
            onSelectionChange={(keys) => {
              const k = keys as "all" | Set<React.Key>;

              if (k === "all" || k.size === 0) onOrganizationChange("all");
              else onOrganizationChange(k);
            }}
          >
            {(item) => <SelectItem key={item.id}>{item.name}</SelectItem>}
          </Select>
        )}
        <Card>
          <CardBody className="text-center text-default-500 py-12">
            ยังไม่มี LINE Account เพิ่มจากปุ่มด้านบน
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {organizations.length > 1 && (
        <Select
          className="max-w-xs"
          items={[
            { id: "all", name: "ทั้งหมด" },
            ...organizations.map((o) => ({ id: o.id, name: o.name })),
          ]}
          label="องค์กร"
          placeholder="ทั้งหมด"
          selectedKeys={selectedKey === "all" ? ["all"] : [selectedKey]}
          onSelectionChange={(keys) => {
            const k = keys as "all" | Set<React.Key>;

            if (k === "all" || k.size === 0) onOrganizationChange("all");
            else onOrganizationChange(k);
          }}
        >
          {(item) => <SelectItem key={item.id}>{item.name}</SelectItem>}
        </Select>
      )}
      <Card>
        <CardBody className="p-0">
          <Table
            fullWidth
            isStriped
            removeWrapper
            aria-label="รายการ LINE Accounts"
            classNames={{
              td: "align-middle",
            }}
          >
            <TableHeader>
              <TableColumn className="text-center">ชื่อ</TableColumn>
              <TableColumn className="text-center">องค์กร</TableColumn>
              <TableColumn className="text-center">Channel ID</TableColumn>
              <TableColumn className="text-center">Rich Menus</TableColumn>
              <TableColumn className="text-center">จัดการ</TableColumn>
            </TableHeader>
            <TableBody>
              {lineAccounts.map((la) => (
                <TableRow key={la.id}>
                  <TableCell>
                    <Link
                      as={NextLink}
                      className="font-medium"
                      href={`/line-accounts/${la.id}`}
                    >
                      {la.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-default-500">
                    {la.organization.name}
                  </TableCell>
                  <TableCell className="text-default-400 truncate text-center">
                    {la.channelId}
                  </TableCell>
                  <TableCell className="text-center">
                    {la._count.richMenus}
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
    </div>
  );
}
