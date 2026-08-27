# Navbar Primary Text

Date: 2026-08-25  
Status: approved (user: approach A + profile; design OK)

## Goal

Make top navbar brand and profile labels use the hospital primary green (`#1B5E4B` / HeroUI `primary`) without changing the white bar layout.

## Changes

File: `components/navbar.tsx` only.

| Element | Class change |
|---|---|
| Hospital name | `text-default-500` → `text-primary` |
| System name | (default) → `text-primary` |
| Profile name | inherit / `text-default-700` → `text-primary` |
| Department · role | `text-default-500` → `text-primary/70` |

## Out of scope

- Navbar background / border
- Avatar, dropdown items, hamburger button
- `AppNavContent` drawer brand (`showBrand`) — not synced this round

## Approach

Class-only Tailwind tokens already wired via `hero.ts` primary palette. No new colors or theme config.
