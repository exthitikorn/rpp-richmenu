import type { LineRichMenuPayload } from "./types";

const LINE_API_BASE = "https://api.line.me/v2/bot";

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
  const res = await lineFetch(`/richmenu/${richMenuId}/content`, accessToken, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: imageBuffer,
  });

  if (!res.ok) {
    const err = await res.text();

    throw new Error(`LINE API uploadRichMenuImage: ${res.status} ${err}`);
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
