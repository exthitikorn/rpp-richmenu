# LINE Rich Menu Check & Delete (per OA)

Date: 2026-08-25  
Status: approved (user: scope B check+delete, UI on detail only, permissions C check-all/delete-admin, DB sync B, fetch A on load, approach 1 client+API)

## Goal

On `/line-accounts/[id]`, show how many Rich Menus exist on LINE via Messaging API (`count/1000`) and let system admins delete individual LINE-side menus, syncing linked DB rows.

LINE limit: **1,000** Rich Menus per Official Account created via Messaging API. `GET /v2/bot/richmenu/list` does **not** include menus created in LINE Official Account Manager.

Reference: `docs/line-rich-menu-check-delete.md`

## Permissions

| Action | Who |
|--------|-----|
| View count + list | Anyone who can open the LINE Account detail (`lineAccountByIdWhere`) |
| Delete a LINE rich menu | System admin only |

## Architecture

Approach: **client panel + API routes** (do not block RSC on LINE latency).

### LINE client (`lib/line/client.ts`)

- Add `getRichMenus(accessToken)` → `GET /v2/bot/richmenu/list`, return `richmenus` array
- Reuse existing `deleteRichMenu(accessToken, richMenuId)`

### API

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/api/line-accounts/[id]/line-rich-menus` | Detail access |
| `DELETE` | `/api/line-accounts/[id]/line-rich-menus/[lineRichMenuId]` | System admin + detail access |

**GET response:**

```ts
{
  count: number;
  max: 1000;
  remaining: number;
  richMenus: Array<{
    richMenuId: string;
    name: string;
    chatBarText: string;
    selected: boolean;
    size: { width: number; height: number };
    linkedRichMenuId?: string;   // our RichMenu.id if matched
    linkedName?: string;
    linkedStatus?: "DRAFT" | "DEPLOYED";
    isDefault?: boolean;
  }>;
}
```

Matching: for each LINE `richMenuId`, look up `RichMenu` where `lineAccountId = id` and `lineRichMenuId = richMenuId`.

**DELETE behavior:**

1. Verify account access + system admin
2. Call LINE `DELETE /v2/bot/richmenu/{lineRichMenuId}`
3. If a DB row matches that `lineRichMenuId` on this account, update:
   - `lineRichMenuId = null`
   - `status = DRAFT`
   - `isDefault = false`
4. Do **not** delete the DB `RichMenu` record
5. Return `{ success: true }` (and optionally whether a DB row was unlinked)

## UI (`/line-accounts/[id]`)

New client section below the existing DB Rich Menus card:

1. Header: `Rich Menus บน LINE` + badge `count/1000`
   - Default styling when `remaining > 50`
   - Warning when `remaining ≤ 50`
   - Danger when `count >= 1000`
2. Short hint: counts only Messaging API menus (not OA Manager)
3. List/table: LINE name, size, chat bar, linked status (link to edit if linked / “ไม่พบในระบบ”), delete button (admin only)
4. Confirm modal before delete: show name + `richMenuId`; if linked, note that the system link will be cleared
5. Single-delete only (no bulk)
6. After successful delete, re-fetch GET; also provide a refresh button
7. States: loading, LINE/API error + retry, empty `0/1000`
8. Fetch on mount (auto-load)

`LineAccountList` list page: **unchanged** this round (still shows DB `_count.richMenus` only).

## Out of scope

- Bulk delete / delete-all loops
- Separate dry-run API (confirm modal is enough)
- Auto-delete when deploying at limit
- Showing LINE count on the accounts list page
- Deleting menus created only in OA Manager (API cannot see them)

## Files

- `lib/line/client.ts` — add `getRichMenus`
- `app/api/line-accounts/[id]/line-rich-menus/route.ts` — GET
- `app/api/line-accounts/[id]/line-rich-menus/[lineRichMenuId]/route.ts` — DELETE
- `app/(app)/line-accounts/[id]/LineRichMenusOnLine.tsx` — client panel
- `app/(app)/line-accounts/[id]/page.tsx` — mount panel + pass `lineAccountId` / `systemAdmin`

## Safety

- Never loop-delete the full list
- Confirm before each delete
- Rate limits (informational): list 10 req/s; create/delete 100 req/hour — detail page is one list call per visit
