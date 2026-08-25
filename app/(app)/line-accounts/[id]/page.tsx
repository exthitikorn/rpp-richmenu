import { notFound } from "next/navigation";
import NextLink from "next/link";
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";

import { lineAccountByIdWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function LineAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) return null;
  const account = await prisma.lineAccount.findFirst({
    where: lineAccountByIdWhere(user, id),
    include: {
      assignments: {
        include: {
          user: {
            select: { id: true, name: true, email: true, ldapUsername: true },
          },
        },
      },
      richMenus: { orderBy: { updatedAt: "desc" } },
    },
  });

  if (!account) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button
              as={NextLink}
              color="primary"
              href={`/rich-menus?lineAccountId=${account.id}`}
            >
              Rich Menus
            </Button>
            <Button
              as={NextLink}
              href={`/import?lineAccountId=${account.id}`}
              variant="bordered"
            >
              Import Rich Menu
            </Button>
          </div>
        }
        description={`ผู้ได้รับสิทธิ์ ${account.assignments.length} คน`}
        title={account.name}
      />
      <Card className="border border-default-200 shadow-none">
        <CardHeader>Rich Menus ({account.richMenus.length})</CardHeader>
        <CardBody>
          {account.richMenus.length === 0 ? (
            <EmptyState title="ยังไม่มี Rich Menu" />
          ) : (
            <ul className="divide-y divide-default-200">
              {account.richMenus.map((rm) => (
                <li
                  key={rm.id}
                  className="py-2 flex justify-between items-center"
                >
                  <Link as={NextLink} href={`/rich-menus/${rm.id}/edit`}>
                    {rm.name} — {rm.width}×{rm.height} ({rm.status})
                  </Link>
                  <Button
                    as={NextLink}
                    href={`/rich-menus/${rm.id}/edit`}
                    size="sm"
                    variant="flat"
                  >
                    แก้ไข
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
