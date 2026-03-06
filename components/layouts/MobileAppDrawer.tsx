"use client";

import { useDisclosure } from "@heroui/modal";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
} from "@heroui/drawer";
import { Button } from "@heroui/button";

import { AppNavContent } from "./AppNavContent";

export function MobileAppDrawer() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <Button
        aria-label="เปิดเมนูนำทาง"
        className="fixed left-4 top-[4.25rem] z-30 md:hidden min-h-[44px] min-w-[44px]"
        color="default"
        size="lg"
        variant="flat"
        onPress={onOpen}
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
      <Drawer isOpen={isOpen} placement="left" onOpenChange={onOpenChange}>
        <DrawerContent className="max-w-[280px]">
          <DrawerHeader className="border-b border-default-200">
            เมนู
          </DrawerHeader>
          <DrawerBody className="p-4">
            <AppNavContent onNavigate={() => onOpenChange()} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
