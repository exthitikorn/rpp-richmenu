import { ProfileForm } from "./ProfileForm";

import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        description="จัดการข้อมูลโปรไฟล์และรหัสผ่านของบัญชีของคุณ"
        title="Profile"
      />
      <ProfileForm email={user.email} initialName={user.name} />
    </div>
  );
}
