# Dashboard Redesign

Date: 2026-08-25  
Status: approved (user: layout C same for both roles, purpose C balanced, range default B=30d, scope C full + charts, approach 1)

## Goal

One shared `/dashboard` layout for system admin and LINE OA assignees: KPI + attention + analytics (charts + heatmap) + recent activity + top menus. Data stays scoped via existing access helpers.

## Layout (top → bottom)

1. Header + range control (`?range=`, default `30`: `1` | `7` | `30` | `all`)
2. KPI row (4): LINE accounts | deployed Rich Menus | clicks in range | unique `lineUserId` in range
3. Attention: pending users (admin only) | recent failed deploys | accounts missing a default menu
4. Analytics: existing charts + heatmap, filtered by range
5. Footer row: recent deploy activity (10) + top Rich Menus by clicks in range (5)

## Data

- Reuse `lineAccountWhere` / `richMenuWhere` / `clickEventWhere` / `deployLogWhere`
- Click queries add `createdAt: { gte }` when range ≠ `all`
- No schema changes

## Out of scope

- Separate analytics page, client-side dashboard API, realtime websocket, PDF export

## Files

- `app/(app)/dashboard/page.tsx` — main rewrite
- `app/(app)/dashboard/DashboardRangeLinks.tsx` — range links
- `lib/dashboard-range.ts` — parse range + start date (+ self-check)
