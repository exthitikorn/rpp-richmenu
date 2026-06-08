interface RequiredLDAPEnv {
  LDAP_URL: string;
  LDAP_BASE_DN: string;
  LDAP_BIND_DN: string;
  LDAP_BIND_PASSWORD: string;
}

interface OptionalLDAPEnv {
  LDAP_SEARCH_FILTER?: string;
  LDAP_TIMEOUT?: string;
  LDAP_CONNECT_TIMEOUT?: string;
  LDAP_IDLE_TIMEOUT?: string;
  LDAP_RECONNECT?: string;
  /** อนุญาตเฉพาะ user ที่ DN อยู่ใน OU นี้ (เช่น rpp-user) */
  LDAP_USER_OU?: string;
  /** Domain สำหรับ UPN bind (เช่น rpphosp.local) */
  LDAP_USER_DOMAIN?: string;
}

/**
 * ตรวจสอบ LDAP environment variables
 * คืนค่า required และ optional สำหรับสร้าง LDAPConfig
 */
export function validateLDAPEnvironment(): {
  required: RequiredLDAPEnv;
  optional: OptionalLDAPEnv;
} {
  const requiredVars: (keyof RequiredLDAPEnv)[] = [
    "LDAP_URL",
    "LDAP_BASE_DN",
    "LDAP_BIND_DN",
    "LDAP_BIND_PASSWORD",
  ];

  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required LDAP environment variables: ${missingVars.join(", ")}`,
    );
  }

  const url = process.env.LDAP_URL!;
  if (!url.startsWith("ldap://") && !url.startsWith("ldaps://")) {
    throw new Error("LDAP_URL ต้องเริ่มต้นด้วย ldap:// หรือ ldaps://");
  }

  return {
    required: {
      LDAP_URL: process.env.LDAP_URL!,
      LDAP_BASE_DN: process.env.LDAP_BASE_DN!,
      LDAP_BIND_DN: process.env.LDAP_BIND_DN!,
      LDAP_BIND_PASSWORD: process.env.LDAP_BIND_PASSWORD!,
    },
    optional: {
      LDAP_SEARCH_FILTER: process.env.LDAP_SEARCH_FILTER,
      LDAP_TIMEOUT: process.env.LDAP_TIMEOUT,
      LDAP_CONNECT_TIMEOUT: process.env.LDAP_CONNECT_TIMEOUT,
      LDAP_IDLE_TIMEOUT: process.env.LDAP_IDLE_TIMEOUT,
      LDAP_RECONNECT: process.env.LDAP_RECONNECT,
      LDAP_USER_OU: process.env.LDAP_USER_OU,
      LDAP_USER_DOMAIN: process.env.LDAP_USER_DOMAIN,
    },
  };
}
