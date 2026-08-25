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
import { Avatar } from "@heroui/avatar";
import { useSession, signOut } from "next-auth/react";
import NextLink from "next/link";

import { Logo } from "@/components/icons";
import { siteConfig } from "@/config/site";

interface NavbarProps {
  onMenuOpen?: () => void;
}

export const Navbar = ({ onMenuOpen }: NavbarProps) => {
  const { data: session, status } = useSession();

  const profileLabel =
    session?.user?.name ?? session?.user?.email ?? "บัญชีของฉัน";
  const department = session?.user?.department?.trim() || "—";
  const roleLabel = session?.user?.isSystemAdmin
    ? siteConfig.labels.roleAdmin
    : siteConfig.labels.roleUser;

  return (
    <HeroUINavbar
      className="w-full border-b border-default-200 bg-content1"
      maxWidth="full"
      position="sticky"
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        {onMenuOpen ? (
          <Button
            isIconOnly
            aria-label="เปิดเมนูนำทาง"
            className="min-h-[44px] min-w-[44px] md:hidden"
            color="default"
            variant="flat"
            onPress={onMenuOpen}
          >
            <svg
              aria-hidden
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M4 6h16M4 12h16M4 18h16"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </Button>
        ) : null}
        <NavbarBrand className="max-w-fit">
          <NextLink
            className="flex items-center gap-2 px-1 py-1"
            href="/dashboard"
          >
            <Logo size={32} />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-default-500">
                {siteConfig.hospitalName}
              </p>
              <p className="truncate text-sm font-semibold leading-tight">
                {siteConfig.name}
              </p>
            </div>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="basis-1/5 sm:basis-full" justify="end">
        {status === "loading" ? null : session?.user?.isApproved ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                aria-label={`เมนูโปรไฟล์: ${profileLabel}, ${department}, ${roleLabel}`}
                className="h-auto max-w-[260px] py-1.5 font-medium"
                color="default"
                size="sm"
                variant="light"
              >
                <span className="flex items-center gap-2 text-left text-default-700">
                  <Avatar
                    className="shrink-0"
                    name={profileLabel}
                    size="sm"
                    src={session?.user?.image ?? undefined}
                  />
                  <span className="hidden min-w-0 sm:block">
                    <span className="block truncate text-sm font-medium leading-tight">
                      {profileLabel}
                    </span>
                    <span className="mt-0.5 block truncate text-xs font-normal text-default-500">
                      {department} · {roleLabel}
                    </span>
                  </span>
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
                {siteConfig.labels.profile}
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
        ) : null}
      </NavbarContent>
    </HeroUINavbar>
  );
};
