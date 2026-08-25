export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "ระบบจัดการ Rich Menu LINE OA",
  description:
    "จัดการ Rich Menu สำหรับ LINE Official Accounts แบบ Multi-tenant",
  hospitalName: "โรงพยาบาลราชพิพัฒน์",
  department: "ฝ่ายวิชาการและแผนงาน",
  colors: {
    primary: "#1B5E4B",
    secondary: "#C9A227",
    line: "#06C755",
  },
  labels: {
    dashboard: "แดชบอร์ด",
    lineAccounts: "บัญชี LINE Official Account",
    richMenus: "Rich Menu",
    deployLogs: "บันทึกการ Deploy",
    users: "จัดการผู้ใช้",
    profile: "โปรไฟล์",
    importRichMenu: "นำเข้า Rich Menu",
    roleAdmin: "ผู้ดูแลระบบ",
    roleUser: "ผู้ใช้งาน",
    analyticsTitle: "สถิติการคลิก Rich Menu",
  },
};

export function getFooterText(): string {
  return `${siteConfig.department} ${siteConfig.hospitalName}`;
}
