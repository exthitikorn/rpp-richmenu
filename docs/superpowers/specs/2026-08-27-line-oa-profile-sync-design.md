# LINE OA Profile Sync — Design Spec

**Date:** 2026-08-27  
**Status:** Implemented  
**Approach:** Store `pictureUrl` URL only; sync `name` + picture from Messaging API `GET /v2/bot/info` (Approach A)

## Problem

LINE Official Accounts in this app are labeled with a manually typed `name`. That name can drift from the real OA display name, and the UI has no profile image even though LINE already exposes one.

## Goal

- Fetch OA **display name** and **profile picture URL** from LINE.
- Persist them on `LineAccount` (URL only — do not download the image file).
- Stop asking users to type a display name on create / request / edit.
- Show the avatar on the LINE accounts **list** and **detail** pages.
- Refresh name + picture when the detail page loads (and on create / request / approve).

## Non-Goals (v1)

- Downloading / hosting the image under `public/uploads/`
- Showing avatars in rich-menu filters, users assignment UI, or elsewhere
- A separate “Sync profile” button (detail-page load covers refresh)
- Changing the OA profile on LINE (read-only from our side)
- Storing `pictureUrl` on `LineAccountRequest` (request keeps `name` only for admin queue display)

## Decisions Log

| Topic | Decision |
|---|---|
| Storage | URL string on `LineAccount.pictureUrl` (nullable) |
| Name source | Always from LINE `displayName` — no manual name field |
| When to fetch | Create OA, submit request, approve request, open detail page |
| List page refresh | No — list shows DB values; detail visit refreshes |
| Missing picture | `pictureUrl` null; UI falls back to initials / letter avatar |
| LINE API failure on detail | Best-effort: keep existing DB values, still render page |
| LINE API failure on create/request/approve | Hard fail — cannot proceed without a display name |
| Edit form | Credentials only (secret / token); name removed |
| Existing rows | Backfill on next detail-page visit |

---

## Data Model

### `LineAccount`

Add:

| Field | Type | Notes |
|---|---|---|
| `pictureUrl` | `String?` `@db.Text` | HTTPS URL from LINE; null if OA has no profile image or never synced |

`name` stays required (`String`). It is populated from LINE `displayName`, not from user input.

### `LineAccountRequest`

No schema change. `name` remains required and is set server-side from `displayName` when the request is submitted (so pending admin cards still show a label). On approve, copy request `name` into the new `LineAccount` and set `pictureUrl` from a fresh `getBotInfo` call (or from the same fetch used during approve).

Migration: additive nullable column only.

---

## LINE API

### `GET https://api.line.me/v2/bot/info`

Auth: `Authorization: Bearer <channel access token>`

Relevant response fields:

- `displayName` (required for our flows)
- `pictureUrl` (optional — omitted when the bot has no image)

### Helper

Add `getBotInfo(accessToken)` in `lib/line/client.ts` (same `lineFetch` pattern as existing helpers).

Return type (app-level):

```ts
{ displayName: string; pictureUrl?: string }
```

Throw or return a structured error if the HTTP call fails or `displayName` is missing/empty.

Optional thin wrapper used by routes/pages:

```ts
syncLineAccountProfile(accessToken) → { name: string; pictureUrl: string | null }
```

Maps missing `pictureUrl` to `null`.

---

## Flows

### 1. Admin create — `POST /api/line-accounts`

1. Validate body: `channelId`, `channelSecret`, `accessToken` only (no `name`).
2. `verifyLineCredentials` (unchanged).
3. `getBotInfo(accessToken)` → hard fail with Thai error if this fails.
4. Create `LineAccount` with `name = displayName`, `pictureUrl = pictureUrl ?? null`, encrypted secrets.

### 2. User request — `POST /api/line-account-requests`

1. Same credential fields only.
2. Verify credentials.
3. `getBotInfo` → hard fail if unavailable.
4. Create `LineAccountRequest` with `name = displayName` (no picture column).

### 3. Admin approve — `POST /api/line-account-requests/[id]/approve`

1. Decrypt + re-verify credentials (unchanged).
2. `getBotInfo` → hard fail if unavailable (prefer fresh profile over stale request `name`).
3. Create `LineAccount` with synced `name` + `pictureUrl`; keep request row `name` as historically submitted (or update to match — either is fine; prefer overwrite request `name` only if already updating the row for other reasons; **default: use fresh bot info for the new `LineAccount` only**).

### 4. Detail page — `GET` `/line-accounts/[id]` (server component)

After loading the account (access-scoped):

1. Decrypt `accessToken`.
2. Call `getBotInfo` best-effort.
3. On success, if `name` or `pictureUrl` changed, `prisma.lineAccount.update`.
4. Render with the post-sync values.
5. On failure, skip update; render existing DB values (no error page).

Do **not** sync on the list page (avoids N LINE calls per list load).

### 5. Edit — `PATCH /api/line-accounts/[id]`

Remove `name` from the PATCH schema and edit modal. Optional: after a successful credential update that includes a new `accessToken`, call `getBotInfo` once and refresh profile (nice-to-have; not required if detail visit will refresh soon). **v1: skip** — detail page covers it.

---

## UI

### Forms

- `CreateLineAccountForm` / `RequestLineAccountForm` / `EditLineAccountButton`: remove the name input.
- Copy/help text may note that name and picture come from LINE automatically.

### List (`LineAccountList`)

- Card + table rows: small Avatar (HeroUI) using `pictureUrl`, fallback to first character of `name`.
- Select/include `pictureUrl` wherever list data is queried.

### Detail (`/line-accounts/[id]`)

- Show Avatar next to / above `PageHeader` title (or as part of the header area), using synced `pictureUrl`.
- Title remains `account.name` after sync.

### Elsewhere

No avatar changes (filters, users table, etc.).

---

## Error Handling

| Context | Behavior |
|---|---|
| Create / request / approve + bot info fails | `400` with clear message (e.g. ไม่สามารถดึงข้อมูลโปรไฟล์จาก LINE ได้) |
| Detail sync fails | Silent skip; page still loads |
| Empty `displayName` | Treat as failure (same as bot info fail) |
| No `pictureUrl` in LINE response | Store `null`; UI uses fallback avatar |

---

## Testing / Checks

No project test suite. Add a small runnable self-check next to the helper if non-trivial mapping exists (e.g. `pictureUrl` optional → `null`), following the existing `*.selfcheck.ts` pattern. Trivial pass-through needs no check.

Manual smoke:

1. Create OA → name + avatar appear on list.
2. Change OA profile on LINE OA Manager → open detail → list refresh shows new values.
3. OA without picture → fallback avatar, name still correct.
4. Request + approve path populates name without user typing it.

---

## Implementation Touchpoints (expected)

- `prisma/schema.prisma` + migration
- `lib/line/client.ts` — `getBotInfo`
- Create / request / approve API routes
- Detail page server load (decrypt + sync)
- `CreateLineAccountForm`, `RequestLineAccountForm`, `EditLineAccountButton`, `LineAccountList`, detail header
- List/select helpers that expose public `LineAccount` fields (`lib/line-account-select.ts` if used)

---

## Open Questions

None — resolved in Decisions Log.
