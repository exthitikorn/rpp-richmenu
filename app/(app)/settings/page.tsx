import { Card, CardBody, CardHeader } from "@heroui/card";

import { SettingsForm } from "./SettingsForm";

import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site-settings";
import { PageHeader } from "@/components/page-header";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const siteSettings = await getSiteSettings();

  if (!user) return null;

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <PageHeader
        description="ตั้งค่าระบบและการแสดงผลของไซต์"
        title="Settings"
      />
      <Card className="w-full min-w-0 overflow-hidden">
        <CardHeader>บัญชี</CardHeader>
        <CardBody>
          <p className="text-default-600">{user.email}</p>
          <p className="text-sm text-default-400">{user.name ?? "—"}</p>
        </CardBody>
      </Card>
      <SettingsForm initialSettings={siteSettings} />
    </div>
  );
}
