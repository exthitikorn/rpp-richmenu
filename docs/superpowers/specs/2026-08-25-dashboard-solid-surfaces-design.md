# Dashboard Solid Surfaces

Date: 2026-08-25  
Status: approved (user: solid white + clear borders, full page incl. header, approach 1)

## Goal

Stop dashboard cards/header from looking transparent / same as page background. Keep existing layout and data; visual surface only.

## Changes

1. **Header** — `PageHeader` `variant="default"` (no hero gradient box).
2. **Cards** — replace `bg-gradient-*` / `via-background` / soft tinted borders with `border border-default-200 shadow-none` (match list pages).
3. **KPI** — solid card + keep thin top accent bar and colored value text.
4. **Attention** — solid cards; status via border/text color (warning/danger), not translucent fills.
5. **Analytics / heatmap / footer** — same solid border treatment in `page.tsx` and `RichMenuAnalyticsSection.tsx`.

## Out of scope

- Layout/section order, range logic, spacing densify, new components

## Files

- `app/(app)/dashboard/page.tsx`
- `app/(app)/dashboard/RichMenuAnalyticsSection.tsx`
