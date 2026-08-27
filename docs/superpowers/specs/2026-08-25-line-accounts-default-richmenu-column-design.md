# LINE Accounts List — Default Rich Menu Column

Date: 2026-08-25  
Status: approved

## Goal

Replace the Channel ID column on the LINE Accounts list with which Rich Menu is currently the default for that OA, so operators can see default status without opening each account.

## Scope

- `app/(app)/line-accounts/page.tsx` — extend Prisma select
- `app/(app)/line-accounts/LineAccountList.tsx` — table + mobile card UI

Out of scope: schema changes, set-default API, Channel ID in edit modal (stays), linking to rich-menu edit page.

## Data

In `page.tsx` `findMany` select, add:

```ts
richMenus: {
  where: { isDefault: true },
  select: { id: true, name: true },
  take: 1,
}
```

At most one default per account (enforced by deploy / set-default flows). Use `richMenus[0]` as the default (or undefined if empty).

## UX

### Column / field label

- Header: **Default Rich Menu** (แทน Channel ID)
- Mobile card `dt`: same label

### Display (Chip, not a link)

| Case | Chip |
|---|---|
| Has default | `variant="flat"` `color="success"` — content = Rich Menu `name` (truncate) |
| No default | `variant="flat"` `color="default"` — content = **ยังไม่มี default** |

Apply in both desktop tables (systemAdmin and non-admin) and mobile cards.

### Unchanged

- Channel ID remains visible only in the edit modal (read-only)
- Rich Menus count column, assignees, manage actions unchanged

## Approach

Nested select (approach 1). No denormalized field on `LineAccount`. Reuse `@heroui/chip` like other list UIs.

## Files touched

1. `page.tsx` — nested `richMenus` select
2. `LineAccountList.tsx` — type update, Chip helper/cell, replace Channel ID in table + card
