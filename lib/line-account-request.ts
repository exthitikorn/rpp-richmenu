import type { Prisma } from "@/app/generated/prisma/client";

import { LineAccountRequestStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type Db = Pick<typeof prisma, "lineAccount" | "lineAccountRequest">;

export const lineAccountRequestPublicSelect = {
  id: true,
  name: true,
  channelId: true,
  status: true,
  rejectionReason: true,
  reviewedAt: true,
  lineAccountId: true,
  createdAt: true,
} satisfies Prisma.LineAccountRequestSelect;

export async function findDuplicateChannelIdError(
  channelId: string,
  excludeRequestId?: string,
  db: Db = prisma,
): Promise<string | null> {
  const existingAccount = await db.lineAccount.findUnique({
    where: { channelId },
    select: { id: true },
  });

  if (existingAccount) {
    return "Channel ID นี้มีในระบบแล้ว";
  }

  const pendingRequest = await db.lineAccountRequest.findFirst({
    where: {
      channelId,
      status: LineAccountRequestStatus.PENDING,
      ...(excludeRequestId ? { id: { not: excludeRequestId } } : {}),
    },
    select: { id: true },
  });

  if (pendingRequest) {
    return "มีคำขอรออนุมัติสำหรับ Channel ID นี้อยู่แล้ว";
  }

  return null;
}
