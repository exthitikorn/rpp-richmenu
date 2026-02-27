"use client";

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Image } from "@heroui/image";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import NextLink from "next/link";

import { siteConfig } from "@/config/site";
import { Logo } from "@/components/icons";

interface NavbarProps {
  siteName?: string;
  logoUrl?: string | null;
}

const isPathActive = (pathname: string, href: string): boolean => {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export const Navbar = ({ siteName, logoUrl }: NavbarProps) => {
  const displayName = siteName ?? siteConfig.name;
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const profileLabel =
    session?.user?.name ?? session?.user?.email ?? "บัญชีของฉัน";

  return (
    <HeroUINavbar
      className="w-full border-b border-default-200"
      maxWidth="full"
      position="sticky"
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            {logoUrl ? (
              <Image
                alt={displayName}
                className="h-8 w-auto rounded-md border border-default-200 bg-white object-contain"
                src={logoUrl}
              />
            ) : (
              <Logo />
            )}
            <p className="font-bold text-inherit truncate">{displayName}</p>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        {status === "loading" ? null : session?.user ? (
          <div className="flex items-center gap-3">
            <span className="max-w-[180px] truncate text-sm text-default-600">
              {profileLabel}
            </span>
            <Button
              className="font-medium"
              color="default"
              size="sm"
              variant="flat"
              onPress={() => signOut({ callbackUrl: "/" })}
            >
              ออกจากระบบ
            </Button>
          </div>
        ) : (
          <Link
            as={NextLink}
            className="font-medium"
            color="primary"
            href="/login"
          >
            เข้าสู่ระบบ
          </Link>
        )}
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {siteConfig.navMenuItems.map((item) => {
            const isActive = isPathActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                aria-current={isActive ? "page" : undefined}
                as={NextLink}
                className="data-[active=true]:text-primary data-[active=true]:font-medium"
                color="foreground"
                data-active={isActive ? "true" : undefined}
                href={item.href}
                size="lg"
              >
                {item.label}
              </Link>
            );
          })}
          {status === "loading" ? null : session?.user ? (
            <Button
              className="mt-2 justify-start"
              color="default"
              size="sm"
              variant="flat"
              onPress={() => signOut({ callbackUrl: "/" })}
            >
              ออกจากระบบ
            </Button>
          ) : (
            <Link
              as={NextLink}
              className="mt-2 font-medium"
              color="primary"
              href="/login"
              size="lg"
            >
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
