"use client";

import NextLink from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Chip } from "@heroui/chip";
import { Link } from "@heroui/link";
import clsx from "clsx";
import { useSession } from "next-auth/react";

import { Logo } from "@/components/icons";
import { siteConfig } from "@/config/site";

type AppNavItem = {
  label: string;
  href: string;
  systemAdminOnly?: boolean;
};

const appNavItems: AppNavItem[] = [
  { label: siteConfig.labels.dashboard, href: "/dashboard" },
  { label: siteConfig.labels.lineAccounts, href: "/line-accounts" },
  { label: siteConfig.labels.richMenus, href: "/rich-menus" },
  {
    label: siteConfig.labels.deployLogs,
    href: "/deploy-logs",
    systemAdminOnly: true,
  },
  { label: siteConfig.labels.users, href: "/users", systemAdminOnly: true },
];

const isPathActive = (pathname: string, href: string): boolean =>
  pathname === href || pathname.startsWith(`${href}/`);

interface AppNavContentProps {
  onNavigate?: () => void;
  className?: string;
  showBrand?: boolean;
}

export function AppNavContent({
  onNavigate,
  className,
  showBrand = false,
}: AppNavContentProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const systemAdmin = session?.user?.isSystemAdmin === true;
  const visibleNavItems = appNavItems.filter(
    (item) => !item.systemAdminOnly || systemAdmin,
  );
  const [pendingUserCount, setPendingUserCount] = useState(0);

  useEffect(() => {
    if (!systemAdmin) {
      setPendingUserCount(0);

      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/users/pending-count");
        const json = (await res.json()) as {
          success?: boolean;
          data?: { count?: number };
        };

        if (
          !cancelled &&
          json.success &&
          typeof json.data?.count === "number"
        ) {
          setPendingUserCount(json.data.count);
        }
      } catch {
        if (!cancelled) setPendingUserCount(0);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [systemAdmin, pathname]);

  return (
    <div className={clsx("flex flex-col gap-1 flex-1", className)}>
      {showBrand ? (
        <div className="mb-4 flex items-center gap-2 border-b border-default-200 pb-4">
          <Logo size={32} />
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-default-500">
              {siteConfig.hospitalName}
            </p>
            <p className="truncate text-sm font-semibold">{siteConfig.name}</p>
          </div>
        </div>
      ) : null}
      <nav
        aria-label="แถบนำทางสำหรับการจัดการ Rich Menu"
        className="flex flex-col gap-1 flex-1"
      >
        <ul className="flex flex-col gap-1">
          {visibleNavItems.map((item) => {
            const isActive = isPathActive(pathname, item.href);
            const showPendingChip =
              item.href === "/users" && pendingUserCount > 0;

            return (
              <li key={item.href}>
                <Link
                  aria-current={isActive ? "page" : undefined}
                  as={NextLink}
                  className={clsx(
                    "w-full justify-start min-h-[44px] items-center rounded-lg px-3 py-2 text-sm",
                    isActive
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-default-600 hover:bg-default-100/80 hover:text-foreground",
                  )}
                  href={item.href}
                  onClick={onNavigate}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span>{item.label}</span>
                    {showPendingChip ? (
                      <Chip
                        aria-label={`ผู้ใช้รออนุมัติ ${pendingUserCount} คน`}
                        color="danger"
                        size="sm"
                        variant="flat"
                      >
                        {pendingUserCount.toLocaleString("th-TH")}
                      </Chip>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
