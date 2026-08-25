export const LINE_RICH_MENU_MAX = 1000;

export function summarizeRichMenuLimit(count: number) {
  const safe = Math.max(0, count);

  return {
    count: safe,
    max: LINE_RICH_MENU_MAX,
    remaining: Math.max(0, LINE_RICH_MENU_MAX - safe),
  };
}

/** Spec: default if remaining > 50; warning if remaining ≤ 50; danger if count >= 1000 */
export function badgeToneForRemaining(
  remaining: number,
  count: number,
): "default" | "warning" | "danger" {
  if (count >= LINE_RICH_MENU_MAX) return "danger";
  if (remaining <= 50) return "warning";

  return "default";
}
