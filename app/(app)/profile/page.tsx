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
        description="จัดการข้อมูลโปรไฟล์ของบัญชีของคุณ"
        title="โปรไฟล์"
      />
      <ProfileForm
        email={user.email}
        initialName={user.name}
        ldapUsername={user.ldapUsername}
        lineConnected={Boolean(userWithLine.lineUserId)}
        lineDisplayName={userWithLine.lineDisplayName ?? null}
      />
    </div>
  );
}
