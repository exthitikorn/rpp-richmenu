# Auth Info Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a left-hand description card (title, intro, checklist) beside the auth form on `/login` and `/pending-approval`, keeping the existing light background and login behavior.

**Architecture:** Extend `AuthCard` with an optional `aside` slot and a responsive 2-column grid. New `AuthInfoPanel` holds the shared copy and checkmark list. Both auth callers pass the same panel.

**Tech Stack:** Next.js App Router, React 18, HeroUI v2, Tailwind CSS v4, existing `siteConfig` colors/text.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-27-auth-info-panel-design.md`
- Keep light auth background and Navbar; do not use dark-green full-page background from the reference
- Same info copy on login and pending-approval
- Do not change LDAP / LINE login logic
- No new dependencies; use inline SVG for check / header icons
- Project has no test suite — verify visually in browser (`npm run dev`)

## File Structure

| File | Role |
|---|---|
| `components/layouts/AuthInfoPanel.tsx` | Presentational left card content |
| `components/layouts/AuthCard.tsx` | Layout: optional aside + form card grid |
| `app/(auth)/login/LoginForm.tsx` | Pass `aside={<AuthInfoPanel />}` |
| `app/(auth)/pending-approval/AwaitingApprovalMessage.tsx` | Same aside |

---

### Task 1: AuthInfoPanel

**Files:**
- Create: `components/layouts/AuthInfoPanel.tsx`

**Interfaces:**
- Consumes: `siteConfig.name`, `siteConfig.hospitalName`, `siteConfig.colors.primary` from `@/config/site`
- Produces: `export function AuthInfoPanel(): JSX.Element` — no props

- [x] **Step 1: Create AuthInfoPanel with approved copy**

```tsx
import { siteConfig } from "@/config/site";

const FEATURES = [
  "เข้าสู่ระบบด้วยบัญชีโรงพยาบาล (LDAP)",
  "จัดการ Rich Menu ของ LINE OA ที่ได้รับสิทธิ์",
  "Deploy Rich Menu ไปยัง LINE และติดตามสถานะ",
  "ดูสถิติการคลิก Rich Menu",
  "เชื่อมต่อบัญชี LINE เพื่อเข้าสู่ระบบด้วย LINE ได้ในภายหลัง",
] as const;

