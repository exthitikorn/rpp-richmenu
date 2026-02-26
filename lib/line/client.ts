import type { LineRichMenuPayload } from "./types";

const LINE_API_BASE = "https://api.line.me/v2/bot";
const LINE_DATA_API_BASE = "https://api-data.line.me/v2/bot";

async function lineFetch(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<Response> {
  const res = await fetch(`${LINE_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers as Record<string, string>),
    },
  });

  return res;
}

async function lineDataFetch(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<Response> {
  const res = await fetch(`${LINE_DATA_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers as Record<string, string>),
    },
  });

  return res;
}

export async function createRichMenu(
  accessToken: string,
  payload: LineRichMenuPayload,
): Promise<{ richMenuId: string }> {
  const res = await lineFetch("/richmenu", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();

    throw new Error(`LINE API createRichMenu: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { richMenuId: string };

  return data;
}

export async function uploadRichMenuImage(
  accessToken: string,
  richMenuId: string,
  imageBuffer: ArrayBuffer,
  contentType: "image/jpeg" | "image/png",
): Promise<void> {
  const res = await lineDataFetch(
    `/richmenu/${richMenuId}/content`,
    accessToken,
    {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: imageBuffer,
    },
  );

  if (!res.ok) {
    const err = await res.text();

    throw new Error(`LINE API uploadRichMenuImage: ${res.status} ${err}`);
  }
}

/** ล้าง default rich menu (ทำให้ทุกคนไม่ติดเมนู default ชั่วคราว) */
export async function clearDefaultRichMenu(
  accessToken: string,
): Promise<void> {
  const res = await lineFetch("/user/all/richmenu", accessToken, {
    method: "DELETE",
  });

  if (!res.ok) {
    const err = await res.text();

    throw new Error(`LINE API clearDefaultRichMenu: ${res.status} ${err}`);
  }
}

export async function setDefaultRichMenu(
  accessToken: string,
  richMenuId: string,
): Promise<void> {
  const res = await lineFetch(`/user/all/richmenu/${richMenuId}`, accessToken, {
    method: "POST",
  });

  if (!res.ok) {
    const err = await res.text();

    throw new Error(`LINE API setDefaultRichMenu: ${res.status} ${err}`);
  }
}

const BULK_UNLINK_CHUNK_SIZE = 500;

/**
 * ดึง user ID ของผู้ติดตามทั้งหมด (ใช้ได้กับ verified / premium OA)
 * @see https://developers.line.biz/en/reference/messaging-api/#get-follower-ids
 */
export async function getFollowerIds(
  accessToken: string,
): Promise<string[]> {
  const all: string[] = [];
  let start: string | undefined;

  do {
    const url = start
      ? `/followers/ids?limit=500&start=${encodeURIComponent(start)}`
      : "/followers/ids?limit=500";
    const res = await lineFetch(url, accessToken);

    if (!res.ok) {
      const err = await res.text();

      throw new Error(`LINE API getFollowerIds: ${res.status} ${err}`);
    }

    const data = (await res.json()) as {
      userIds: string[];
      next?: string;
    };
    all.push(...(data.userIds ?? []));
    start = data.next;
  } while (start);

  return all;
}

/**
 * Unlink per-user rich menu จากผู้ใช้ที่ระบุ (ทำให้ผู้ใช้กลับไปใช้ default)
 * LINE จำกัดไม่เกิน 500 userId ต่อ request
 */
export async function bulkUnlinkRichMenuFromUsers(
  accessToken: string,
  userIds: string[],
): Promise<void> {
  if (userIds.length === 0) return;

  const res = await lineFetch("/richmenu/bulk/unlink", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userIds }),
  });

  if (!res.ok) {
    const err = await res.text();

    throw new Error(`LINE API bulkUnlinkRichMenuFromUsers: ${res.status} ${err}`);
  }
}

/**
 * ผูก rich menu กับผู้ใช้หลายคนพร้อมกัน (ให้ทุกคนเห็นเมนูนี้ทันที)
 * LINE จำกัดไม่เกิน 500 userId ต่อ request
 */
export async function bulkLinkRichMenuToUsers(
  accessToken: string,
  richMenuId: string,
  userIds: string[],
): Promise<void> {
  if (userIds.length === 0) return;

  const res = await lineFetch("/richmenu/bulk/link", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ richMenuId, userIds }),
  });

  if (!res.ok) {
    const err = await res.text();

    throw new Error(`LINE API bulkLinkRichMenuToUsers: ${res.status} ${err}`);
  }
}

export async function createRichMenuAlias(
  accessToken: string,
  richMenuAliasId: string,
  richMenuId: string,
  description?: string,
): Promise<void> {
  const res = await lineFetch("/richmenu/alias", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      richMenuAliasId,
      richMenuId,
      ...(description ? { description } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text();

    throw new Error(`LINE API createRichMenuAlias: ${res.status} ${err}`);
  }
}

export async function updateRichMenuAlias(
  accessToken: string,
  richMenuAliasId: string,
  richMenuId: string,
  description?: string,
): Promise<void> {
  const res = await lineFetch(
    `/richmenu/alias/${encodeURIComponent(richMenuAliasId)}`,
    accessToken,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        richMenuId,
        ...(description ? { description } : {}),
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();

    throw new Error(`LINE API updateRichMenuAlias: ${res.status} ${err}`);
  }
}

export async function ensureRichMenuAlias(
  accessToken: string,
  richMenuAliasId: string,
  richMenuId: string,
  description?: string,
): Promise<void> {
  try {
    await createRichMenuAlias(accessToken, richMenuAliasId, richMenuId, description);
  } catch (error) {
    const isConflict =
      error instanceof Error &&
      (/LINE API createRichMenuAlias: 409 /.test(error.message) ||
        (error.message.includes("LINE API createRichMenuAlias: 400") &&
          error.message.toLowerCase().includes("conflict")));

    if (isConflict) {
      await updateRichMenuAlias(
        accessToken,
        richMenuAliasId,
        richMenuId,
        description,
      );
      return;
    }

    throw error;
  }
}

export async function linkRichMenuToUser(
  accessToken: string,
  userId: string,
  richMenuId: string,
): Promise<void> {
  const res = await lineFetch(
    `/user/${userId}/richmenu/${richMenuId}`,
    accessToken,
    { method: "POST" },
  );

  if (!res.ok) {
    const err = await res.text();

    throw new Error(`LINE API linkRichMenuToUser: ${res.status} ${err}`);
  }
}

export async function deleteRichMenu(
  accessToken: string,
  richMenuId: string,
): Promise<void> {
  const res = await lineFetch(`/richmenu/${richMenuId}`, accessToken, {
    method: "DELETE",
  });

  if (!res.ok) {
    const err = await res.text();

    throw new Error(`LINE API deleteRichMenu: ${res.status} ${err}`);
  }
}
