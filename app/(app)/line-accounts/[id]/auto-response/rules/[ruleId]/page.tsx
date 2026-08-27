import { notFound } from "next/navigation";

import { KeywordRuleBuilder } from "../../builder/KeywordRuleBuilder";

import { lineAccountByIdWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/layouts/PageShell";

export default async function EditKeywordRulePage({
  params,
}: {
  params: Promise<{ id: string; ruleId: string }>;
}) {
  const { id, ruleId } = await params;
  const user = await getCurrentUser();

  if (!user) return null;

  const account = await prisma.lineAccount.findFirst({
    where: lineAccountByIdWhere(user, id),
    select: { id: true, name: true },
  });

  if (!account) notFound();

  const rule = await prisma.keywordResponseRule.findFirst({
    where: { id: ruleId, lineAccountId: account.id },
    select: {
      id: true,
      keyword: true,
      isEnabled: true,
      responseType: true,
      responsePayload: true,
    },
  });

  if (!rule) notFound();

  return (
    <PageShell>
      <KeywordRuleBuilder
        accountName={account.name}
        initialRule={rule}
        lineAccountId={account.id}
        mode="edit"
      />
    </PageShell>
  );
}
