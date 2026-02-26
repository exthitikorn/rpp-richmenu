import { notFound } from "next/navigation";
import NextLink from "next/link";
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";

import { getPrisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) return null;
  const prisma = await getPrisma();
  const org = await prisma.organization.findFirst({
    where: {
      id,
      memberships: { some: { userId: user.id } },
    },
    include: {
      memberships: { include: { user: true } },
      lineAccounts: true,
    },
  });

  if (!org) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{org.name}</h1>
          <p className="text-default-500">{org.slug}</p>
        </div>
        <Button
          as={NextLink}
          color="primary"
          href={`/line-accounts?organizationId=${org.id}`}
        >
          เพิ่ม LINE Account
        </Button>
      </div>
      <Card>
        <CardHeader>สมาชิก</CardHeader>
        <CardBody>
          <ul className="divide-y divide-default-200">
            {org.memberships.map((m) => (
              <li key={m.id} className="py-2 flex justify-between">
                <span>{m.user.email}</span>
                <span className="text-default-500">{m.role}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>LINE Accounts</CardHeader>
        <CardBody>
          {org.lineAccounts.length === 0 ? (
            <p className="text-default-500">ยังไม่มี LINE Account</p>
          ) : (
            <ul className="divide-y divide-default-200">
              {org.lineAccounts.map((la) => (
                <li key={la.id} className="py-2">
                  <Link as={NextLink} href={`/line-accounts/${la.id}`}>
                    {la.name} ({la.channelId})
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
