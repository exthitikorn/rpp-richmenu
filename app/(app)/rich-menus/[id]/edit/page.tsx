import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { RichMenuEditor } from "@/components/rich-menu-editor/RichMenuEditor";

export default async function RichMenuEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) return null;
  const prisma = await getPrisma();
  const richMenu = await prisma.richMenu.findFirst({
    where: {
      id,
      lineAccount: {
        organization: { memberships: { some: { userId: user.id } } },
      },
    },
    include: { areas: { orderBy: { order: "asc" } }, lineAccount: true },
  });

  if (!richMenu) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        แก้ไข Rich Menu: {richMenu.name}
      </h1>
      <RichMenuEditor richMenu={richMenu} />
    </div>
  );
}
