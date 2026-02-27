import { Suspense } from "react";
import { redirect } from "next/navigation";

import { LoginForm } from "./LoginForm";

import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <p className="text-default-500">กำลังโหลด...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
