import type { Role } from "@/app/generated/prisma/client";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();

  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        include: { organization: true },
      },
    },
  });

  if (!user?.isApproved) return null;

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) throw new Error("Unauthorized");

  return user;
}

export async function getMembership(organizationId: string) {
  const user = await getCurrentUser();

  if (!user) return null;

  return prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId: user.id, organizationId },
    },
    include: { organization: true },
  });
}

export async function requireRole(
  organizationId: string,
  allowedRoles: Role[],
): Promise<{
  user: Awaited<ReturnType<typeof getCurrentUser>>;
  membership: Awaited<ReturnType<typeof getMembership>>;
}> {
  const user = await getCurrentUser();

  if (!user) throw new Error("Unauthorized");
  const isAdmin = user.memberships.some(
    (membership) => membership.role === "ADMIN",
  );

  if (isAdmin) {
    const membership = await getMembership(organizationId);

    return { user, membership };
  }
  const membership = await getMembership(organizationId);

  if (!membership)
    throw new Error("Forbidden: not a member of this organization");
  if (!allowedRoles.includes(membership.role))
    throw new Error("Forbidden: insufficient role");

  return { user, membership };
}
