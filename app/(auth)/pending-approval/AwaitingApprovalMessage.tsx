"use client";

import { signOut } from "next-auth/react";
import { Button } from "@heroui/button";

import { AuthCard } from "@/components/layouts/AuthCard";
import { AuthInfoPanel } from "@/components/layouts/AuthInfoPanel";

export function AwaitingApprovalMessage() {
  return (
    <AuthCard
      aside={<AuthInfoPanel />}
      header={
        <>
          <h2 className="text-xl font-semibold sm:text-2xl">รอการอนุมัติ</h2>
          <p className="text-center text-sm text-default-500" role="status">
            บัญชีของคุณถูกสร้างในระบบแล้ว
            กรุณารอผู้ดูแลระบบอนุมัติบัญชีก่อนจึงจะเข้าใช้งานได้
          </p>
        </>
      }
    >
      <Button
        className="min-h-[44px] w-full"
        color="primary"
        variant="flat"
        onPress={() => signOut({ callbackUrl: "/login" })}
      >
        กลับไปหน้าเข้าสู่ระบบ
      </Button>
    </AuthCard>
  );
}
