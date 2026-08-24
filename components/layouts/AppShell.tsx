"use client";

import { useDisclosure } from "@heroui/modal";

import { AppSidebar } from "./AppSidebar";
import { MobileAppDrawer } from "./MobileAppDrawer";

import { Navbar } from "@/components/navbar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <Navbar onMenuOpen={onOpen} />
      <div className="flex h-full min-h-0 flex-1">
        <AppSidebar />
        <div className="min-w-0 flex-1 overflow-auto p-4 md:p-6">
          <MobileAppDrawer isOpen={isOpen} onOpenChange={onOpenChange} />
          {children}
        </div>
      </div>
    </>
  );
}
