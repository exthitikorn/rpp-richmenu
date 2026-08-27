import { getBotInfo } from "./client";

export type BotInfo = {
  displayName: string;
  pictureUrl?: string;
};

export type LineAccountProfile = {
  name: string;
  pictureUrl: string | null;
};

/** Map LINE bot info → persisted profile fields. Throws if displayName empty. */
export function botInfoToProfile(info: BotInfo): LineAccountProfile {
  const name = info.displayName.trim();

  if (!name) {
    throw new Error("ไม่สามารถดึงข้อมูลโปรไฟล์จาก LINE ได้");
  }

  const pictureUrl = info.pictureUrl?.trim() || null;

  return { name, pictureUrl };
}

/** Hard-fail fetch for create / request / approve. */
export async function fetchLineAccountProfile(
  accessToken: string,
): Promise<LineAccountProfile> {
  try {
    return botInfoToProfile(await getBotInfo(accessToken));
  } catch (e) {
    if (
      e instanceof Error &&
      e.message === "ไม่สามารถดึงข้อมูลโปรไฟล์จาก LINE ได้"
    ) {
      throw e;
    }
    throw new Error("ไม่สามารถดึงข้อมูลโปรไฟล์จาก LINE ได้");
  }
}
