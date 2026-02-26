"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import clsx from "clsx";

const appNavItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Organizations", href: "/organizations" },
  { label: "LINE Accounts", href: "/line-accounts" },
  { label: "Rich Menus", href: "/rich-menus" },
  { label: "Import", href: "/import" },
  { label: "Deploy Logs", href: "/deploy-logs" },
  { label: "Analytics", href: "/analytics" },
  { label: "Settings", href: "/settings" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-default-200 bg-default-50/50 p-4 flex flex-col min-h-0">
      <Link
        as={NextLink}
        className="mb-4 gap-2 font-semibold"
        href="/dashboard"
      >
        Rich Menu
      </Link>
      <nav className="flex flex-col gap-1 flex-1">
        {appNavItems.map((item) => (
          <Link
            key={item.href}
            as={NextLink}
            className={clsx(
              "w-full justify-start",
              pathname === item.href || pathname.startsWith(item.href + "/")
                ? "text-primary font-medium"
                : "text-default-600",
            )}
            href={item.href}
          >
            {item.label}
          </Link>
        ))}
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
