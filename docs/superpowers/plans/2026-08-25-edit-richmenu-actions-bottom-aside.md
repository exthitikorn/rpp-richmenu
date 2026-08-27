# Edit Rich Menu Actions Bottom Aside Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move ล้าง Areas / Deploy ไป LINE / ตั้งเป็น Default from under the Areas heading to the bottom of the Areas aside in edit mode.

**Architecture:** Pure JSX reorder in `ImportRichMenuForm.tsx`. No handler, API, or style changes.

**Tech Stack:** Next.js client component, HeroUI Button

## Global Constraints

- Edit mode only (`isEditMode`); import mode unchanged
- Preserve button props, handlers, modal, and `canSetDefault` gating
- Single file: `app/(app)/import/ImportRichMenuForm.tsx`

---

### Task 1: Move action button row to bottom of aside

**Files:**
- Modify: `app/(app)/import/ImportRichMenuForm.tsx` (aside ~1266–1508)

**Interfaces:**
- Consumes: existing `isEditMode`, `clearingAreas`, `deploying`, `settingDefault`, `canSetDefault`, `isDefaultRichMenu`, `editStatus`, handlers
- Produces: same UI, new DOM order only

- [ ] **Step 1: Remove the button block from under the Areas heading**

Delete the block currently between the `Areas ({areas.length})` heading and the `areas.length === 0` branch:

```tsx
{isEditMode && (
  <div className="flex flex-wrap gap-2">
    {/* ล้าง Areas / Deploy / Default buttons — unchanged props */}
  </div>
)}
```

- [ ] **Step 2: Paste the same block after the areas list/editor, still inside `<aside>`**

After the `areas.length === 0 ? ... : (...)` ternary closes, before `</aside>`, insert the identical `{isEditMode && (...)}` button row.

Final aside order:
1. Heading
2. Empty hint or chips + selected-area editor
3. Edit-mode action buttons

- [ ] **Step 3: Visual check**

Open `/rich-menus/[id]/edit` — confirm buttons appear at bottom of right aside; clear/deploy/default still work; import mode unchanged.

- [ ] **Step 4: Commit** (only if user requests)

```bash
git add "app/(app)/import/ImportRichMenuForm.tsx"
git commit -m "Move edit Rich Menu action buttons to bottom of Areas aside."
```
