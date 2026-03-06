import { ProfileForm } from "./ProfileForm";

import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) return null;

  const userWithLine = user as typeof user & {
    lineUserId?: string | null;
    lineDisplayName?: string | null;
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <PageHeader
        description="จัดการข้อมูลโปรไฟล์และรหัสผ่านของบัญชีของคุณ"
        title="Profile"
      />
      <ProfileForm
        email={user.email}
        initialName={user.name}
        lineConnected={Boolean(userWithLine.lineUserId)}
        lineDisplayName={userWithLine.lineDisplayName ?? null}
      />
    </div>
  );
}
