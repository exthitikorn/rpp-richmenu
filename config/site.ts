export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "ระบบจัดการ Rich Menu LINE OA",
  description:
    "จัดการ Rich Menu สำหรับ LINE Official Accounts แบบ Multi-tenant",
  navItems: [
    { label: "หน้าแรก", href: "/" },
    { label: "เข้าสู่ระบบ", href: "/login" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  navMenuItems: [
    { label: "หน้าแรก", href: "/" },
    { label: "เข้าสู่ระบบ", href: "/login" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  links: {
    github: "https://github.com/heroui-inc/heroui",
    docs: "https://heroui.com",
  },
};
