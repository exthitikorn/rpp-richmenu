import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export { requireLineAccountAccess, requireSystemAdmin } from "@/lib/access";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();

  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      lineAccountAssignments: {
        include: { lineAccount: true },
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
