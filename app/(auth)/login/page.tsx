import { Suspense } from "react";
import { redirect } from "next/navigation";

import { LoginForm } from "./LoginForm";

import { getSession } from "@/lib/auth";
import { getDefaultLoginCallbackUrl } from "@/lib/auth-redirect";
import { isLineLoginConfigured } from "@/lib/auth/providers/line.provider";
import { LoadingState } from "@/components/ui/LoadingState";

export default async function LoginPage() {
  const session = await getSession();

  if (session?.user?.id) {
    redirect(
      session.user.isApproved
        ? getDefaultLoginCallbackUrl()
        : "/pending-approval",
    );
  }

  return (
    <Suspense fallback={<LoadingState />}>
      <LoginForm lineLoginEnabled={isLineLoginConfigured()} />
    </Suspense>
  );
}
