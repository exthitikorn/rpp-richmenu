import { Suspense } from "react";
import { redirect } from "next/navigation";

import { LoginForm } from "./LoginForm";

import { getCurrentUser } from "@/lib/auth";
import { getDefaultLoginCallbackUrl } from "@/lib/auth-redirect";
import { isLineLoginConfigured } from "@/lib/auth/providers/line.provider";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getDefaultLoginCallbackUrl());
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-default-500">กำลังโหลด...</p>
        </div>
      }
    >
      <LoginForm lineLoginEnabled={isLineLoginConfigured()} />
    </Suspense>
  );
}
