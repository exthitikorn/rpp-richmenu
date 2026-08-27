# Rich Menu Status Chip

Date: 2026-08-26  
Status: approved

## Goal

Show Rich Menu status (`DRAFT` / `DEPLOYED`) as colored HeroUI chips everywhere it is already displayed as plain text, so status is scannable at a glance.

## Scope

In scope:

- Shared component `components/rich-menu/RichMenuStatusChip.tsx`
- `app/(app)/rich-menus/RichMenusTable.tsx` — desktop table cell + mobile card field
- `app/(app)/line-accounts/[id]/LineRichMenusOnLine.tsx` — `linkedStatus` next to linked-menu link

Out of scope:

- `DeployStatus` on deploy logs / dashboard (different enum)
- Edit / import headers and Deploy button labels (status not shown as a status label today)
- Schema / API / label translation to Thai

## UX

- HeroUI `Chip`, `size="sm"`, `variant="flat"` (matches existing chips in the app)
- Colors:
  - `DRAFT` → `warning` (yellow)
  - `DEPLOYED` → `primary` (blue)
  - unknown / future values → `default`
- Chip content = enum string (`DRAFT` / `DEPLOYED`), not Thai
- In `LineRichMenusOnLine`, render chip beside the link text — do not nest Chip inside the link label string

## Approach

One shared `RichMenuStatusChip` component. Call sites pass `status` only; color mapping lives in that one file.

## Files touched

| File | Change |
|---|---|
| `components/rich-menu/RichMenuStatusChip.tsx` | new |
| `app/(app)/rich-menus/RichMenusTable.tsx` | replace plain `{rm.status}` |
| `app/(app)/line-accounts/[id]/LineRichMenusOnLine.tsx` | replace `(linkedStatus)` text |
