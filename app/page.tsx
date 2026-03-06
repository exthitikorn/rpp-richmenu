import { Link } from "@heroui/link";
import { button as buttonStyles } from "@heroui/theme";
import { redirect } from "next/navigation";
import NextLink from "next/link";

import { siteConfig } from "@/config/site";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <section className="flex flex-col items-center justify-center gap-6 px-4 py-8 md:py-20 sm:py-12">
      <div className="text-center max-w-xl">
        <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">
          {siteConfig.name}
        </h1>
        <p className="mt-2 text-sm text-default-500 sm:text-base">
          {siteConfig.description}
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center">
        <Link
          as={NextLink}
          className={
            buttonStyles({
              color: "primary",
              radius: "full",
              variant: "shadow",
            }) + " min-h-[44px] w-full justify-center sm:w-auto"
          }
          href="/login"
        >
          เข้าสู่ระบบ
        </Link>
        <Link
          as={NextLink}
          className={
            buttonStyles({ variant: "bordered", radius: "full" }) +
            " min-h-[44px] w-full justify-center sm:w-auto"
          }
          href="/register"
        >
          สมัครสมาชิก
        </Link>
      </div>
    </section>
  );
}
