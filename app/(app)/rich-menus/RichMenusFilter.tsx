"use client";

import type { LineAccount } from "@/app/generated/prisma/client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectItem } from "@heroui/select";

type Props = {
  currentLineAccountId: string | null;
  lineAccounts: LineAccount[];
};

export function RichMenusFilter({ currentLineAccountId, lineAccounts }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (lineAccounts.length <= 1) return null;

  function onLineAccountChange(keys: "all" | Set<React.Key>) {
    const id = keys === "all" ? "" : Array.from(keys)[0];
    const next = new URLSearchParams(searchParams);

    if (id && id !== "all") next.set("lineAccountId", String(id));
    else next.delete("lineAccountId");
    router.push(`/rich-menus?${next.toString()}`);
  }

  const selectedKey =
    currentLineAccountId &&
    lineAccounts.some((la) => la.id === currentLineAccountId)
      ? currentLineAccountId
      : "all";

  return (
    <Select
      className="w-full sm:max-w-xs"
      items={[
        { id: "all", name: "ทั้งหมด" },
        ...lineAccounts.map((la) => ({ id: la.id, name: la.name })),
      ]}
      label="LINE Account"
      placeholder="ทั้งหมด"
      selectedKeys={selectedKey === "all" ? ["all"] : [selectedKey]}
      onSelectionChange={(keys) => {
        const k = keys as "all" | Set<React.Key>;

        if (k === "all" || k.size === 0) onLineAccountChange("all");
        else onLineAccountChange(k);
      }}
    >
      {(item) => <SelectItem key={item.id}>{item.name}</SelectItem>}
    </Select>
  );
}
