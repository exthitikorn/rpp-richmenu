import { notFound } from "next/navigation";

import { KeywordRuleBuilder } from "../../builder/KeywordRuleBuilder";

import { lineAccountByIdWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/layouts/PageShell";

export default async function NewKeywordRulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) return null;

  const account = await prisma.lineAccount.findFirst({
    where: lineAccountByIdWhere(user, id),
    select: { id: true, name: true },
  });

  if (!account) notFound();

  return (
    <PageShell>
      <KeywordRuleBuilder
        accountName={account.name}
        lineAccountId={account.id}
        mode="create"
      />
    </PageShell>
  );
}
