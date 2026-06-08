import type { LDAPUserData, LDAPErrorCode } from "@/types/ldap";
import { createLDAPService } from "@/lib/ldap";

export class LDAPProvider {
  /**
   * ยืนยันตัวตนผ่าน LDAP — รหัสผ่านไม่เก็บใน DB
   */
  async authenticate(
    username: string,
    password: string,
  ): Promise<LDAPUserData | null> {
    const ldapService = createLDAPService();

    try {
      const result = await ldapService.authenticate(username, password);

      if (result.success && result.user) {
        return result.user;
      }

      if (result.errorCode) {
        throw new Error(result.errorCode);
      }

      return null;
    } catch (error) {
      throw error;
    } finally {
      await ldapService.disconnect();
    }
  }

  /**
   * แปลง LDAP error code เป็นข้อความภาษาไทย
   */
  mapErrorCodeToMessage(code: LDAPErrorCode): string {
    const messages: Record<LDAPErrorCode, string> = {
      MISSING_CREDENTIALS: "กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน",
      USER_NOT_FOUND: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง",
      ACCOUNT_DISABLED: "บัญชีผู้ใช้นี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ",
      USER_NOT_AUTHORIZED:
        "ผู้ใช้ไม่อยู่ในกลุ่มที่ได้รับอนุญาต กรุณาติดต่อผู้ดูแลระบบ",
      INVALID_CREDENTIALS: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง",
      CONNECTION_ERROR:
        "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ AD ได้ กรุณาติดต่อผู้ดูแลระบบ",
      INTERNAL_ERROR: "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง",
    };
    return messages[code] ?? messages.INTERNAL_ERROR;
  }
}
