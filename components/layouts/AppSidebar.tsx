"use client";

import { AppNavContent } from "./AppNavContent";

export function AppSidebar() {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-default-200 bg-default-50/50 p-4 md:flex min-h-0">
      <AppNavContent />
    </aside>
  );
}
