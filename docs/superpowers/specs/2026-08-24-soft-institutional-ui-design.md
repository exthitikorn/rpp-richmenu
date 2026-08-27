# Soft Institutional UI Consistency Design

## Summary

Deep visual pass across the real product surfaces so every screen feels like one system. Keep the existing hospital brand colors and Noto Sans Thai. Soft institutional tone. Token-first approach: define shared visual language once, then apply it through shell, page chrome, list/table patterns, and empty/loading/error states. Do not change interaction flows. Desktop is the priority; no dedicated mobile polish. Also delete leftover `organizations` UI/API now that LineOA-centric access is the real model.

## Goals

- Open any in-scope page and immediately feel the same visual system (consistency first).
- Keep brand colors: primary `#1B5E4B`, secondary `#C9A227`.
- Soft institutional atmosphere: lightly warm background, restrained green/gold accents, calm hierarchy.
- Keep Noto Sans Thai; unify size/weight/hierarchy only.
- Cover auth, app shell, operational pages, and rich menu editor chrome.
- Remove dead `organizations` pages, APIs, and unused labels.

## Non-Goals

- No interaction/flow redesign (import, deploy, area editing, assignment logic stay as-is).
- No permission-model changes beyond deleting obsolete organization surfaces.
- No mobile-first work (drawer/touch-target campaigns out of scope).
- No font family change.
- No dark mode, purple themes, glow effects, or brand palette replacement.
- No new UI dependencies; stay on current HeroUI v2 + next/font.

## Approach

**Token-first**

1. Tighten design tokens (HeroUI theme + globals + typography scale).
2. Strengthen shared layout/components (`PageShell`, `PageHeader`, list/table chrome, state components).
3. Sweep in-scope pages to consume those shared pieces.
4. Delete organizations leftovers.

## Visual Foundations

### Color

- Keep existing `hero.ts` primary/secondary scales.
- Background: slightly warm off-white (not pure stark white); use existing HeroUI `background`/`content` tokens where possible, tune only if needed for soft institutional feel.
- Primary: actions, active nav, key emphasis.
- Secondary/gold: sparse accent only (badges, subtle highlights) — never dominant fills.
- Borders: soft `default-200` family; shadows light and rare.

### Typography

- Family: keep `Noto Sans Thai` via `config/fonts.ts`.
- Define a small shared hierarchy used everywhere:
  - Page title: existing `PageHeader` scale (`text-xl` / `sm:text-2xl`, semibold)
  - Section title: `text-sm` semibold
  - Body: default
  - Meta/help: `text-sm` or `text-xs` `text-default-500`
- Avoid one-off title sizes per page.

### Spacing / shape

- `PageShell`: single vertical rhythm (`space-y-6` or equivalent tokenized gap).
- Soft radius consistent with HeroUI defaults; avoid mixing heavy `rounded-2xl` hero treatments with flat pages inconsistently.
- `PageHeader` hero variant: use only on dashboard. Elsewhere use default header. Hero style itself stays one restrained soft treatment (no competing blobs).

## Shell and Page Chrome

### App shell

- Keep current IA: navbar + sidebar + existing mobile drawer (no mobile polish pass).
- Unify nav active/hover styles and sidebar/navbar surfaces to soft institutional tokens.
- Footer stays minimal and matches shell borders/text meta style.

### Shared page chrome

- Every app page uses `PageShell` + `PageHeader`.
- Actions live in `PageHeader` actions slot when possible.
- Auth layouts (`login`, `pending-approval`) use the same color/type/radius language via existing `AuthLayout` / `AuthCard`, restyled to match tokens — still a single calm composition, not a dashboard clone.

## Content Patterns

### List / table pages

In scope: dashboard supporting blocks, LINE OA, rich menus, users, deploy logs, profile.

- Shared pattern: page chrome → optional toolbar → table/list container → empty/loading as needed.
- Prefer one table/list container pattern (extend `DataTableCard` or equivalent) over ad-hoc Card wrappers.
- Cards only when they wrap a real interactive unit; do not double-wrap table + outer decorative cards.
- Desktop density: readable soft spacing, not sparse marketing whitespace.

### Rich menu editor / preview

- No changes to drawing, action editing, deploy, or preview behavior.
- Align surrounding chrome only: panels, form spacing, frames, buttons to shared tokens.

### Shared states

Introduce or consolidate reusable components (names indicative):

- `EmptyState` — title, short description, optional action
- `LoadingState` — consistent spinner/skeleton treatment
- `ErrorState` — consistent error copy container

Route `loading.tsx` files and inline empty branches should use these instead of one-off markup.

## Organizations Cleanup

Delete leftover organization surfaces that no longer match the schema/access model:

- `app/(app)/organizations/**`
- `app/api/organizations/**`
- Unused `siteConfig.labels.organizations` (and any stale docs/nav references in product code)

Do not revive Organization/Membership models. LineOA assignment remains the access boundary.

Out of scope for this cleanup: rewriting historical design docs that mention organizations unless they block implementation.

## In-Scope Surfaces

| Area | Work |
|---|---|
| Tokens / theme / globals / fonts hierarchy | Yes |
| App shell (navbar, sidebar, footer) | Yes (desktop-first) |
| Auth (login, pending-approval) | Yes |
| Dashboard, LINE OA, rich menus, users, deploy logs, profile, import | Yes |
| Rich menu editor chrome | Yes |
| Organizations leftovers | Delete |
| Mobile UX pass | No |
| Flow/feature changes | No |

## Success Criteria

- Sampling any in-scope page feels like the same product (spacing, type hierarchy, color usage, state treatments).
- Brand green/gold still recognizable; gold remains accent-only.
- Noto Sans Thai unchanged as family.
- Organizations routes/APIs gone; no dead nav/label pointing at them.
- Existing workflows still work without retraining users.

## Implementation Notes (for planning)

- Prefer editing shared components and tokens before mass page churn.
- Reuse HeroUI v2 primitives already in the repo; do not migrate to HeroUI v3.
- Keep diffs boring: visual consistency over new abstractions. Add a shared state component only when it removes repeated markup.
- Verify desktop visually on key pages after token changes; skip a dedicated mobile QA pass.
