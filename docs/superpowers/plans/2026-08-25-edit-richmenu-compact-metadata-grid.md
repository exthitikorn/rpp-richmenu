# Compact Metadata Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make edit-mode metadata fields ~2 rows on desktop (Alias + LINE Account; then image + name + chat bar).

**Architecture:** Conditional Tailwind grid on the metadata `<section>` in `ImportRichMenuForm.tsx` — `xl:grid-cols-6` + col-spans in edit mode; import mode keeps `xl:grid-cols-4`.

**Tech Stack:** Next.js, HeroUI Input/Select, Tailwind utility classes.

## Global Constraints

- Touch only `app/(app)/import/ImportRichMenuForm.tsx` metadata section.
- Import mode layout unchanged.
- No label/copy or behavior changes.
- Project has no test suite — verify visually on edit page at `xl` and `md` widths.

---

### Task 1: Edit-mode compact grid

**Files:**
- Modify: `app/(app)/import/ImportRichMenuForm.tsx` (metadata `<section>` ~869–953)

**Interfaces:**
- Consumes: existing `isEditMode`, field components
- Produces: edit desktop layout Alias `col-span-4` + LINE Account `col-span-2`; row 2 three fields each `col-span-2`

- [ ] **Step 1: Make section grid conditional**

Replace:
```tsx
<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
```

With:
```tsx
<section
  className={
    isEditMode
      ? "grid gap-4 md:grid-cols-2 xl:grid-cols-6"
      : "grid gap-4 md:grid-cols-2 xl:grid-cols-4"
  }
>
```

- [ ] **Step 2: Alias + LINE Account spans**

Alias wrapper: change `md:col-span-2` → `md:col-span-2 xl:col-span-4`

LINE Account `<Select>`: add `className="xl:col-span-2"` (edit-only width; harmless in import where grid is 4-col and span-2 still fits half row — wait: in import, `xl:col-span-2` would make LINE Account take 2 of 4 = half width, and other fields 1 each — breaks 2×2.

So apply span only in edit mode:
```tsx
className={isEditMode ? "xl:col-span-2" : undefined}
```
on Select, and on the three Inputs below (image, name, chat bar).

- [ ] **Step 3: Visual check**

Edit page (`/rich-menus/[id]/edit`): at `xl` → 2 rows as specified; at `md` → Alias full width, others 2-up. Import page: still 2×2.

- [ ] **Step 4: Commit** (only if user asks — do not commit WIP unrelated files)

```bash
git add "app/(app)/import/ImportRichMenuForm.tsx"
git commit -m "fix: compact edit rich menu metadata grid to two rows"
```

---

## Spec coverage

| Spec requirement | Task |
|------------------|------|
| Edit `xl` 6-col, row1 Alias 4 + LINE 2 | Task 1 |
| Edit row2 three fields × col-span-2 | Task 1 |
| Below `xl`: md 2-col, Alias full width | Task 1 |
| Import unchanged | Task 1 conditional classes |
