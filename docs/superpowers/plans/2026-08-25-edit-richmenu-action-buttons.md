# Edit Rich Menu Action Buttons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move edit-page area actions into the Areas aside and leave the sticky footer as Back + Save only.

**Architecture:** Pure UI rearrange in `ImportRichMenuForm` (edit mode). Remove the header back button from the edit page. No API or handler changes — reuse existing `handleClearAreas`, `handleDeploy`, `handleSetDefault`, and the clear-areas modal.

**Tech Stack:** Next.js App Router, HeroUI `Button`, `next/link`, existing form state in `ImportRichMenuForm`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-25-edit-richmenu-action-buttons-design.md`
- Edit-mode footer only: `ย้อนกลับ` (left) + `บันทึกการแก้ไข` (right)
- Areas aside (edit only): `ล้าง Areas`, Deploy, `ตั้งเป็น Default` (when `canSetDefault`) under `Areas (n)` heading
- Preserve all existing handlers, modal, loading/disabled rules, and button colors/variants
- Import mode footer/aside unchanged except footer layout must still right-align the import submit
- This repo has no test suite — verify with `npm run lint` + visual check
- Do not commit unless the user explicitly asks
- No new dependencies

---

## File map

| File | Responsibility |
|---|---|
| `app/(app)/rich-menus/[id]/edit/page.tsx` | Drop header `actions` back button and unused imports |
| `app/(app)/import/ImportRichMenuForm.tsx` | Areas aside action row + slim sticky footer |

---

### Task 1: Remove header back button on edit page

**Files:**
- Modify: `app/(app)/rich-menus/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: none
- Produces: `PageHeader` with title + description only (no `actions`)

- [x] **Step 1: Strip header actions and unused imports**

Replace the file contents with:

```tsx
import { notFound } from "next/navigation";

import { lineAccountWhere, richMenuByIdWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/layouts/PageShell";
import { ImportRichMenuForm } from "@/app/(app)/import/ImportRichMenuForm";

export default async function RichMenuEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) return null;
  const richMenu = await prisma.richMenu.findFirst({
    where: richMenuByIdWhere(user, id),
    include: {
      areas: { orderBy: { order: "asc" } },
      lineAccount: true,
    },
  });

  if (!richMenu) notFound();

  const lineAccounts = await prisma.lineAccount.findMany({
    where: lineAccountWhere(user),
    orderBy: { name: "asc" },
  });

  return (
    <PageShell>
      <PageHeader
        description={`"${richMenu.name}" · ${richMenu.lineAccount.name} · ${richMenu.width}×${richMenu.height}px · ${richMenu.status}${richMenu.isDefault ? " · Default" : ""}`}
        title="แก้ไข Rich Menu"
      />
      <ImportRichMenuForm
        defaultLineAccountId={richMenu.lineAccountId}
        initialData={{
          richMenuId: richMenu.id,
          name: richMenu.name,
          chatBarText: richMenu.chatBarText,
          imageUrl: richMenu.imageUrl,
          width: richMenu.width,
          height: richMenu.height,
          lineAccountId: richMenu.lineAccountId,
          lineRichMenuId: richMenu.lineRichMenuId,
          status: richMenu.status,
          isDefault: richMenu.isDefault,
          areas: richMenu.areas.map((area) => ({
            x: area.x,
            y: area.y,
            width: area.width,
            height: area.height,
            actionType: area.actionType,
            action:
              area.action && typeof area.action === "object"
                ? (area.action as Record<string, unknown>)
                : {},
          })),
        }}
        lineAccounts={lineAccounts}
        mode="edit"
      />
    </PageShell>
  );
}
```

- [x] **Step 2: Verify page still typechecks via lint**

Run: `npx eslint "app/(app)/rich-menus/[id]/edit/page.tsx"`  
Expected: no errors; no unused `NextLink` / `Button` imports.

---

### Task 2: Move area actions into Areas aside; slim footer

**Files:**
- Modify: `app/(app)/import/ImportRichMenuForm.tsx`

**Interfaces:**
- Consumes: existing `isEditMode`, `lineAccountId`, `areas`, `clearingAreas`, `deploying`, `settingDefault`, `editStatus`, `canSetDefault`, `isDefaultRichMenu`, `onOpenClearAreasModal`, `handleDeploy`, `handleSetDefault`, clear-areas modal (unchanged)
- Produces: edit footer = Back + Save; Areas heading followed by edit-only action row

- [x] **Step 1: Add `next/link` import**

At the top of `ImportRichMenuForm.tsx`, with the other imports, add:

```tsx
import NextLink from "next/link";
```

Keep existing `Button` / HeroUI imports.

- [x] **Step 2: Insert edit-only action row under Areas heading**

Find the aside block that starts:

