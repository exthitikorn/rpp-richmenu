import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { getDefaultLoginCallbackUrl } from "@/lib/auth-redirect";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getDefaultLoginCallbackUrl());
  }

  redirect("/login");
}
