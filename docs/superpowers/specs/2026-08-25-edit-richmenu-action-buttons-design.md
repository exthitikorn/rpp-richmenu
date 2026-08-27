# Edit Rich Menu — Action Button Layout

Date: 2026-08-25  
Status: approved design (pending implementation)

## Goal

Simplify the edit Rich Menu page so the sticky footer only handles navigation + save, and area-related actions sit next to the Areas editor.

## Scope

- `app/(app)/rich-menus/[id]/edit/page.tsx`
- `app/(app)/import/ImportRichMenuForm.tsx` (edit mode UI only)

Out of scope: import-mode flow, button behavior/API logic, copy changes beyond label “ย้อนกลับ”.

## Layout

### Page header

- Remove the `actions` back button (“กลับไปหน้า Rich Menus”).
- Header keeps title + description only.

### Sticky footer

**Edit mode**

| Side | Control | Behavior |
|------|---------|----------|
| Left | `ย้อนกลับ` (`variant="light"`, link) | Navigate to `/rich-menus?lineAccountId={lineAccountId}` |
| Right | `บันทึกการแก้ไข` (primary, submit) | Existing save handler |

Use `justify-between` (or equivalent) so back stays left and save stays right.

**Import mode**

- Unchanged: only `นำเข้า Rich Menu` on the right.

### Areas aside (edit mode only)

Place a button row **directly under** the `Areas (n)` heading:

1. `ล้าง Areas` — warning/flat; disabled when no areas or while clearing; opens existing confirm modal
2. `Deploy ไป LINE` / `Deploy ใหม่ไป LINE` — success/flat; existing deploy handler + loading
3. `ตั้งเป็น Default` — only when `canSetDefault`; existing set-default handler + disabled/loading states

Import mode: no change to the Areas aside (these three buttons are edit-only).

## Behavior preserved

- Clear-areas modal text and confirm flow
- Deploy / set-default / clear loading and disabled rules
- Footer sticky styling (`border-t`, `bg-background/95`, etc.)

## Approach chosen

Buttons under the Areas heading (approach 1) — closest to the area editor, smallest diff. Rejected: under-canvas bar (farther from area list), overflow menu (hides Deploy).

## Files touched

1. `edit/page.tsx` — drop header `actions` / unused `NextLink`+`Button` imports if unused
2. `ImportRichMenuForm.tsx` — move three edit actions into Areas aside; add back link in footer for edit mode
