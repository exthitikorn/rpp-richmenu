import { ImportRichMenuForm } from "./ImportRichMenuForm";

import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ lineAccountId?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) return null;
  const prisma = await getPrisma();
  const lineAccounts = await prisma.lineAccount.findMany({
    where: {
      organization: { memberships: { some: { userId: user.id } } },
    },
    include: { organization: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Import Rich Menu</h1>
      <ImportRichMenuForm
        defaultLineAccountId={(await searchParams).lineAccountId ?? null}
        lineAccounts={lineAccounts}
      />
    </div>
  );
}
