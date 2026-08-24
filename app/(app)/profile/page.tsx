import { ProfileForm } from "./ProfileForm";

import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/layouts/PageShell";
import { siteConfig } from "@/config/site";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) return null;

  const userWithLine = user as typeof user & {
    lineUserId?: string | null;
    lineDisplayName?: string | null;
  };

  return (
    <PageShell>
      <PageHeader
        description="จัดการข้อมูลโปรไฟล์ของบัญชีของคุณ"
        title={siteConfig.labels.profile}
      />
      <ProfileForm
        email={user.email}
        initialName={user.name}
        ldapUsername={user.ldapUsername}
        lineConnected={Boolean(userWithLine.lineUserId)}
        lineDisplayName={userWithLine.lineDisplayName ?? null}
      />
    </PageShell>
  );
}
