import type {
  LDAPConfig,
  LDAPUserData,
  LDAPAuthResult,
  LDAPSearchResult,
} from "@/types/ldap";
import { Client } from "ldapts";
import { validateLDAPEnvironment } from "./env";

/** Escape ค่าใน filter ตาม RFC 2254 */
function escapeFilter(val: string): string {
  return val
    .replace(/\\/g, "\\5c")
    .replace(/\*/g, "\\2a")
    .replace(/\(/g, "\\28")
    .replace(/\)/g, "\\29")
    .replace(/\0/g, "\\00");
}

/** ดึง OU แรกจาก DN (เช่น OU=rpp-user จาก CN=...,OU=rpp-user,DC=...) */
function getFirstOU(dn: string): string | null {
  const parts = dn.split(",").map((s) => s.trim());
  const firstOU = parts.find((p) => p.toUpperCase().startsWith("OU="));
  return firstOU ? firstOU.slice(3) : null;
}

/** แปลง Entry จาก ldapts เป็น LDAPSearchResult */
function entryToSearchResult(entry: {
  dn: string;
  [k: string]: Buffer | Buffer[] | string[] | string;
}): LDAPSearchResult {
  const attributes: Array<{ type: string; values: string[] }> = [];

  for (const [type, rawValues] of Object.entries(entry)) {
    if (type === "dn") continue;

    const convert = (val: Buffer | string): string => {
      if (Buffer.isBuffer(val)) return val.toString("utf8");
      return typeof val === "string" ? val : String(val);
    };

    const values: string[] = Array.isArray(rawValues)
      ? (rawValues as (Buffer | string)[]).map(convert)
      : [convert(rawValues as Buffer | string)];

    attributes.push({ type, values });
  }

  return {
    objectName: entry.dn,
    attributes,
  };
}

export class LDAPService {
  private config: LDAPConfig;
  private client: Client | null = null;

  constructor(config: LDAPConfig) {
    this.config = config;
  }

  private async createClient(): Promise<Client> {
    if (this.client) return this.client;

    this.client = new Client({
      url: this.config.url,
      timeout: this.config.timeout,
      connectTimeout: this.config.connectTimeout,
    });

    return this.client;
  }

  private async closeClient(): Promise<void> {
    if (this.client) {
      try {
        await this.client.unbind();
      } finally {
        this.client = null;
      }
    }
  }

  private isConnectionError(error: unknown): boolean {
    if (!error) return false;
    const message = ((error as Error)?.message ?? "").toString();
    const name = ((error as Error)?.name ?? "").toString();
    const lower = `${name} ${message}`.toLowerCase();
    const networkKeywords = [
      "econnrefused",
      "etimedout",
      "econnreset",
      "ehostunreach",
      "enetunreach",
      "enotfound",
      "server down",
      "code 81",
      "timeout",
      "timed out",
      "connect",
      "network",
      "socket",
    ];
    return networkKeywords.some((k) => lower.includes(k));
  }

  private async searchUser(username: string): Promise<LDAPSearchResult | null> {
    const client = await this.createClient();

    try {
      await client.bind(this.config.bindDN, this.config.bindPassword);
    } catch (error) {
      if (this.isConnectionError(error)) {
        throw new Error("LDAP_CONNECTION_ERROR");
      }
      return null;
    }

    try {
      const safeUsername = escapeFilter(username.trim());
      const searchFilter = this.config.searchFilter.replace(
        /\{\{username\}\}/g,
        safeUsername,
      );

      const { searchEntries } = await client.search(this.config.baseDN, {
        scope: "sub",
        filter: searchFilter,
        sizeLimit: 1,
      });

      if (searchEntries.length === 0) return null;

      const entry = searchEntries[0] as {
        dn: string;
        [k: string]: Buffer | Buffer[] | string[] | string;
      };
      return entryToSearchResult(entry);
    } catch (error) {
      if (this.isConnectionError(error)) {
        throw new Error("LDAP_SEARCH_ERROR");
      }
      return null;
    }
  }

  private async testUserBind(
    userDN: string,
    password: string,
  ): Promise<boolean> {
    const userClient = new Client({
      url: this.config.url,
      timeout: this.config.timeout,
      connectTimeout: this.config.connectTimeout,
    });

    try {
      await userClient.bind(userDN, password);
      await userClient.unbind();
      return true;
    } catch {
      return false;
    }
  }

