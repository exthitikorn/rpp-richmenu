# P0 PM2 Production Hardening Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox syntax.

**Goal:** Make deploy + default-sync safe for hospital PM2 + sticky disk (no orphan LINE menus, no clear-before-set gap, unique channelId).

**Architecture:** Validate/read image before `createRichMenu`; cleanup orphan on any post-create failure; commit DB before audience sync; `setDefault` before follower refresh (drop pre-clear); Prisma `@unique` on `channelId`.

**Tech Stack:** Next.js route handlers, Prisma migrate, existing `lib/line/*`, assert self-checks (no Jest).

**Global Constraints:** Fewest files; reuse `deleteRichMenu`; Thai error messages; truncate deploy log to 191 bytes; do not add S3/blob.

---

## File map

| File | Change |
|------|--------|
| `lib/line/sync-default-rich-menu.ts` | setDefault first; no clearDefault before set; follower refresh after |
| `app/api/rich-menus/[id]/deploy/route.ts` | preflight image; orphan cleanup; DB then sync |
| `app/api/rich-menus/[id]/set-default/route.ts` | DB after sync still OK if sync no longer clears first |
| `prisma/schema.prisma` | `channelId String @unique` |
| `prisma/migrations/..._channel_id_unique/` | migration SQL |
| `lib/line/sync-default-rich-menu.selfcheck.ts` or inline | assert order helper / hint still ok |
| `docs/project-review.md` | mark P0 done (light) |

---

### Task 1: Safer syncDefaultRichMenu

- [x] Change order to: `setDefaultRichMenu` → follower unlink/link (best-effort) → extra userIds
- [x] Remove `clearDefaultRichMenu` before set (eliminates no-default window)
- [x] Keep follower/extra failures non-fatal
- [x] Self-check `lib/line/sync-default-rich-menu.selfcheck.ts`

### Task 2: Deploy orphan cleanup + DB-before-sync

- [x] Preflight: image path + `readLocalUploadImage` **before** `createRichMenu`
- [x] Track `createdLineRichMenuId`; on failure after create (pre-DB), `deleteRichMenu`
- [x] After alias: Prisma transaction then sync; sync fail → success + hint
- [x] set-default: same DB-then-sync pattern

### Task 3: channelId @unique

- [x] Add `@unique` to schema
- [x] Migration + dedupe SQL
- [x] webhook/redirect `findUnique`; create API P2002 → 409

### Task 4: Verify

- [x] Run self-checks / `npm run check:security` / `prisma generate`
- [x] Update project-review P0 checkmarks
- [ ] On hospital host: `npx prisma migrate deploy`
