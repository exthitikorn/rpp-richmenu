import { redirect } from "next/navigation";

import { AwaitingApprovalMessage } from "./AwaitingApprovalMessage";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PendingApprovalPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!dbUser) {
    redirect("/login");
  }

  if (dbUser.isApproved) {
    redirect("/dashboard");
  }

  return <AwaitingApprovalMessage />;
}
