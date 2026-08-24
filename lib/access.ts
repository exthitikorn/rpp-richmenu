import type { Prisma } from "@/app/generated/prisma/client";
import type { Role } from "@/app/generated/prisma/client";

import { getCurrentUser } from "@/lib/auth";

type UserWithMemberships = NonNullable<
  Awaited<ReturnType<typeof getCurrentUser>>
>;

export function isSystemAdmin(
  user: Pick<UserWithMemberships, "isSystemAdmin">,
): boolean {
  return user.isSystemAdmin === true;
}

export function isOrgAdmin(
  user: Pick<UserWithMemberships, "memberships">,
  organizationId: string,
): boolean {
  return user.memberships.some(
    (membership) =>
      membership.organizationId === organizationId &&
      membership.role === "ADMIN",
  );
}

export function isOrgMember(
  user: Pick<UserWithMemberships, "memberships">,
  organizationId: string,
): boolean {
  return user.memberships.some(
    (membership) => membership.organizationId === organizationId,
  );
}

export function organizationWhere(
  user: UserWithMemberships,
): Prisma.OrganizationWhereInput {
  if (isSystemAdmin(user)) return {};

  return { memberships: { some: { userId: user.id } } };
}

export function lineAccountWhere(
  user: UserWithMemberships,
): Prisma.LineAccountWhereInput {
  if (isSystemAdmin(user)) return {};

  return {
    organization: { memberships: { some: { userId: user.id } } },
  };
}

export function richMenuWhere(
  user: UserWithMemberships,
): Prisma.RichMenuWhereInput {
  if (isSystemAdmin(user)) return {};

  return {
    lineAccount: {
      organization: { memberships: { some: { userId: user.id } } },
    },
  };
}

export function richMenuByIdWhere(
  user: UserWithMemberships,
  id: string,
): Prisma.RichMenuWhereInput {
  return { id, ...richMenuWhere(user) };
}

export function lineAccountByIdWhere(
  user: UserWithMemberships,
  id: string,
): Prisma.LineAccountWhereInput {
  return { id, ...lineAccountWhere(user) };
}

export function clickEventWhere(
  user: UserWithMemberships,
): Prisma.ClickEventWhereInput {
  if (isSystemAdmin(user)) return {};

  return {
    lineAccount: {
      organization: { memberships: { some: { userId: user.id } } },
    },
  };
}

export function deployLogWhere(
  user: UserWithMemberships,
): Prisma.DeployLogWhereInput {
  if (isSystemAdmin(user)) return {};

  return {
    richMenu: {
      lineAccount: {
        organization: { memberships: { some: { userId: user.id } } },
      },
    },
  };
}

export async function requireSystemAdmin(): Promise<UserWithMemberships> {
  const user = await getCurrentUser();

  if (!user) throw new Error("Unauthorized");
  if (!isSystemAdmin(user)) throw new Error("Forbidden: system admin required");

  return user;
}

export async function requireOrgRole(
  organizationId: string,
  allowedRoles: Role[],
): Promise<{
  user: UserWithMemberships;
  membership: UserWithMemberships["memberships"][number] | null;
}> {
  const user = await getCurrentUser();

  if (!user) throw new Error("Unauthorized");

  if (isSystemAdmin(user)) {
    const membership =
      user.memberships.find((item) => item.organizationId === organizationId) ??
      null;

    return { user, membership };
  }

  const membership = user.memberships.find(
    (item) => item.organizationId === organizationId,
  );

  if (!membership) {
    throw new Error("Forbidden: not a member of this organization");
  }

  if (!allowedRoles.includes(membership.role)) {
    throw new Error("Forbidden: insufficient role");
  }

  return { user, membership };
}
