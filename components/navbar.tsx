"use client";

import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
} from "@heroui/navbar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Avatar } from "@heroui/avatar";
import { useSession, signOut } from "next-auth/react";
import NextLink from "next/link";

import { siteConfig } from "@/config/site";
import { Logo } from "@/components/icons";

export const Navbar = () => {
  const displayName = siteConfig.name;
  const { data: session, status } = useSession();

  const profileLabel =
    session?.user?.name ?? session?.user?.email ?? "บัญชีของฉัน";

  return (
    <HeroUINavbar
      className="w-full border-b border-default-200"
      maxWidth="full"
      position="sticky"
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo />
            <p className="font-bold text-inherit truncate">{displayName}</p>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        {status === "loading" ? null : session?.user?.isApproved ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                className="max-w-[220px] font-medium"
                color="default"
                size="sm"
                variant="light"
                aria-label={`เมนูโปรไฟล์: ${profileLabel}`}
              >
                <span className="flex items-center gap-2 truncate text-sm text-default-700">
                  <Avatar
                    className="shrink-0"
                    name={profileLabel}
                    size="sm"
                    src={session?.user?.image ?? undefined}
                  />
                  <span className="truncate">{profileLabel}</span>
                </span>
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="เมนูโปรไฟล์" variant="flat">
              <DropdownItem
                key="profile"
                as={NextLink}
                className="text-default-700"
                href="/profile"
              >
                โปรไฟล์
              </DropdownItem>
              <DropdownItem
                key="logout"
                className="text-danger"
                color="danger"
                onPress={() => signOut({ callbackUrl: "/login" })}
              >
                ออกจากระบบ
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
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
        {status === "loading" ? null : session?.user?.isApproved ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                isIconOnly
                aria-label="เมนูโปรไฟล์"
                className="min-h-[44px] min-w-[44px]"
                color="default"
                variant="light"
              >
                <Avatar
                  className="h-8 w-8"
                  name={profileLabel}
                  size="sm"
                  src={session?.user?.image ?? undefined}
                />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="เมนูโปรไฟล์" variant="flat">
              <DropdownItem
                key="profile"
                as={NextLink}
                className="text-default-700"
                href="/profile"
              >
                โปรไฟล์
              </DropdownItem>
              <DropdownItem
                key="logout"
                className="text-danger"
                color="danger"
                onPress={() => signOut({ callbackUrl: "/login" })}
              >
                ออกจากระบบ
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
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
    </HeroUINavbar>
  );
};
