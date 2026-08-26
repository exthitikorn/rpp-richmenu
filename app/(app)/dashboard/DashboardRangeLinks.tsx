import type { DashboardRange } from "@/lib/dashboard-range";

import NextLink from "next/link";

const OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: "1", label: "วันนี้" },
  { value: "7", label: "7 วัน" },
  { value: "30", label: "30 วัน" },
  { value: "all", label: "ทั้งหมด" },
];

export function DashboardRangeLinks({ current }: { current: DashboardRange }) {
  return (
    <div
      aria-label="ช่วงเวลาสถิติ"
      className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-primary-100 bg-primary-50/50 p-1"
      role="group"
    >
      {OPTIONS.map((option) => {
        const active = option.value === current;

        return (
          <NextLink
            key={option.value}
            className={
              active
                ? "rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-sm"
                : "rounded-md px-2.5 py-1 text-xs font-medium text-primary-700/80 hover:bg-primary-100/80"
            }
            href={`/dashboard?range=${option.value}`}
            prefetch={false}
          >
            {option.label}
          </NextLink>
        );
      })}
    </div>
  );
}
