"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import clsx from "clsx";

type AppNavItem = {
  label: string;
  href: string;
};

const appNavItems = [
  { label: "แดชบอร์ด", href: "/dashboard" },
  { label: "องค์กร", href: "/organizations" },
  { label: "บัญชี LINE", href: "/line-accounts" },
  { label: "Rich Menus", href: "/rich-menus" },
  { label: "นำเข้า", href: "/import" },
  { label: "บันทึกการ Deploy", href: "/deploy-logs" },
  { label: "จัดการผู้ใช้", href: "/users" },
] satisfies ReadonlyArray<AppNavItem>;

const isPathActive = (pathname: string, href: string): boolean =>
  pathname === href || pathname.startsWith(`${href}/`);

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-default-200 bg-default-50/50 p-4 flex flex-col min-h-0">
      <Link
        aria-label="กลับไปหน้า Dashboard"
        as={NextLink}
        className="mb-4 gap-2 font-semibold"
        href="/dashboard"
      >
        Rich Menu
      </Link>
      <nav
        aria-label="แถบนำทางสำหรับการจัดการ Rich Menu"
        className="flex flex-col gap-1 flex-1"
      >
        <ul className="flex flex-col gap-1">
          {appNavItems.map((item) => {
            const isActive = isPathActive(pathname, item.href);

            return (
              <li key={item.href}>
                <Link
                  aria-current={isActive ? "page" : undefined}
                  as={NextLink}
                  className={clsx(
                    "w-full justify-start",
                    isActive ? "text-primary font-medium" : "text-default-600",
                  )}
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <Button
        className="w-full justify-start"
        color="default"
        variant="flat"
        onPress={() => signOut({ callbackUrl: "/" })}
      >
        ออกจากระบบ
      </Button>
    </aside>
  );
}
