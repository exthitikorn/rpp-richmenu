# Flex help copy — design

**Date:** 2026-08-27  
**Scope:** Copy-only change in keyword Flex builder help box.

## Problem

Help text under «ข้อความสำรอง» is long and hard to scan:

> ออกแบบ Flex ที่ Flex Message Simulator แล้ววาง JSON ในคอลัมน์กลาง — ตัวอย่างอัปเดตอัตโนมัติ

## Decision

Numbered steps (ordered list) + keep Simulator link.

1. ออกแบบที่ [Flex Message Simulator]
2. วาง JSON ตรงกลาง
3. ตัวอย่างอัปเดตเอง

## UI

- File: `app/(app)/line-accounts/[id]/auto-response/builder/KeywordRuleBuilder.tsx`
- Gray callout as `<ol>` with decimal markers; `Link` (`isExternal`, `showAnchorIcon`, same URL)
- Remove redundant Textarea `description` («วางแล้วรอสักครู่ — preview ทางขวาจะอัปเดตเอง»)

## Out of scope

Layout, placement, JSON editor behavior, preview logic.
