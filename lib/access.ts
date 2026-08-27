import type { Prisma } from "@/app/generated/prisma/client";

import { getCurrentUser } from "@/lib/auth";

type UserWithAssignments = NonNullable<
  Awaited<ReturnType<typeof getCurrentUser>>
>;

export function isSystemAdmin(
  user: Pick<UserWithAssignments, "isSystemAdmin">,
): boolean {
  return user.isSystemAdmin === true;
}

export function isAssignedToLineAccount(
  user: Pick<UserWithAssignments, "lineAccountAssignments">,
  lineAccountId: string,
): boolean {
  return user.lineAccountAssignments.some(
    (assignment) => assignment.lineAccountId === lineAccountId,
  );
}

export function lineAccountWhere(
  user: UserWithAssignments,
): Prisma.LineAccountWhereInput {
  if (isSystemAdmin(user)) return {};

  return {
    assignments: { some: { userId: user.id } },
  };
}

export function richMenuWhere(
  user: UserWithAssignments,
): Prisma.RichMenuWhereInput {
  if (isSystemAdmin(user)) return {};

  return {
    lineAccount: {
      assignments: { some: { userId: user.id } },
    },
  };
}

export function richMenuByIdWhere(
  user: UserWithAssignments,
  id: string,
): Prisma.RichMenuWhereInput {
  return { id, ...richMenuWhere(user) };
}

export function lineAccountByIdWhere(
  user: UserWithAssignments,
  id: string,
): Prisma.LineAccountWhereInput {
  return { id, ...lineAccountWhere(user) };
}

export function clickEventWhere(
  user: UserWithAssignments,
): Prisma.ClickEventWhereInput {
  if (isSystemAdmin(user)) return {};

  return {
    lineAccount: {
      assignments: { some: { userId: user.id } },
    },
  };
}

export function deployLogWhere(
  user: UserWithAssignments,
): Prisma.DeployLogWhereInput {
  if (isSystemAdmin(user)) return {};

  return {
    richMenu: {
      lineAccount: {
        assignments: { some: { userId: user.id } },
      },
    },
  };
}

export function keywordResponseRuleWhere(
  user: UserWithAssignments,
): Prisma.KeywordResponseRuleWhereInput {
  if (isSystemAdmin(user)) return {};

  return {
    lineAccount: {
      assignments: { some: { userId: user.id } },
    },
  };
}

export function keywordResponseRuleByIdWhere(
  user: UserWithAssignments,
  id: string,
): Prisma.KeywordResponseRuleWhereInput {
  return { id, ...keywordResponseRuleWhere(user) };
}

export function unmatchedMessageWhere(
  user: UserWithAssignments,
): Prisma.UnmatchedMessageWhereInput {
  if (isSystemAdmin(user)) return {};

  return {
    lineAccount: {
      assignments: { some: { userId: user.id } },
    },
  };
}

export async function requireSystemAdmin(): Promise<UserWithAssignments> {
  const user = await getCurrentUser();

  if (!user) throw new Error("Unauthorized");
  if (!isSystemAdmin(user)) throw new Error("Forbidden: system admin required");

  return user;
}

export async function requireLineAccountAccess(
  lineAccountId: string,
): Promise<UserWithAssignments> {
  const user = await getCurrentUser();

  if (!user) throw new Error("Unauthorized");
  if (isSystemAdmin(user)) return user;
  if (!isAssignedToLineAccount(user, lineAccountId)) {
    throw new Error("Forbidden: line account access required");
  }

  return user;
}
