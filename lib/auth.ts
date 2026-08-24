import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export {
  requireOrgRole as requireRole,
  requireSystemAdmin,
} from "@/lib/access";

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
