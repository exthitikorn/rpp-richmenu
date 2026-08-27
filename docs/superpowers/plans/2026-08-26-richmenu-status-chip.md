# Rich Menu Status Chip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show `DRAFT` / `DEPLOYED` as colored HeroUI chips wherever Rich Menu status is already plain text.

**Architecture:** One shared `RichMenuStatusChip` component; list + LINE OA linked-status call sites swap plain text for the chip.

**Tech Stack:** HeroUI Chip (`@heroui/chip`), Next.js App Router, existing Prisma `RichMenuStatus` enum strings.

## Global Constraints

- Colors: `DRAFT` → `warning`, `DEPLOYED` → `primary`, unknown → `default`
- Chip: `size="sm"`, `variant="flat"`, label = enum string (not Thai)
- Do not touch DeployStatus, edit/import headers, or APIs
- No new dependencies

---

## File Structure

| File | Responsibility |
|---|---|
| `components/rich-menu/RichMenuStatusChip.tsx` | Map status → Chip color + render |
| `app/(app)/rich-menus/RichMenusTable.tsx` | Use chip in table + mobile card |
| `app/(app)/line-accounts/[id]/LineRichMenusOnLine.tsx` | Use chip beside linked-menu link |

---

### Task 1: Add `RichMenuStatusChip` and wire call sites

**Files:**
- Create: `components/rich-menu/RichMenuStatusChip.tsx`
- Modify: `app/(app)/rich-menus/RichMenusTable.tsx`
- Modify: `app/(app)/line-accounts/[id]/LineRichMenusOnLine.tsx`

- [ ] Step 1: Create component

```tsx
"use client";

import { Chip } from "@heroui/chip";

type RichMenuStatusValue = "DRAFT" | "DEPLOYED" | string;

function colorForStatus(status: RichMenuStatusValue) {
  if (status === "DRAFT") return "warning" as const;
  if (status === "DEPLOYED") return "primary" as const;
  return "default" as const;
}

export function RichMenuStatusChip({ status }: { status: RichMenuStatusValue }) {
  return (
    <Chip color={colorForStatus(status)} size="sm" variant="flat">
      {status}
    </Chip>
  );
}
```

- [ ] Step 2: In `RichMenusTable`, import and replace `{rm.status}` (card `<dd>` + table cell) with `<RichMenuStatusChip status={rm.status} />`
- [ ] Step 3: In `LineRichMenusOnLine`, import chip; next to linked name link render `<RichMenuStatusChip status={menu.linkedStatus} />` when present (remove `` ` (${menu.linkedStatus})` `` from link text)
- [ ] Step 4: Visually check `/rich-menus` (table + mobile card) and LINE account detail linked column
- [ ] Step 5: Commit only if user asks

**Done when:** Both list surfaces show yellow DRAFT / blue DEPLOYED chips; linked status on LINE OA page uses the same chip.