export function AuthInfoPanel() {
  return (
    <div className="flex h-full flex-col gap-4 p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: siteConfig.colors.primary }}
        >
          {/* simple menu / grid SVG */}
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
          </svg>
        </span>
        <h2 className="text-lg font-semibold text-primary sm:text-xl">
          {siteConfig.name}
        </h2>
      </div>
      <p className="text-sm text-default-500">
        ระบบของ{siteConfig.hospitalName} สำหรับจัดการ Rich Menu และบัญชี LINE
        Official Account ที่ได้รับมอบหมาย
      </p>
      <p className="text-sm font-semibold text-primary">คุณสามารถ:</p>
      <ul className="flex flex-col gap-3">
        {FEATURES.map((text) => (
          <li key={text} className="flex items-start gap-2 text-sm text-default-600">
            <span
              aria-hidden
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: siteConfig.colors.primary }}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [x] **Step 2: Spot-check import path**

Confirm `@/config/site` resolves (already used elsewhere). No automated test.

- [ ] **Step 3: Commit** (only if user requested commits)

```bash
git add components/layouts/AuthInfoPanel.tsx
git commit -m "feat(auth): add AuthInfoPanel for login description card"
```

---

### Task 2: AuthCard aside layout

**Files:**
- Modify: `components/layouts/AuthCard.tsx`

**Interfaces:**
- Consumes: `AuthInfoPanel` (via callers, not imported here)
- Produces: `AuthCardProps` with `aside?: ReactNode` in addition to existing `children` and `header`

- [x] **Step 1: Extend AuthCard to support optional aside + two cards**

Replace `AuthCard` body so that:
- Outer wrapper still centers content with `min-h-[80vh]` and horizontal padding
- When `aside` is set: `grid grid-cols-1 gap-4 md:grid-cols-2` with `w-full max-w-5xl` (or similar)
- Left cell: bordered rounded card wrapping `{aside}`
- Right cell: existing form card (header + children), keep current padding / safe-area
- When `aside` is unset: keep current single-card `max-w-lg sm:max-w-xl` behavior

```tsx
import type { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
  header?: ReactNode;
  aside?: ReactNode;
}

export function AuthCard({ children, header, aside }: AuthCardProps) {
  const formCard = (
    <div className="w-full rounded-xl border border-default-200 bg-content1 shadow-sm">
      {header ? (
        <div className="flex flex-col items-center gap-1 px-4 pb-0 pt-6 sm:px-8 sm:pt-8 md:px-12 lg:px-16">
          {header}
        </div>
      ) : null}
      <div
        className="px-4 pt-6 sm:px-8 md:px-12 lg:px-16"
        style={{
          paddingBottom:
            "max(1.5rem, calc(1rem + env(safe-area-inset-bottom, 0px)))",
        }}
      >
        {children}
      </div>
    </div>
  );

  if (!aside) {
    return (
      <div className="flex min-h-[80vh] w-full items-center justify-center px-4 py-6">
        <div className="w-full max-w-lg sm:max-w-xl">{formCard}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center px-4 py-6">
      <div className="grid w-full max-w-5xl grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-default-200 bg-content1 shadow-sm">
          {aside}
        </div>
        {formCard}
      </div>
    </div>
  );
}
```

- [x] **Step 2: Manual check**

Open any page that still uses `AuthCard` without aside (if none, skip). Ensure TypeScript accepts optional `aside`.

- [ ] **Step 3: Commit** (only if user requested)

```bash
git add components/layouts/AuthCard.tsx
git commit -m "feat(auth): support optional aside panel in AuthCard"
```

---

### Task 3: Wire login + pending-approval

**Files:**
- Modify: `app/(auth)/login/LoginForm.tsx`
- Modify: `app/(auth)/pending-approval/AwaitingApprovalMessage.tsx`

**Interfaces:**
- Consumes: `AuthInfoPanel` from `@/components/layouts/AuthInfoPanel`
- Produces: both pages render two-column auth layout

- [x] **Step 1: LoginForm — import and pass aside**

Add:

```tsx
import { AuthInfoPanel } from "@/components/layouts/AuthInfoPanel";
```

On `<AuthCard>`:

```tsx
<AuthCard
  aside={<AuthInfoPanel />}
  header={/* unchanged */}
>
```

- [x] **Step 2: AwaitingApprovalMessage — same aside**

```tsx
import { AuthInfoPanel } from "@/components/layouts/AuthInfoPanel";

<AuthCard
  aside={<AuthInfoPanel />}
  header={/* unchanged */}
>
```

- [ ] **Step 3: Visual verify**

Run: `npm run dev`  
Open: `http://localhost:3000/login`  
Expected: left info card + right login form on desktop; stacked on narrow viewport; LDAP/LINE still work.  
Open: `/pending-approval` (when applicable) — same left panel, form card unchanged.

- [ ] **Step 4: Commit** (only if user requested)

```bash
git add app/(auth)/login/LoginForm.tsx app/(auth)/pending-approval/AwaitingApprovalMessage.tsx
git commit -m "feat(auth): show info panel on login and pending-approval"
```

---

## Spec coverage (self-review)

| Spec item | Task |
|---|---|
| Two-column layout, light bg | Task 2 |
| Info panel copy + checklist | Task 1 |
| Same panel on both auth pages | Task 3 |
| No dark-green bg / no Navbar change / no auth logic change | All tasks respect |

No placeholders. `AuthCardProps.aside` naming consistent across tasks.
