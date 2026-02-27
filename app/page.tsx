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
    <section className="flex flex-col items-center justify-center gap-6 py-12 md:py-20">
      <div className="text-center">
        <h1 className="text-3xl font-bold md:text-4xl">{siteConfig.name}</h1>
        <p className="mt-2 text-default-500">{siteConfig.description}</p>
      </div>
      <div className="flex gap-3">
        <Link
          as={NextLink}
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
          })}
          href="/login"
        >
          เข้าสู่ระบบ
        </Link>
        <Link
          as={NextLink}
          className={buttonStyles({ variant: "bordered", radius: "full" })}
          href="/register"
        >
          สมัครสมาชิก
        </Link>
      </div>
    </section>
  );
}
