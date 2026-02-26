import { Card, CardBody, CardHeader } from "@heroui/card";

import { SettingsForm } from "./SettingsForm";

import { getCurrentUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card>
        <CardHeader>บัญชี</CardHeader>
        <CardBody>
          <p className="text-default-600">{user.email}</p>
          <p className="text-sm text-default-400">{user.name ?? "—"}</p>
        </CardBody>
      </Card>
      <SettingsForm />
    </div>
  );
}
