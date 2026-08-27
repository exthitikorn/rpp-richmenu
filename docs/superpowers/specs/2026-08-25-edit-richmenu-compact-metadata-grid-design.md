# Edit Rich Menu — Compact Metadata Grid

Date: 2026-08-25  
Status: approved design (pending implementation)

## Goal

Make the edit-mode metadata field block more compact: ~2 rows on desktop instead of Alias spanning a full row alone.

## Scope

- `app/(app)/import/ImportRichMenuForm.tsx` — metadata `<section>` grid only (edit mode layout)

Out of scope: import-mode layout, labels/copy, field behavior, Areas aside / sticky footer (separate specs).

## Layout

### Edit mode — `xl+` (6-column grid)

| Row | Fields |
|-----|--------|
| 1 | Alias ID + copy button (`col-span-4`) · LINE Account (`col-span-2`) |
| 2 | เปลี่ยนรูป · ชื่อ Rich Menu · Chat Bar Text (each `col-span-2`) |

### Below `xl`

- Keep `md:grid-cols-2`
- Alias ID row keeps `md:col-span-2` (full width of the 2-col grid)
- Remaining fields stay two-up as today

### Import mode

- Unchanged: four fields in the existing 2×2 arrangement (no Alias ID)

## Approach chosen

Approach 1 — “important first”: Alias wider on row 1 with LINE Account; editable fields on row 2. Rejected: denser 3+2 (Alias too narrow), equal 5-col (Alias cramped).

## Files touched

1. `ImportRichMenuForm.tsx` — adjust grid classes / col-spans for edit-mode metadata section
