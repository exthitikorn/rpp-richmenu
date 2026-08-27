"use client";

import type { LineAccountRequestStatusValue } from "@/lib/line-account-request-types";

import { Chip } from "@heroui/chip";

const labels: Record<LineAccountRequestStatusValue, string> = {
  PENDING: "รออนุมัติ",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ถูกปฏิเสธ",
  CANCELLED: "ยกเลิกแล้ว",
};

function colorForStatus(status: LineAccountRequestStatusValue) {
  if (status === "PENDING") return "warning" as const;
  if (status === "APPROVED") return "success" as const;
  if (status === "REJECTED") return "danger" as const;

  return "default" as const;
}

export function LineAccountRequestStatusChip({
  status,
}: {
  status: LineAccountRequestStatusValue;
}) {
  return (
    <Chip color={colorForStatus(status)} size="sm" variant="flat">
      {labels[status]}
    </Chip>
  );
}
