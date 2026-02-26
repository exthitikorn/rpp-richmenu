import { AppSidebar } from "@/components/layouts/AppSidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-1">
      <AppSidebar />
      <div className="min-w-0 flex-1 overflow-auto p-6">{children}</div>
    </div>
  );
}
