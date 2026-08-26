const ALIAS_PREFIX = "rm_";
const MAX_ALIAS_LENGTH = 32;

function sanitizeId(id: string): string {
  // LINE rich menu alias: a-zA-Z0-9_- and max 32 chars
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}

export function getRichMenuAliasId(id: string): string {
  const sanitized = sanitizeId(id);
  const maxBaseLength = MAX_ALIAS_LENGTH - ALIAS_PREFIX.length;
  const base =
    sanitized.length > maxBaseLength
      ? sanitized.slice(0, maxBaseLength)
      : sanitized;

  // Fallback guard, though id should always be non-empty
  const aliasBase = base || "default";

  return `${ALIAS_PREFIX}${aliasBase}`;
}
