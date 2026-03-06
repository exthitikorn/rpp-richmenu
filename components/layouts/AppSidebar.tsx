"use client";

import { AppNavContent } from "./AppNavContent";

export function AppSidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-default-200 bg-default-50/50 p-4 md:flex flex-col min-h-0">
      <AppNavContent />
    </aside>
  );
}
