import { notFound } from "next/navigation";

import { AutoResponseSettings } from "./AutoResponseSettings";

import { lineAccountByIdWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/layouts/PageShell";

function webhookUrlForChannel(channelId: string): string | null {
  const raw = process.env.NEXTAUTH_URL;

  if (!raw) return null;

  try {
    const origin = new URL(raw).origin;

    return `${origin}/api/webhook/line/${channelId}`;
  } catch {
    return null;
  }
}

export default async function AutoResponsePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) return null;

  const account = await prisma.lineAccount.findFirst({
    where: lineAccountByIdWhere(user, id),
    select: {
      id: true,
      name: true,
      channelId: true,
      autoResponseEnabled: true,
      fallbackMessage: true,
      keywordResponseRules: {
        orderBy: { keyword: "asc" },
        select: {
          id: true,
          keyword: true,
          isEnabled: true,
          responseType: true,
          flexSource: true,
        },
      },
    },
  });

  if (!account) notFound();

  return (
    <PageShell>
      <AutoResponseSettings
        channelId={account.channelId}
        initialRules={account.keywordResponseRules}
        initialSettings={{
          autoResponseEnabled: account.autoResponseEnabled,
          fallbackMessage: account.fallbackMessage,
        }}
        lineAccountId={account.id}
        webhookUrl={webhookUrlForChannel(account.channelId)}
      />
    </PageShell>
  );
}
