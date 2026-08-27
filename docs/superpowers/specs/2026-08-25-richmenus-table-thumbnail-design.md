# Rich Menus Table — Thumbnail Column

Date: 2026-08-25  
Status: approved

## Goal

Show each Rich Menu’s image as a small thumbnail in the list so users can recognize menus at a glance, with click-to-enlarge.

## Scope

- `app/(app)/rich-menus/RichMenusTable.tsx` only

Out of scope: schema changes, query changes on `page.tsx` (`imageUrl` already on `RichMenu`), new libraries, edit/import pages.

## UX

### Desktop table

- New leftmost column (header empty or “รูป”)
- Thumb ~48px wide, height from menu `width`/`height` aspect ratio, `object-contain`, light border + small radius
- Click opens enlarge modal

### Mobile card

- Image banner on top of card, full card width, max height ~140px, `object-contain`
- Click opens the same enlarge modal

### Enlarge modal

- HeroUI `Modal` (existing pattern in this file)
- Title = Rich Menu name
- Image `object-contain`, max width ~min(90vw, 720px)
- Close via footer button / backdrop / Esc

## Approach

Shared preview state at `RichMenusTable` level (one modal), not one modal per row. Thumbnails use `next/image` with local `/uploads/...` URLs (same as dashboard/preview).

## Files touched

1. `RichMenusTable.tsx` — thumbnail cell, card banner, shared preview modal
