export interface LDAPConfig {
  url: string;
  baseDN: string;
  bindDN: string;
  bindPassword: string;
  searchFilter: string;
  timeout: number;
  connectTimeout: number;
  idleTimeout?: number;
  reconnect?: boolean;
  /** ถ้าตั้งค่า จะอนุญาตเฉพาะ user ที่ DN อยู่ใน OU นี้ (เช่น rpp-user) */
  userOU?: string;
  /** Domain สำหรับ UPN bind (เช่น rpphosp.local) */
  userDomain?: string;
  /** DN ของ AD group — สมาชิกได้รับ isApproved + isSystemAdmin อัตโนมัติ */
  adminGroupDN?: string;
}

/** ข้อมูลผู้ใช้จาก LDAP สำหรับ sync กับ User ใน DB */
export interface LDAPUserData {
  ldapUsername: string;
  displayName: string;
  email: string | null;
  department?: string;
  title?: string;
  /** สมาชิกของ LDAP_ADMIN_GROUP_DN */
  isAdminGroupMember?: boolean;
}

export interface LDAPSearchResult {
  objectName: string;
  attributes: Array<{ type: string; values: string[] }>;
}

export type LDAPErrorCode =
  | "MISSING_CREDENTIALS"
  | "USER_NOT_FOUND"
  | "ACCOUNT_DISABLED"
  | "USER_NOT_AUTHORIZED"
  | "INVALID_CREDENTIALS"
  | "CONNECTION_ERROR"
  | "INTERNAL_ERROR";

export interface LDAPAuthResult {
  success: boolean;
  user?: LDAPUserData;
  errorCode?: LDAPErrorCode;
}
