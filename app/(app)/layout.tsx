import { AppSidebar } from "@/components/layouts/AppSidebar";
import { MobileAppDrawer } from "@/components/layouts/MobileAppDrawer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-1">
      <AppSidebar />
      <div className="min-w-0 flex-1 overflow-auto p-4 md:p-6 pt-14 md:pt-6">
        <MobileAppDrawer />
        {children}
      </div>
    </div>
  );
}