```tsx
<aside className="order-1 space-y-3 xl:order-2">
  <h3 className="text-sm font-semibold text-foreground">
    Areas ({areas.length})
  </h3>
```

Immediately after the `</h3>`, insert (edit mode only):

```tsx
{isEditMode && (
  <div className="flex flex-wrap gap-2">
    <Button
      color="warning"
      isDisabled={areas.length === 0 || clearingAreas}
      size="sm"
      variant="flat"
      onPress={onOpenClearAreasModal}
    >
      ล้าง Areas
    </Button>
    <Button
      color="success"
      isLoading={deploying}
      size="sm"
      variant="flat"
      onPress={handleDeploy}
    >
      {editStatus === "DEPLOYED"
        ? "Deploy ใหม่ไป LINE"
        : "Deploy ไป LINE"}
    </Button>
    {canSetDefault && (
      <Button
        color={isDefaultRichMenu ? "default" : "secondary"}
        isDisabled={isDefaultRichMenu}
        isLoading={settingDefault}
        size="sm"
        variant={isDefaultRichMenu ? "flat" : "bordered"}
        onPress={handleSetDefault}
      >
        {isDefaultRichMenu ? "เป็น Default อยู่แล้ว" : "ตั้งเป็น Default"}
      </Button>
    )}
  </div>
)}
```

Use `size="sm"` so the row fits the narrow aside; keep the same colors/variants/handlers as the old footer buttons.

- [x] **Step 3: Replace sticky footer contents**

Replace the existing sticky footer block:

```tsx
<div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 border-t border-default-200 bg-background/95 py-3">
  {isEditMode && (
    <>
      <Button
        color="warning"
        isDisabled={areas.length === 0 || clearingAreas}
        variant="flat"
        onPress={onOpenClearAreasModal}
      >
        ล้าง Areas
      </Button>
      <Button
        color="success"
        isLoading={deploying}
        variant="flat"
        onPress={handleDeploy}
      >
        {editStatus === "DEPLOYED"
          ? "Deploy ใหม่ไป LINE"
          : "Deploy ไป LINE"}
      </Button>
      {canSetDefault && (
        <Button
          color={isDefaultRichMenu ? "default" : "secondary"}
          isDisabled={isDefaultRichMenu}
          isLoading={settingDefault}
          variant={isDefaultRichMenu ? "flat" : "bordered"}
          onPress={handleSetDefault}
        >
          {isDefaultRichMenu
            ? "เป็น Default อยู่แล้ว"
            : "ตั้งเป็น Default"}
        </Button>
      )}
    </>
  )}
  <Button color="primary" isLoading={loading} type="submit">
    {isEditMode ? "บันทึกการแก้ไข" : "นำเข้า Rich Menu"}
  </Button>
</div>
```

with:

```tsx
<div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-2 border-t border-default-200 bg-background/95 py-3">
  {isEditMode ? (
    <>
      <Button
        as={NextLink}
        href={`/rich-menus?lineAccountId=${encodeURIComponent(lineAccountId)}`}
        variant="light"
      >
        ย้อนกลับ
      </Button>
      <div className="ml-auto">
        <Button color="primary" isLoading={loading} type="submit">
          บันทึกการแก้ไข
        </Button>
      </div>
    </>
  ) : (
    <div className="ml-auto">
      <Button color="primary" isLoading={loading} type="submit">
        นำเข้า Rich Menu
      </Button>
    </div>
  )}
</div>
```

Notes:
- `lineAccountId` is already form state (initialized from `initialData.lineAccountId` in edit mode).
- `encodeURIComponent` matches other query-building in this file.
- Do **not** remove or change the clear-areas `Modal` below the form.

- [x] **Step 4: Lint the form**

Run: `npx eslint "app/(app)/import/ImportRichMenuForm.tsx"`  
Expected: no unused vars; handlers still referenced from the Areas row.

- [x] **Step 5: Manual visual check**

On `/rich-menus/[id]/edit`:
1. Header has no back button
2. Under `Areas (n)`: ล้าง Areas, Deploy, ตั้งเป็น Default (if eligible)
3. Sticky footer: `ย้อนกลับ` left, `บันทึกการแก้ไข` right
4. `ย้อนกลับ` goes to `/rich-menus?lineAccountId=…`
5. Clear / Deploy / Default still work (modal, toasts, loading)
6. Import page `/import`: footer still shows only `นำเข้า Rich Menu` (right); no Areas action row

---

## Spec coverage self-check

| Spec requirement | Task |
|---|---|
| Remove header actions | Task 1 |
| Footer: ย้อนกลับ + บันทึก | Task 2 Step 3 |
| Areas: ล้าง / Deploy / Default | Task 2 Step 2 |
| Import mode unchanged | Task 2 Step 3 + Step 5 |
| Preserve handlers/modal | Task 2 (move only) |

No placeholders. No new types or APIs.
