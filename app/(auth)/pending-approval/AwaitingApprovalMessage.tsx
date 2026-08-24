"use client";

import { signOut } from "next-auth/react";
import { Button } from "@heroui/button";

import { AuthCard } from "@/components/layouts/AuthCard";

export function AwaitingApprovalMessage() {
  return (
    <AuthCard
      header={
        <>
          <h2 className="text-2xl font-semibold">รอการอนุมัติ</h2>
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
