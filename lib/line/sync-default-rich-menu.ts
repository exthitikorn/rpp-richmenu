import {
  bulkLinkRichMenuToUsers,
  bulkUnlinkRichMenuFromUsers,
  getFollowerIds,
  linkRichMenuToUser,
  setDefaultRichMenu,
  unlinkRichMenuFromUser,
} from "@/lib/line/client";

export type SyncDefaultResult = {
  followerSync: "ok" | "unavailable";
  followerCount: number;
  linkedExtraUserIds: string[];
};

/** Documented phase order — set default before audience refresh (no clear gap). */
export const SYNC_DEFAULT_PHASES = [
  "setDefault",
  "refreshFollowers",
  "linkExtras",
] as const;

const CHUNK = 500;

/**
 * Set Messaging API default rich menu, then refresh audience when possible.
 * - setDefault first (replaces previous default; no clearDefault gap).
 * - Verified/premium OA: unlink+relink all followers (immediate).
 * - Otherwise: default only (LINE shows it after user re-opens chat).
 * - Always tries `extraUserIds` (e.g. operator's linked LINE) for immediate update.
 * - Follower / extra-user failures never undo a successful setDefault.
 */
export async function syncDefaultRichMenu(
  accessToken: string,
  lineRichMenuId: string,
  opts?: { extraUserIds?: Array<string | null | undefined> },
): Promise<SyncDefaultResult> {
  await setDefaultRichMenu(accessToken, lineRichMenuId);

  let followerIds: string[] = [];
  let followerSync: SyncDefaultResult["followerSync"] = "ok";

  try {
    followerIds = await getFollowerIds(accessToken);
    for (let i = 0; i < followerIds.length; i += CHUNK) {
      const chunk = followerIds.slice(i, i + CHUNK);

      await bulkUnlinkRichMenuFromUsers(accessToken, chunk);
      await bulkLinkRichMenuToUsers(accessToken, lineRichMenuId, chunk);
    }
  } catch {
    // getFollowerIds / bulk*: verified or premium OA only; default already set
    followerSync = "unavailable";
    followerIds = [];
  }

  const linkedExtraUserIds: string[] = [];
  const extra = Array.from(
    new Set(
      (opts?.extraUserIds ?? []).filter(
        (id): id is string => typeof id === "string" && id.length > 0,
      ),
    ),
  );

  for (const userId of extra) {
    try {
      await unlinkRichMenuFromUser(accessToken, userId);
      await linkRichMenuToUser(accessToken, userId, lineRichMenuId);
      linkedExtraUserIds.push(userId);
    } catch {
      // not a friend of this OA, or token scope issue
    }
  }

  return {
    followerSync,
    followerCount: followerIds.length,
    linkedExtraUserIds,
  };
}

export function syncDefaultHint(result: SyncDefaultResult): string {
  if (result.linkedExtraUserIds.length > 0) {
    return "อัปเดตเมนูในบัญชี LINE ที่เชื่อมกับโปรไฟล์แล้ว — บัญชีอื่นปิดแชทแล้วเปิดใหม่";
  }
  if (result.followerSync === "unavailable") {
    return "ตั้ง default แล้ว แต่ OA นี้บังคับอัปเดตเพื่อนทั้งหมดไม่ได้ — ปิดแชทแล้วเปิดใหม่ (อาจถึง 1 นาที) หรือเชื่อม LINE ที่โปรไฟล์แล้วลองอีกครั้ง";
  }
  if (result.followerCount > 0) {
    return "อัปเดตให้ผู้ติดตามแล้ว — ถ้ายังไม่เปลี่ยน ลองปิดแชทแล้วเปิดใหม่";
  }

  return "ถ้าแอป LINE ยังไม่เปลี่ยน ลองปิดแชทแล้วเปิดใหม่";
}
