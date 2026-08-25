export type VerifyResult = { ok: true } | { ok: false; error: string };

/** Compare Channel ID from form/DB with `client_id` returned by LINE verify. */
export function channelIdsMatch(expected: string, fromLine: string): boolean {
  return expected.trim() === fromLine.trim();
}

async function verifyAccessToken(
  accessToken: string,
  channelId: string,
): Promise<VerifyResult> {
  // Long-lived / short-lived (v2.0)
  const v2 = await fetch("https://api.line.me/v2/oauth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ access_token: accessToken }),
  });

  if (v2.ok) {
    const data = (await v2.json()) as { client_id?: string };

    if (!data.client_id || !channelIdsMatch(channelId, data.client_id)) {
      return {
        ok: false,
        error: "Channel Access Token ไม่ตรงกับ Channel ID ที่ระบุ",
      };
    }

    return { ok: true };
  }

  // Channel Access Token v2.1
  const v21 = await fetch(
    `https://api.line.me/oauth2/v2.1/verify?${new URLSearchParams({
      access_token: accessToken,
    })}`,
  );

  if (v21.ok) {
    const data = (await v21.json()) as { client_id?: string };

    if (!data.client_id || !channelIdsMatch(channelId, data.client_id)) {
      return {
        ok: false,
        error: "Channel Access Token ไม่ตรงกับ Channel ID ที่ระบุ",
      };
    }

    return { ok: true };
  }

  return {
    ok: false,
    error: "Channel Access Token ไม่ถูกต้องหรือหมดอายุ",
  };
}

async function verifyChannelSecret(
  channelId: string,
  channelSecret: string,
): Promise<VerifyResult> {
  // Stateless token — validates ID+Secret without replacing the long-lived token
  const res = await fetch("https://api.line.me/oauth2/v3/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: channelId,
      client_secret: channelSecret,
    }),
  });

  if (!res.ok) {
    return {
      ok: false,
      error: "Channel ID หรือ Channel Secret ไม่ถูกต้อง",
    };
  }

  return { ok: true };
}

/** Full check used on create (all three required). */
export async function verifyLineCredentials(input: {
  channelId: string;
  channelSecret: string;
  accessToken: string;
}): Promise<VerifyResult> {
  const secret = await verifyChannelSecret(
    input.channelId,
    input.channelSecret,
  );

  if (!secret.ok) return secret;

  return verifyAccessToken(input.accessToken, input.channelId);
}

/** Partial check for edit — only validates fields that are being changed. */
export async function verifyLineCredentialUpdates(input: {
  channelId: string;
  channelSecret?: string;
  accessToken?: string;
}): Promise<VerifyResult> {
  if (input.channelSecret) {
    const secret = await verifyChannelSecret(
      input.channelId,
      input.channelSecret,
    );

    if (!secret.ok) return secret;
  }

  if (input.accessToken) {
    return verifyAccessToken(input.accessToken, input.channelId);
  }

  return { ok: true };
}
