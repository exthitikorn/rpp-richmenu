export type DashboardRange = "1" | "7" | "30" | "all";

const VALID: ReadonlySet<string> = new Set(["1", "7", "30", "all"]);

export function parseDashboardRange(
  raw: string | string[] | undefined,
): DashboardRange {
  const value = Array.isArray(raw) ? raw[0] : raw;

  if (value && VALID.has(value)) return value as DashboardRange;

  return "30";
}

/** Inclusive lower bound for click/event filters. `null` = no lower bound. */
export function rangeStartDate(
  range: DashboardRange,
  now = new Date(),
): Date | null {
  if (range === "all") return null;

  const start = new Date(now);

  if (range === "1") {
    start.setHours(0, 0, 0, 0);

    return start;
  }

  const days = Number(range);

  start.setDate(start.getDate() - days);

  return start;
}

export function rangeLabel(range: DashboardRange): string {
  switch (range) {
    case "1":
      return "วันนี้";
    case "7":
      return "7 วันล่าสุด";
    case "30":
      return "30 วันล่าสุด";
    case "all":
      return "ทั้งหมด";
  }
}
