import type { Role } from "@/app/generated/prisma/client";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { getPrisma } from "@/lib/db";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();

  if (!session?.user?.email) return null;
  const prisma = await getPrisma();

  return prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      memberships: {
        include: { organization: true },
      },
    },
  });
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) throw new Error("Unauthorized");

  return user;
}

export async function getMembership(organizationId: string) {
  const user = await getCurrentUser();

  if (!user) return null;
  const prisma = await getPrisma();

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
  const membership = await getMembership(organizationId);

  if (!membership)
    throw new Error("Forbidden: not a member of this organization");
  if (!allowedRoles.includes(membership.role))
    throw new Error("Forbidden: insufficient role");

  return { user, membership };
}
