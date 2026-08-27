# Soft Institutional UI Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every in-scope screen feel like one soft-institutional system while keeping brand colors, Noto Sans Thai, and existing flows.

**Architecture:** Token-first — tune HeroUI/globals, harden shared chrome (`PageHeader`, `PageShell`, `DataTableCard`, new state components), sweep pages to use them, then delete dead `organizations` surfaces.

**Tech Stack:** Next.js App Router, HeroUI v2, Tailwind v4, `next/font` Noto Sans Thai, existing layout components under `components/`.

## Global Constraints

- Keep primary `#1B5E4B` and secondary `#C9A227` (existing `hero.ts` scales).
- Keep font family `Noto Sans Thai`; hierarchy only.
- Soft institutional; gold accent-only; no dark mode / purple / glow.
- No interaction-flow changes; no mobile polish pass.
- No new UI dependencies; stay on HeroUI v2.
- Desktop-first verification; `npm run lint` after substantive batches.
- This repo has no test suite — verify with lint + targeted visual checks, not unit tests.
- Do not commit unless the user explicitly asks.

---

## File map

| File | Responsibility |
|---|---|
| `hero.ts` | Brand color scales + warm background/content if needed |
| `styles/globals.css` | Base body background tone |
| `components/page-header.tsx` | Single restrained hero (dashboard only) |
| `components/ui/EmptyState.tsx` | Shared empty |
| `components/ui/LoadingState.tsx` | Shared loading |
| `components/ui/ErrorState.tsx` | Shared error |
| `components/data/DataTableCard.tsx` | Soften chrome; default to EmptyState |
| `components/layouts/*`, `components/navbar.tsx` | Shell consistency |
| `components/layouts/AuthCard.tsx` | Auth card soft institutional |
| `app/(app)/**/loading.tsx` | Use LoadingState |
| List/table pages | Wire EmptyState |
| `components/rich-menu-editor/*`, import form chrome | Token alignment only |
| `app/(app)/organizations/**`, `app/api/organizations/**` | Delete |
| `config/site.ts` | Drop unused organizations label |

---

### Task 1: Tokens + warm base

**Files:**
- Modify: `hero.ts`
- Modify: `styles/globals.css`

**Interfaces:**
- Produces: warm light theme still exposing HeroUI `primary` / `secondary` / `background`

- [ ] **Step 1: Warm the light theme background**

In `hero.ts` `themes.light.colors`, keep existing primary/secondary blocks. Add/override:

```ts
background: "#F7F6F2",
foreground: "#1A1A1A",
content1: "#FFFEFB",
content2: "#F3F1EB",
```

(Only these extras — do not invent a new palette.)

- [ ] **Step 2: Align body base**

In `styles/globals.css` `@layer base` body, set `background-color` to use theme background (e.g. `@apply bg-background text-foreground` or equivalent) without removing safe-area padding.

- [ ] **Step 3: Verify**

Run: `npm run lint`  
Expected: no new errors from these files.

---

### Task 2: Shared state components + PageHeader

**Files:**
- Create: `components/ui/EmptyState.tsx`
- Create: `components/ui/LoadingState.tsx`
- Create: `components/ui/ErrorState.tsx`
- Modify: `components/page-header.tsx`

**Interfaces:**
- Produces:
  - `EmptyState({ title, description?, action? })`
  - `LoadingState({ label? })` default label `กำลังโหลด...`
  - `ErrorState({ title, description?, action? })`

- [ ] **Step 1: Add EmptyState**

```tsx
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="max-w-md text-sm text-default-500">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
```

- [ ] **Step 2: Add LoadingState**

```tsx
import { Spinner } from "@heroui/spinner";

export function LoadingState({ label = "กำลังโหลด..." }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <Spinner color="primary" size="lg" />
      <p className="text-sm text-default-500">{label}</p>
    </div>
  );
}
```

- [ ] **Step 3: Add ErrorState**

Same layout as EmptyState; title defaults to danger tone via `text-danger` on title.

- [ ] **Step 4: Restrain PageHeader hero**

Keep API (`variant?: "default" | "hero"`). For `hero`, use one soft treatment: light border, soft `from-primary-50/80 via-background to-secondary-50/50` gradient, **no** dual blur blobs.

- [ ] **Step 5: Verify**

Run: `npm run lint`

