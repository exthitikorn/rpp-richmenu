# LineOA Permission Modal — Table UX

## Summary

Replace the Switch list in the “กำหนดสิทธิ์ LineOA” modal with a searchable two-column table (name + Switch), plus select-all / clear-all for the current filter.

## Scope

- UI only inside `EditUserLineAccountsButton` in `app/(app)/users/UsersTable.tsx`
- No API or schema changes
- Save payload remains `{ lineAccountIds: string[] }`

## Layout

1. Intro text (unchanged): which user is being edited
2. Search `Input` (filter by LineOA name, case-insensitive)
3. Actions: “เลือกทั้งหมด” / “ยกเลิกทั้งหมด” — apply only to rows matching the current search
4. HeroUI `Table`: columns `ชื่อ LineOA` | `สิทธิ์` (Switch)
5. Hint text (unchanged): empty selection still allows login with no accounts
6. Footer: Cancel / Save (unchanged)

Modal body scrolls when the filtered list is long. Empty filter result shows an empty table body (no matches).

## Selection behavior

- Selection state stays a `Set<string>` of LineOA ids
- Opening the modal resets search and reloads selection from the user’s current assignments
- Select all: add all filtered ids
- Clear all: remove all filtered ids (ids outside the filter stay selected)
- Switch toggle per row unchanged

## Out of scope

- Extra columns (channel id, etc.)
- HeroUI Table multi-select selectionMode
- Moving assignment UX out of the modal
