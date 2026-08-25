import { Suspense } from "react";
import { redirect } from "next/navigation";

import { LoginForm } from "./LoginForm";

import { getCurrentUser } from "@/lib/auth";
import { getDefaultLoginCallbackUrl } from "@/lib/auth-redirect";
import { isLineLoginConfigured } from "@/lib/auth/providers/line.provider";
import { LoadingState } from "@/components/ui/LoadingState";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getDefaultLoginCallbackUrl());
  }

  return (
    <Suspense fallback={<LoadingState />}>
      <LoginForm lineLoginEnabled={isLineLoginConfigured()} />
    </Suspense>
  );
}
