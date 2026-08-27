# Dashboard analytics cleanup — Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Ranking-based click stats, sidebar pending-user chip, remove unwanted attention cards and recharts.

**Architecture:** Replace Recharts UI with CSS progress ranking lists; expose pending user count via small admin API for `AppNavContent`.

**Tech Stack:** Next.js App Router, HeroUI Chip, Prisma, existing dashboard data shaping.

## Global Constraints

- No new dependencies; remove `recharts`.
- Thai UI copy stays consistent with existing labels.
- Chip only when `count > 0`; system-admin nav only.
- Heat map / KPI / LINE OA pending / failed deploy unchanged in behavior.

---

### Task 1: Pending-count API + sidebar chip

**Files:**
- Create `app/api/users/pending-count/route.ts`
- Modify `components/layouts/AppNavContent.tsx`

- [x] Add GET handler: `requireSystemAdmin`, `prisma.user.count({ where: { isApproved: false } })`, JSON `{ success: true, data: { count } }`
- [x] In `AppNavContent`, when systemAdmin, fetch count on mount; show warning Chip next to users label iff `count > 0`
- [ ] Manual: as admin with pending users, chip appears on sidebar + drawer; after approving all, chip gone (refresh)

### Task 2: Ranking stats UI

**Files:**
- Rewrite `app/(app)/dashboard/AnalyticsCharts.tsx`
- Modify `app/(app)/dashboard/page.tsx`

- [x] Replace charts/tables with two ranking cards (menus | areas)
- [x] Wire page props; remove nested Card wrapping if redundant; remove Top Rich Menu card; make deploy section full width
- [x] Remove pending-users card, `pendingSummary` query, missing-default card + query; fix `hasAttention`

### Task 3: Remove recharts

**Files:**
- `package.json` / lockfile via `npm uninstall recharts`

- [x] Uninstall; confirm no remaining imports
- [ ] Spot-check dashboard + sidebar in browser
