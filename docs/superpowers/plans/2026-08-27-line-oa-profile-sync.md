# LINE OA Profile Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync LINE OA `displayName` + `pictureUrl` into `LineAccount`, drop manual name fields, show avatars on list + detail.

**Architecture:** `GET /v2/bot/info` via `getBotInfo` in `lib/line/client.ts`; map with `botInfoToProfile`; call on create/request/approve (hard fail) and detail page load (best-effort). Store URL only on `LineAccount.pictureUrl`.

**Tech Stack:** Next.js App Router, Prisma/MySQL, HeroUI Avatar, existing `lineFetch` + `encryptSecret`/`decryptSecret`

## Global Constraints

- URL storage only — never download profile images
- No list-page sync (N+1)
- No avatar outside list + detail
- No commits unless the user asks
- Thai error: `ไม่สามารถดึงข้อมูลโปรไฟล์จาก LINE ได้`

## File map

| File | Role |
|---|---|
| `prisma/schema.prisma` + migration | `pictureUrl` |
| `lib/line/client.ts` | `getBotInfo` |
| `lib/line/bot-profile.ts` + `.selfcheck.ts` | map bot info → `{ name, pictureUrl }` |
| API create / request / approve / PATCH | wire profile; drop `name` input |
| `line-accounts/[id]/page.tsx` | best-effort sync + avatar |
| Forms + `LineAccountList` + `line-account-select` | UI |

---

### Task 1: Schema + bot profile helpers

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260827140000_line_account_picture_url/migration.sql`
- Modify: `lib/line/client.ts`
- Create: `lib/line/bot-profile.ts`, `lib/line/bot-profile.selfcheck.ts`
- Modify: `lib/line-account-select.ts`

- [x] **Step 1:** Add `pictureUrl String? @db.Text` on `LineAccount`; migration `ALTER TABLE LineAccount ADD COLUMN pictureUrl TEXT NULL;`
- [x] **Step 2:** `getBotInfo(accessToken)` → `{ displayName, pictureUrl? }`; throw on non-OK or empty displayName
- [x] **Step 3:** `botInfoToProfile` maps to `{ name: string; pictureUrl: string | null }`; selfcheck for optional URL → null and trim
- [x] **Step 4:** Add `pictureUrl: true` to `lineAccountPublicSelect`
- [x] **Step 5:** `npx prisma generate` (+ migrate deploy/dev as available)

### Task 2: API routes

**Files:**
- Modify: `app/api/line-accounts/route.ts`, `app/api/line-accounts/[id]/route.ts`
- Modify: `app/api/line-account-requests/route.ts`, `app/api/line-account-requests/[id]/approve/route.ts`

- [x] **Step 1:** POST create — body without `name`; after verify, `getBotInfo` + create with profile
- [x] **Step 2:** POST request — same; store request `name` from profile
- [x] **Step 3:** Approve — fresh `getBotInfo`; create `LineAccount` with profile
- [x] **Step 4:** PATCH — remove `name`; credentials-only update

### Task 3: UI + detail sync

**Files:**
- Modify: forms, `LineAccountList.tsx`, `[id]/page.tsx`, optionally `components/page-header.tsx`

- [x] **Step 1:** Remove name inputs from create / request / edit; note that name/picture come from LINE
- [x] **Step 2:** List Avatar with `pictureUrl` / name fallback
- [x] **Step 3:** Detail: decrypt token, best-effort sync, show Avatar + title
- [x] **Step 4:** Run selfcheck + lint touched files

**Manual smoke:** create → list avatar; open detail after LINE rename → updated; OA without pic → fallback; request+approve without typing name.
