"use client";

import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
} from "@heroui/drawer";

import { AppNavContent } from "./AppNavContent";

interface MobileAppDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileAppDrawer({
  isOpen,
  onOpenChange,
}: MobileAppDrawerProps) {
  return (
    <Drawer isOpen={isOpen} placement="left" onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-[280px]">
        <DrawerHeader className="border-b border-default-200">
          เมนู
        </DrawerHeader>
        <DrawerBody className="p-4">
          <AppNavContent showBrand onNavigate={() => onOpenChange(false)} />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
