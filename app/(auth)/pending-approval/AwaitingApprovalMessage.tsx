"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";

import { AuthCard } from "@/components/layouts/AuthCard";
import { AuthInfoPanel } from "@/components/layouts/AuthInfoPanel";

export function AwaitingApprovalMessage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const redirecting = useRef(false);

  const isApproved = session?.user?.isApproved === true;

  useEffect(() => {
    if (status !== "authenticated" || isApproved) return;

    const id = setInterval(() => void update(), 15_000);

    return () => clearInterval(id);
  }, [status, isApproved, update]);

  useEffect(() => {
    if (status !== "authenticated" || !isApproved || redirecting.current) {
      return;
    }

    redirecting.current = true;
    void (async () => {
      // ponytail: middleware reads JWT cookie, not session — refresh token before redirect
      await update();
      router.replace("/dashboard");
    })();
  }, [status, isApproved, update, router]);

  return (
    <AuthCard
      aside={<AuthInfoPanel />}
      header={
        <>
          <h2 className="text-xl font-semibold sm:text-2xl">รอการอนุมัติ</h2>
          <p className="text-center text-sm text-default-500" role="status">
            {isApproved
              ? "ได้รับการอนุมัติแล้ว กำลังนำคุณเข้าสู่ระบบ..."
              : "บัญชีของคุณถูกสร้างในระบบแล้ว กรุณารอผู้ดูแลระบบอนุมัติบัญชีก่อนจึงจะเข้าใช้งานได้"}
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
