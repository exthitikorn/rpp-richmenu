import { redirect } from "next/navigation";

import { RegisterLineForm } from "./register-line-form";
import { AwaitingApprovalMessage } from "./awaiting-approval-message";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function RegisterLinePage() {
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

  // เคยกรอก register-line แล้ว (มีรหัสผ่าน) แต่ยังไม่อนุมัติ → แสดงข้อความรออนุมัติ ไม่ต้องกรอกฟอร์มอีก
  const hasCompletedRegistration = Boolean(dbUser.passwordHash);

  if (hasCompletedRegistration) {
    return <AwaitingApprovalMessage />;
  }

  return <RegisterLineForm />;
}
