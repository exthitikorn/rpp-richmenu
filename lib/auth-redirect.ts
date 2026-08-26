/** Relative in-app path only — blocks open redirects via callbackUrl. */
export function getDefaultLoginCallbackUrl(): string {
  return "/dashboard";
}

export function sanitizeCallbackUrl(
  raw: string | null | undefined,
  fallback: string = getDefaultLoginCallbackUrl(),
): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (raw.includes("\\") || raw.includes("://")) return fallback;

  return raw;
}

/** http(s) absolute URL only — used for URI tracking redirects. */
export function isAllowedHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);

    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Targets safe to wrap in click-tracking redirects.
 * http(s) → HTTP 302; tel:/mailto: → HTML bridge (302 cannot open them).
 */
export function isAllowedTrackingTarget(raw: string): boolean {
  try {
    const u = new URL(raw);

    if (u.protocol === "http:" || u.protocol === "https:") return true;

    if (u.protocol === "tel:") {
      const body = decodeURIComponent(u.pathname);

      return /^\+?[\d\s().-]{3,30}$/.test(body);
    }

    if (u.protocol === "mailto:") {
      const addr = decodeURIComponent((u.pathname || "").split("?")[0] ?? "");

      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr);
    }

    return false;
  } catch {
    return false;
  }
}
