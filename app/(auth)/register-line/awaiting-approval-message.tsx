"use client";

import { signOut } from "next-auth/react";
import { Button } from "@heroui/button";

export function AwaitingApprovalMessage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div
        className="rounded-2xl bg-white shadow-lg border border-default-200"
        style={{ width: "520px", maxWidth: "100%" }}
      >
        <div className="flex flex-col gap-4 px-8 py-8">
          <h1 className="text-2xl font-semibold">รอการอนุมัติ</h1>
          <p className="text-default-500 text-sm" role="status">
            คุณได้ส่งข้อมูลการลงทะเบียนแล้ว
            กรุณารอผู้ดูแลระบบอนุมัติบัญชีก่อนจึงจะเข้าสู่ระบบและใช้งานได้
          </p>
          <Button
            color="primary"
            variant="flat"
            onPress={() => signOut({ callbackUrl: "/login" })}
          >
            กลับไปหน้าเข้าสู่ระบบ
          </Button>
        </div>
      </div>
    </div>
  );
}
