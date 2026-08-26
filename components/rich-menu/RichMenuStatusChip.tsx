"use client";

import { Chip } from "@heroui/chip";

type RichMenuStatusValue = "DRAFT" | "DEPLOYED" | string;

function colorForStatus(status: RichMenuStatusValue) {
  if (status === "DRAFT") return "warning" as const;
  if (status === "DEPLOYED") return "primary" as const;

  return "default" as const;
}

export function RichMenuStatusChip({
  status,
}: {
  status: RichMenuStatusValue;
}) {
  return (
    <Chip color={colorForStatus(status)} size="sm" variant="flat">
      {status}
    </Chip>
  );
}
