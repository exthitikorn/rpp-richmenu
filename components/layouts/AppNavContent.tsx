"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Link } from "@heroui/link";
import clsx from "clsx";
import { useSession } from "next-auth/react";

type AppNavItem = {
  label: string;
  href: string;
};

const appNavItems: AppNavItem[] = [
  { label: "แดชบอร์ด", href: "/dashboard" },
  { label: "หน่วยงาน", href: "/organizations" },
  { label: "บัญชี LINE OA", href: "/line-accounts" },
  { label: "Rich Menus", href: "/rich-menus" },
  { label: "นำเข้า Rich Menu", href: "/import" },
  { label: "บันทึกการ Deploy", href: "/deploy-logs" },
  { label: "จัดการผู้ใช้", href: "/users" },
];

const isPathActive = (pathname: string, href: string): boolean =>
  pathname === href || pathname.startsWith(`${href}/`);

interface AppNavContentProps {
  /** เรียกเมื่อผู้ใช้เลือกเมนู (เช่น ปิด Drawer บนมือถือ) */
  onNavigate?: () => void;
  /** คลาสของ container */
  className?: string;
}

export function AppNavContent({ onNavigate, className }: AppNavContentProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin === true;
  const adminOnlyHrefs = ["/dashboard", "/deploy-logs", "/users"];
  const visibleNavItems = appNavItems.filter(
    (item) => isAdmin || !adminOnlyHrefs.includes(item.href),
  );

  return (
    <div className={clsx("flex flex-col gap-1 flex-1", className)}>
      <nav
        aria-label="แถบนำทางสำหรับการจัดการ Rich Menu"
        className="flex flex-col gap-1 flex-1"
      >
        <ul className="flex flex-col gap-1">
          {visibleNavItems.map((item) => {
            const isActive = isPathActive(pathname, item.href);

            return (
              <li key={item.href}>
                <Link
                  aria-current={isActive ? "page" : undefined}
                  as={NextLink}
                  className={clsx(
                    "w-full justify-start min-h-[44px] items-center",
                    isActive
                      ? "text-primary font-medium bg-sky-500/10 rounded-lg px-2 py-1"
                      : "text-default-600",
                  )}
                  href={item.href}
                  onClick={onNavigate}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
