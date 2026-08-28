import { siteConfig } from "@/config/site";

const FEATURES = [
  "เข้าสู่ระบบด้วยบัญชีโรงพยาบาล (LDAP)",
  "จัดการ Rich Menu ของ LINE OA ที่ได้รับสิทธิ์",
  "Deploy Rich Menu ไปยัง LINE และติดตามสถานะ",
  "ดูสถิติการคลิก Rich Menu",
  "เชื่อมต่อบัญชี LINE เพื่อเข้าสู่ระบบด้วย LINE ได้ในภายหลัง",
] as const;

export function AuthInfoPanel() {
  return (
    <div className="flex h-full flex-col gap-4 p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: siteConfig.colors.primary }}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              d="M4 6h16M4 12h16M4 18h10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h2 className="text-lg font-semibold text-primary sm:text-xl">
          {siteConfig.name}
        </h2>
      </div>
      <p className="text-sm text-default-500">
        ระบบของ{siteConfig.hospitalName} สำหรับจัดการ Rich Menu และบัญชี LINE
        Official Account ที่ได้รับมอบหมาย
      </p>
      <p className="text-sm font-semibold text-primary">คุณสามารถ:</p>
      <ul className="flex flex-col gap-3">
        {FEATURES.map((text) => (
          <li
            key={text}
            className="flex items-start gap-2 text-sm text-default-600"
          >
            <span
              aria-hidden
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: siteConfig.colors.primary }}
            >
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 13l4 4L19 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
