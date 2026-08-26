import { createHmac, timingSafeEqual } from "crypto";

import { isAllowedTrackingTarget } from "@/lib/auth-redirect";

function signingKey(): string {
  const key = process.env.NEXTAUTH_SECRET;

  if (!key) {
    throw new Error("NEXTAUTH_SECRET is required for tracking redirects");
  }

  return key;
}

export type TrackingParts = {
  channelId: string;
  richMenuId: string;
  areaIndex: string;
  target: string;
};

export function signTrackingTarget(parts: TrackingParts): string {
  const payload = `${parts.channelId}\n${parts.richMenuId}\n${parts.areaIndex}\n${parts.target}`;

  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

export function verifyTrackingTarget(
  parts: TrackingParts,
  signature: string | null | undefined,
): boolean {
  if (!signature || !isAllowedTrackingTarget(parts.target)) return false;

  const expected = signTrackingTarget(parts);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);

  if (a.length !== b.length) return false;

  return timingSafeEqual(new Uint8Array(a), new Uint8Array(b));
}
