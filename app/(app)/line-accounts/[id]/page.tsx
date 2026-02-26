import { notFound } from "next/navigation";
import NextLink from "next/link";
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";

import { getPrisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export default async function LineAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) return null;
  const prisma = await getPrisma();
  const account = await prisma.lineAccount.findFirst({
    where: {
      id,
      organization: { memberships: { some: { userId: user.id } } },
    },
    include: {
      organization: true,
      richMenus: { orderBy: { updatedAt: "desc" } },
    },
  });

  if (!account) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{account.name}</h1>
          <p className="text-default-500">{account.organization.name}</p>
          <p className="text-xs text-default-400 font-mono">
            {account.channelId}
          </p>
        </div>
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
      </div>
      <Card>
        <CardHeader>Rich Menus ({account.richMenus.length})</CardHeader>
        <CardBody>
          {account.richMenus.length === 0 ? (
            <p className="text-default-500">ยังไม่มี Rich Menu</p>
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
