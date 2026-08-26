import { notFound } from "next/navigation";
import NextLink from "next/link";
import { Button } from "@heroui/button";

import { LineAccountWebhookCopy } from "./LineAccountWebhookCopy";
import { LineRichMenusOnLine } from "./LineRichMenusOnLine";

import { RichMenusTable } from "@/app/(app)/rich-menus/RichMenusTable";
import { lineAccountByIdWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { lineAccountNameSelect } from "@/lib/line-account-select";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";

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
    select: {
      id: true,
      name: true,
      channelId: true,
      assignments: {
        include: {
          user: {
            select: { id: true, name: true, email: true, ldapUsername: true },
          },
        },
      },
      richMenus: {
        include: {
          lineAccount: { select: lineAccountNameSelect },
          _count: { select: { areas: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
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
              href={`/import?lineAccountId=${account.id}`}
            >
              นำเข้า Rich Menu
            </Button>
            <LineAccountWebhookCopy
              channelId={account.channelId}
              webhookUrl={webhookUrlForChannel(account.channelId)}
            />
          </div>
        }
        description={`ผู้ได้รับสิทธิ์ ${account.assignments.length} คน`}
        title={account.name}
      />
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Rich Menus ({account.richMenus.length})
        </h2>
        <RichMenusTable richMenus={account.richMenus} />
      </div>
      <LineRichMenusOnLine
        lineAccountId={account.id}
        systemAdmin={user.isSystemAdmin}
      />
    </div>
  );
}
