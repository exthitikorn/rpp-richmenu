# Navbar Primary Text Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply HeroUI `primary` text color to navbar brand and profile labels.

**Architecture:** Class-only change in `components/navbar.tsx`. Reuse existing `primary` / `primary/70` Tailwind tokens from `hero.ts`. No theme or layout changes.

**Tech Stack:** Next.js App Router, HeroUI Navbar, Tailwind CSS v4

## Global Constraints

- Touch only `components/navbar.tsx` for the visual change
- Do not change navbar background, border, Avatar, dropdown, or hamburger
- Do not sync `AppNavContent` drawer brand this round
- Spec: `docs/superpowers/specs/2026-08-25-navbar-primary-text-design.md`

---

### Task 1: Apply primary text classes on navbar

**Files:**
- Modify: `components/navbar.tsx`

**Interfaces:**
- Consumes: existing `siteConfig` / session fields already rendered
- Produces: same JSX structure; updated Tailwind classes only

- [x] **Step 1: Update brand + profile text classes**

Hospital name:

```tsx
<p className="truncate text-xs font-medium text-primary">
```

System name:

```tsx
<p className="truncate text-sm font-semibold leading-tight text-primary">
```

Profile wrapper + name:

```tsx
<span className="flex items-center gap-2 text-left text-primary">
...
<span className="block truncate text-sm font-medium leading-tight">
  {profileLabel}
</span>
<span className="mt-0.5 block truncate text-xs font-normal text-primary/70">
  {department} · {roleLabel}
</span>
```

- [x] **Step 2: Visual check**

Open any authenticated page; confirm brand + profile name are hospital green (`#1B5E4B`), department/role slightly lighter, bar still white.

- [ ] **Step 3: Commit** (only if user asks)

```bash
git add components/navbar.tsx docs/superpowers/specs/2026-08-25-navbar-primary-text-design.md docs/superpowers/plans/2026-08-25-navbar-primary-text.md
git commit -m "style: use primary color for navbar brand and profile text"
```
