# Dashboard analytics cleanup — Design

**Date:** 2026-08-27  
**Status:** Approved

## Problem

The Rich Menu click stats block is sparse and broken: Recharts bars are oversized with sparse data, decimal axes for integer clicks, tables duplicate the charts, and grid layout leaves empty space. The attention section also surfaces pending-user approval as a dashboard card and a “missing default Rich Menu” card that the product owner does not want.

## Goals

1. Replace click charts + duplicate tables with a two-column ranking UI (progress bars).
2. Remove the redundant bottom “Top Rich Menu” card (merged into the new left column).
3. Move pending-user approval notice to a sidebar chip on “จัดการผู้ใช้” (show only when `count > 0`).
4. Delete the “บัญชียังไม่มี Rich Menu default” card and its query.
5. Remove `recharts` (sole consumer is this page).

## Non-goals

- Heat map, KPI cards, deploy activity list, pending LINE OA request card.
- New dependencies or theme redesign beyond existing primary/secondary tokens.

## UI

### Click stats

- Section header unchanged (title + period text).
- Two equal cards in `lg:grid-cols-2`:
  - **คลิกต่อ Rich Menu** — rank, linked name, LINE account, count, share %, progress bar (relative to top item).
  - **Top ปุ่ม** — rank, `เมนู {name} ปุ่ม #{n}`, count, progress bar.
- Pattern matches the former Top Rich Menu list styling.
- Heat map stays below.

### Attention section

- Remove pending-users card.
- Remove missing-default card + `accountsMissingDefault` query.
- Keep pending LINE OA requests + failed deploys; hide whole section when empty.

### Sidebar

- On `จัดการผู้ใช้` nav item (system admin only): warning Chip with pending count when `> 0`.
- Same in mobile drawer (`AppNavContent`).
- Count via lightweight admin-only API.

## Technical notes

- Rewrite `AnalyticsCharts.tsx` as ranking lists (keep or rename export used by `page.tsx`).
- `GET /api/users/pending-count` → `{ success, data: { count } }`, `requireSystemAdmin`.
- Client fetch in `AppNavContent` when `systemAdmin`.
- Drop pending-user list query from dashboard; drop `recharts` from `package.json`.