---

### Task 3: Shell + Auth + DataTableCard

**Files:**
- Modify: `components/layouts/AppSidebar.tsx`
- Modify: `components/layouts/AppNavContent.tsx`
- Modify: `components/navbar.tsx`
- Modify: `app/layout.tsx` (footer only if needed)
- Modify: `components/layouts/AuthCard.tsx`
- Modify: `components/data/DataTableCard.tsx`

- [ ] **Step 1: Soften sidebar**

`bg-content2/60` (or similar warm token), keep `border-default-200`, padding unchanged.

- [ ] **Step 2: Nav active state**

Keep `text-primary font-medium bg-primary/10 rounded-lg`; ensure inactive `text-default-600 hover:text-foreground hover:bg-default-100/80`.

- [ ] **Step 3: Navbar**

`bg-content1/90 backdrop-blur-sm` + existing bottom border.

- [ ] **Step 4: AuthCard**

Border `border-default-200`, `bg-content1`, `shadow-sm` (not `shadow-lg`), soft radius.

- [ ] **Step 5: DataTableCard**

Use softer card (`shadow-none` or `shadow-sm`, `border border-default-200`); when `isEmpty` and no `emptyState`, render `<EmptyState title="ไม่มีข้อมูล" />`.

- [ ] **Step 6: Verify**

Run: `npm run lint`

---

### Task 4: Loading routes + empty sweeps

**Files:**
- Modify: `app/(app)/dashboard/loading.tsx`
- Modify: `app/(app)/users/loading.tsx`
- Modify: `app/(app)/rich-menus/loading.tsx`
- Modify: `app/(app)/deploy-logs/page.tsx`
- Modify: `app/(app)/line-accounts/LineAccountList.tsx`
- Modify: `app/(app)/rich-menus/RichMenusTable.tsx`
- Modify: `app/(app)/users/UsersTable.tsx`
- Modify: `app/(app)/line-accounts/[id]/page.tsx`
- Modify: `app/(app)/dashboard/RichMenuAnalyticsSection.tsx`
- Modify: login Suspense fallback in `app/(auth)/login/page.tsx` → `LoadingState`

- [ ] **Step 1: Replace loading.tsx bodies with `<LoadingState />`**

- [ ] **Step 2: Replace obvious empty `<p className="...">ยังไม่มี...</p>` blocks with `<EmptyState title="..." />`** (keep Thai copy; move sentence into `title` or `title`+`description`)

- [ ] **Step 3: Verify**

Run: `npm run lint`

---

### Task 5: Editor chrome (light)

**Files:**
- Modify: `components/rich-menu-editor/RichMenuEditor.tsx` (and/or import form panel wrappers only if they define chrome classes)
- Modify: `app/(app)/rich-menus/[id]/edit/page.tsx` if header/shell inconsistent

- [ ] **Step 1: Align panel borders/backgrounds to `border-default-200` + `bg-content1` / `bg-content2`** without changing editor behavior handlers.

- [ ] **Step 2: Verify**

Run: `npm run lint`

---

### Task 6: Delete organizations leftovers

**Files:**
- Delete: `app/(app)/organizations/**`
- Delete: `app/api/organizations/**`
- Modify: `config/site.ts` — remove `labels.organizations`
- Grep product code for `/organizations` and remove stale imports/links (not historical specs)

- [ ] **Step 1: Delete organization app + API trees**

- [ ] **Step 2: Remove unused site label**

- [ ] **Step 3: Grep clean**

Run: ripgrep `organizations` in `app/`, `components/`, `config/`, `middleware.ts`  
Expected: no product references left (docs under `docs/` may remain).

- [ ] **Step 4: Verify**

Run: `npm run lint`  
Optional: `npm run build` if time allows.

---

## Spec coverage checklist

| Spec item | Task |
|---|---|
| Brand colors kept | 1 |
| Soft warm background | 1 |
| Noto Sans Thai kept | (no font file change) |
| PageHeader hero restrained / dashboard only | 2 (+ existing dashboard usage) |
| Shared empty/loading/error | 2, 4 |
| Shell + auth soft institutional | 3 |
| List/table pattern via DataTableCard | 3, 4 |
| Editor chrome only | 5 |
| Organizations delete | 6 |
| No mobile pass / no flow changes | Global constraints |