  private isAccountDisabled(
    attributes: Array<{ type: string; values: string[] }>,
  ): boolean {
    const uac = attributes.find((a) => a.type === "userAccountControl");
    if (!uac?.values[0]) return false;
    const value = parseInt(uac.values[0], 10);
    return (value & 2) === 2; // ADS_UF_ACCOUNTDISABLE
  }

  private isUserInAllowedOU(objectName: string): boolean {
    const ou = this.config.userOU;
    if (!ou) return true;
    const pattern = new RegExp(`OU=${escapeRegex(ou)}`, "i");
    return pattern.test(objectName);
  }

  private parseUserData(
    searchResult: LDAPSearchResult,
    username: string,
  ): LDAPUserData {
    const { attributes } = searchResult;

    const getAttr = (name: string): string =>
      attributes.find((a) => a.type === name)?.values[0] ?? "";

    const dn = getAttr("distinguishedName") || searchResult.objectName;
    const department = getFirstOU(dn) ?? undefined;
    const title = getAttr("title") || getAttr("description") || undefined;

    return {
      ldapUsername: getAttr("sAMAccountName") || username.trim(),
      displayName:
        getAttr("displayName") || getAttr("cn") || username.trim(),
      email: getAttr("userPrincipalName") || getAttr("mail") || null,
      department,
      title,
    };
  }

  async authenticate(
    username: string,
    password: string,
  ): Promise<LDAPAuthResult> {
    try {
      if (!username?.trim() || !password) {
        return { success: false, errorCode: "MISSING_CREDENTIALS" };
      }

      const searchResult = await this.searchUser(username);

      if (!searchResult) {
        return { success: false, errorCode: "USER_NOT_FOUND" };
      }

      if (this.isAccountDisabled(searchResult.attributes)) {
        return { success: false, errorCode: "ACCOUNT_DISABLED" };
      }

      if (!this.isUserInAllowedOU(searchResult.objectName)) {
        return { success: false, errorCode: "USER_NOT_AUTHORIZED" };
      }

      const domain = this.config.userDomain ?? "rpphosp.local";
      const bindCandidates = [
        searchResult.objectName,
        `${username.trim()}@${domain}`,
        username.trim(),
      ];

      let bindSuccess = false;
      for (const dn of bindCandidates) {
        bindSuccess = await this.testUserBind(dn, password);
        if (bindSuccess) break;
      }

      if (!bindSuccess) {
        return { success: false, errorCode: "INVALID_CREDENTIALS" };
      }

      const userData = this.parseUserData(searchResult, username);
      return { success: true, user: userData };
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === "LDAP_CONNECTION_ERROR" ||
          error.message.startsWith("LDAP_") ||
          this.isConnectionError(error))
      ) {
        return { success: false, errorCode: "CONNECTION_ERROR" };
      }
      return { success: false, errorCode: "INTERNAL_ERROR" };
    } finally {
      await this.closeClient();
    }
  }

  async disconnect(): Promise<void> {
    await this.closeClient();
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * สร้าง LDAP Service จาก environment variables
 */
export function createLDAPService(): LDAPService {
  const { required, optional } = validateLDAPEnvironment();

  const config: LDAPConfig = {
    url: required.LDAP_URL,
    baseDN: required.LDAP_BASE_DN,
    bindDN: required.LDAP_BIND_DN,
    bindPassword: required.LDAP_BIND_PASSWORD,
    searchFilter:
      optional.LDAP_SEARCH_FILTER ??
      "(|(sAMAccountName={{username}})(userPrincipalName={{username}}))",
    timeout: parseInt(optional.LDAP_TIMEOUT ?? "5000", 10),
    connectTimeout: parseInt(optional.LDAP_CONNECT_TIMEOUT ?? "10000", 10),
    idleTimeout: optional.LDAP_IDLE_TIMEOUT
      ? parseInt(optional.LDAP_IDLE_TIMEOUT, 10)
      : undefined,
    reconnect: optional.LDAP_RECONNECT === "true",
    userOU: optional.LDAP_USER_OU,
    userDomain: optional.LDAP_USER_DOMAIN,
  };

  return new LDAPService(config);
}
