import NextLink from "next/link";
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";

import { getPrisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export default async function RichMenusPage({
  searchParams,
}: {
  searchParams: Promise<{ lineAccountId?: string }>;
}) {
  const { lineAccountId } = await searchParams;
  const user = await getCurrentUser();

  if (!user) return null;
  const prisma = await getPrisma();
  const richMenus = await prisma.richMenu.findMany({
    where: {
      lineAccount: {
        organization: { memberships: { some: { userId: user.id } } },
      },
      ...(lineAccountId ? { lineAccountId } : {}),
    },
    include: {
      lineAccount: { include: { organization: true } },
      _count: { select: { areas: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rich Menus</h1>
        <Button as={NextLink} color="primary" href="/import">
          Import / สร้างใหม่
        </Button>
      </div>
      {richMenus.length === 0 ? (
        <Card>
          <CardBody className="text-center text-default-500 py-12">
            ยังไม่มี Rich Menu — Import จาก LINE Bot Designer
            หรือสร้างใหม่จากปุ่มด้านบน
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {richMenus.map((rm) => (
            <Link key={rm.id} as={NextLink} href={`/rich-menus/${rm.id}/edit`}>
              <Card className="h-full transition-opacity hover:opacity-90">
                <CardBody>
                  <p className="font-medium">{rm.name}</p>
                  <p className="text-sm text-default-500">
                    {rm.lineAccount.name} · {rm.lineAccount.organization.name}
                  </p>
                  <p className="text-xs text-default-400">
                    {rm.width}×{rm.height} · areas: {rm._count.areas} ·{" "}
                    {rm.status}
                  </p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
