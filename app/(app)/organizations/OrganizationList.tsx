"use client";

import type {
  Organization,
  Membership,
  User,
} from "@/app/generated/prisma/client";

import { Card, CardBody } from "@heroui/card";
import NextLink from "next/link";
import { Link } from "@heroui/link";

type OrgWithRelations = Organization & {
  memberships: (Membership & { user: User })[];
  _count: { lineAccounts: number };
};

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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {organizations.map((org) => (
        <Link key={org.id} as={NextLink} href={`/organizations/${org.id}`}>
          <Card className="h-full transition-opacity hover:opacity-90">
            <CardBody>
              <p className="font-medium">{org.name}</p>
              <p className="text-sm text-default-500">{org.slug}</p>
              <p className="text-sm text-default-400 mt-1">
                LINE Accounts: {org._count.lineAccounts} · สมาชิก:{" "}
                {org.memberships.length}
              </p>
            </CardBody>
          </Card>
        </Link>
      ))}
    </div>
  );
}
