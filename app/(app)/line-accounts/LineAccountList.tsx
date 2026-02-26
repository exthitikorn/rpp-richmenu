"use client";

import type { LineAccount, Organization } from "@/app/generated/prisma/client";

import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Link } from "@heroui/link";
import { Select, SelectItem } from "@heroui/select";

type LineAccountWithRelations = LineAccount & {
  organization: Organization;
  _count: { richMenus: number };
};

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
      <Card>
        <CardBody className="text-center text-default-500 py-12">
          ยังไม่มี LINE Account เพิ่มจากปุ่มด้านบน
        </CardBody>
      </Card>
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lineAccounts.map((la) => (
          <Link key={la.id} as={NextLink} href={`/line-accounts/${la.id}`}>
            <Card className="h-full transition-opacity hover:opacity-90">
              <CardBody>
                <p className="font-medium">{la.name}</p>
                <p className="text-sm text-default-500">
                  {la.organization.name}
                </p>
                <p className="text-xs text-default-400 truncate">
                  {la.channelId}
                </p>
                <p className="text-sm text-default-400 mt-1">
                  Rich Menus: {la._count.richMenus}
                </p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
