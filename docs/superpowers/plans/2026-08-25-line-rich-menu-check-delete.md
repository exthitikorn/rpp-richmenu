# LINE Rich Menu Check & Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On `/line-accounts/[id]`, show Messaging API rich menu usage as `count/1000` and let system admins delete individual LINE-side menus while unlinking matching DB rows.

**Architecture:** Client panel fetches `GET /api/line-accounts/[id]/line-rich-menus` on mount. Delete goes through `DELETE .../line-rich-menus/[lineRichMenuId]` (system admin). LINE list/delete live in `lib/line/client.ts`; count/badge helpers are pure functions with a self-check.

**Tech Stack:** Next.js App Router, Prisma, existing `lib/line/client.ts`, HeroUI (Card, Button, Chip, Modal, Table), TypeScript.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-25-line-rich-menu-check-delete-design.md`
- Reference notes: `docs/line-rich-menu-check-delete.md`
- Max rich menus via Messaging API: `1000` per OA
- View: anyone with detail access (`lineAccountByIdWhere` / `requireLineAccountAccess`)
- Delete: system admin only (`requireSystemAdmin` + account access)
- Delete sync: clear `lineRichMenuId`, set `status = DRAFT`, `isDefault = false` — do not delete DB record
- Single-delete only; confirm modal; no bulk delete
- `LineAccountList` unchanged
- No new dependencies
- This repo has no test suite — verify with `npx tsx <selfcheck>.ts` + `npm run lint`
- Do not commit unless the user explicitly asks

---

## File map

| File | Responsibility |
|---|---|
| `lib/line/rich-menu-limit.ts` | `LINE_RICH_MENU_MAX`, `summarizeRichMenuLimit`, `badgeToneForRemaining` |
| `lib/line/rich-menu-limit.selfcheck.ts` | Assert limit math + badge tones |
| `lib/line/client.ts` | Add `getRichMenus` |
| `app/api/line-accounts/[id]/line-rich-menus/route.ts` | GET list + count + DB link map |
| `app/api/line-accounts/[id]/line-rich-menus/[lineRichMenuId]/route.ts` | DELETE on LINE + DB unlink |
| `app/(app)/line-accounts/[id]/LineRichMenusOnLine.tsx` | Client UI panel |
| `app/(app)/line-accounts/[id]/page.tsx` | Mount panel with `lineAccountId` + `systemAdmin` |

---

### Task 1: Limit helpers + LINE `getRichMenus`

**Files:**
- Create: `lib/line/rich-menu-limit.ts`
- Create: `lib/line/rich-menu-limit.selfcheck.ts`
- Modify: `lib/line/client.ts` (append after existing helpers; reuse `lineFetch`)

**Interfaces:**
- Consumes: `lineFetch` pattern in `lib/line/client.ts`
- Produces:
  - `LINE_RICH_MENU_MAX = 1000`
  - `summarizeRichMenuLimit(count: number): { count: number; max: number; remaining: number }`
  - `badgeToneForRemaining(remaining: number, count: number): "default" | "warning" | "danger"`
  - `getRichMenus(accessToken: string): Promise<LineListedRichMenu[]>`

- [ ] **Step 1: Write `lib/line/rich-menu-limit.ts`**

```ts
export const LINE_RICH_MENU_MAX = 1000;

export function summarizeRichMenuLimit(count: number) {
  const safe = Math.max(0, count);

  return {
    count: safe,
    max: LINE_RICH_MENU_MAX,
    remaining: Math.max(0, LINE_RICH_MENU_MAX - safe),
  };
}

/** Spec: default if remaining > 50; warning if remaining ≤ 50; danger if count >= 1000 */
export function badgeToneForRemaining(
  remaining: number,
  count: number,
): "default" | "warning" | "danger" {
  if (count >= LINE_RICH_MENU_MAX) return "danger";
  if (remaining <= 50) return "warning";

  return "default";
}
```

- [ ] **Step 2: Write self-check**

Create `lib/line/rich-menu-limit.selfcheck.ts`:

```ts
import assert from "node:assert/strict";

import {
  LINE_RICH_MENU_MAX,
  badgeToneForRemaining,
  summarizeRichMenuLimit,
} from "./rich-menu-limit";

assert.equal(LINE_RICH_MENU_MAX, 1000);

const mid = summarizeRichMenuLimit(25);
assert.equal(mid.count, 25);
assert.equal(mid.max, 1000);
assert.equal(mid.remaining, 975);
assert.equal(badgeToneForRemaining(mid.remaining, mid.count), "default");

const warn = summarizeRichMenuLimit(950);
assert.equal(warn.remaining, 50);
assert.equal(badgeToneForRemaining(warn.remaining, warn.count), "warning");

const full = summarizeRichMenuLimit(1000);
assert.equal(full.remaining, 0);
assert.equal(badgeToneForRemaining(full.remaining, full.count), "danger");

assert.equal(summarizeRichMenuLimit(-3).count, 0);
assert.equal(summarizeRichMenuLimit(-3).remaining, 1000);

console.log("rich-menu-limit self-check ok");
```

- [ ] **Step 3: Run self-check**

Run: `npx tsx lib/line/rich-menu-limit.selfcheck.ts`  
Expected: prints `rich-menu-limit self-check ok` and exit 0

- [ ] **Step 4: Add `getRichMenus` to `lib/line/client.ts`**

Add this type + function near the other rich-menu helpers (before or after `deleteRichMenu`):

```ts
export type LineListedRichMenu = {
  richMenuId: string;
  name: string;
  chatBarText: string;
  selected: boolean;
  size: { width: number; height: number };
};

export async function getRichMenus(
  accessToken: string,
): Promise<LineListedRichMenu[]> {
  const res = await lineFetch("/richmenu/list", accessToken, {
    method: "GET",
  });

  if (!res.ok) {
    const err = await res.text();

    throw new Error(`LINE API getRichMenus: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { richmenus?: LineListedRichMenu[] };

  return data.richmenus ?? [];
}
```

- [ ] **Step 5: Lint touched files**

Run: `npx eslint lib/line/rich-menu-limit.ts lib/line/rich-menu-limit.selfcheck.ts lib/line/client.ts`  
Expected: no errors

---

### Task 2: GET `/api/line-accounts/[id]/line-rich-menus`

**Files:**
- Create: `app/api/line-accounts/[id]/line-rich-menus/route.ts`

**Interfaces:**
- Consumes: `getCurrentUser`, `lineAccountByIdWhere`, `prisma`, `getRichMenus`, `summarizeRichMenuLimit`
- Produces: JSON `{ count, max, remaining, richMenus: [...] }` as in the spec

- [ ] **Step 1: Create the GET route**

```ts
import { NextResponse } from "next/server";

import { lineAccountByIdWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { getRichMenus } from "@/lib/line/client";
import { summarizeRichMenuLimit } from "@/lib/line/rich-menu-limit";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await prisma.lineAccount.findFirst({
    where: lineAccountByIdWhere(user, id),
    select: {
      id: true,
      accessToken: true,
      richMenus: {
        where: { lineRichMenuId: { not: null } },
        select: {
          id: true,
          name: true,
          status: true,
          isDefault: true,
          lineRichMenuId: true,
        },
      },
    },
  });

  if (!account) {
    return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  }

  try {
    const listed = await getRichMenus(account.accessToken);
    const byLineId = new Map(
      account.richMenus
        .filter((rm) => rm.lineRichMenuId)
        .map((rm) => [rm.lineRichMenuId as string, rm]),
    );
    const summary = summarizeRichMenuLimit(listed.length);

    return NextResponse.json({
      ...summary,
      richMenus: listed.map((menu) => {
        const linked = byLineId.get(menu.richMenuId);

        return {
          richMenuId: menu.richMenuId,
          name: menu.name,
          chatBarText: menu.chatBarText,
          selected: menu.selected,
          size: menu.size,
          ...(linked
            ? {
                linkedRichMenuId: linked.id,
                linkedName: linked.name,
                linkedStatus: linked.status,
                isDefault: linked.isDefault,
              }
            : {}),
        };
      }),
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "ดึงรายการ Rich Menu จาก LINE ไม่สำเร็จ";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
```

- [ ] **Step 2: Sanity-check route compiles**

Run: `npx tsc --noEmit --pretty false 2>&1 | Select-String -Pattern "line-rich-menus"`  
Expected: no matches for this new route (or full `npx tsc --noEmit` clean for these files)

Alternative lighter check: `npm run lint` after Task 4 if full tsc is slow.

---

### Task 3: DELETE `/api/line-accounts/[id]/line-rich-menus/[lineRichMenuId]`

**Files:**
- Create: `app/api/line-accounts/[id]/line-rich-menus/[lineRichMenuId]/route.ts`

**Interfaces:**
- Consumes: `requireSystemAdmin`, `lineAccountByIdWhere`, `deleteRichMenu`, `prisma`
- Produces: `{ success: true, unlinked: boolean }`

- [ ] **Step 1: Create the DELETE route**

```ts
import { NextResponse } from "next/server";

import { RichMenuStatus } from "@/app/generated/prisma/client";
import { lineAccountByIdWhere, requireSystemAdmin } from "@/lib/access";
import { deleteRichMenu } from "@/lib/line/client";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: Promise<{ id: string; lineRichMenuId: string }> },
) {
  const { id, lineRichMenuId } = await params;

  if (!lineRichMenuId) {
    return NextResponse.json(
      { success: false, error: "richMenuId is required" },
      { status: 400 },
    );
  }

  try {
    const user = await requireSystemAdmin();

    const account = await prisma.lineAccount.findFirst({
      where: lineAccountByIdWhere(user, id),
      select: { id: true, accessToken: true },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ" },
        { status: 404 },
      );
    }

    await deleteRichMenu(account.accessToken, lineRichMenuId);

    const updated = await prisma.richMenu.updateMany({
      where: {
        lineAccountId: account.id,
        lineRichMenuId,
      },
      data: {
        lineRichMenuId: null,
        status: RichMenuStatus.DRAFT,
        isDefault: false,
      },
    });

    return NextResponse.json({
      success: true,
      unlinked: updated.count > 0,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "ลบ Rich Menu บน LINE ไม่สำเร็จ";

    if (message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: message },
        { status: 401 },
      );
    }
    if (message === "Forbidden: system admin required") {
      return NextResponse.json(
        { success: false, error: message },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 502 },
    );
  }
}
```

- [ ] **Step 2: Confirm auth error strings match `lib/access.ts`**

`requireSystemAdmin` throws `"Unauthorized"` (via `getCurrentUser` null path inside it) or `"Forbidden: system admin required"`. Keep the catch branches exactly as above.

---

### Task 4: Client panel `LineRichMenusOnLine`

**Files:**
- Create: `app/(app)/line-accounts/[id]/LineRichMenusOnLine.tsx`

**Interfaces:**
- Consumes: GET/DELETE APIs from Tasks 2–3; `badgeToneForRemaining` from Task 1
- Produces: `<LineRichMenusOnLine lineAccountId systemAdmin />`

- [ ] **Step 1: Create the client component**

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import NextLink from "next/link";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Link } from "@heroui/link";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";

import { EmptyState } from "@/components/ui/EmptyState";
import { badgeToneForRemaining } from "@/lib/line/rich-menu-limit";

type LineRichMenuRow = {
  richMenuId: string;
  name: string;
  chatBarText: string;
  selected: boolean;
  size: { width: number; height: number };
  linkedRichMenuId?: string;
  linkedName?: string;
  linkedStatus?: "DRAFT" | "DEPLOYED";
  isDefault?: boolean;
};

type ListResponse = {
  count: number;
  max: number;
  remaining: number;
  richMenus: LineRichMenuRow[];
  error?: string;
};

export function LineRichMenusOnLine({
  lineAccountId,
  systemAdmin,
}: {
  lineAccountId: string;
  systemAdmin: boolean;
}) {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [target, setTarget] = useState<LineRichMenuRow | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/line-accounts/${lineAccountId}/line-rich-menus`,
      );
      const json = (await res.json()) as ListResponse;

      if (!res.ok) {
        setError(json.error ?? "ดึงข้อมูลจาก LINE ไม่สำเร็จ");
        setData(null);
        setLoading(false);

        return;
      }

      setData(json);
      setLoading(false);
    } catch {
      setError("เกิดข้อผิดพลาด");
      setData(null);
      setLoading(false);
    }
  }, [lineAccountId]);

  useEffect(() => {
    void load();
  }, [load]);

  function openDelete(menu: LineRichMenuRow) {
    setTarget(menu);
    setDeleteError("");
    onOpen();
  }

  async function handleDelete() {
    if (!target) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(
        `/api/line-accounts/${lineAccountId}/line-rich-menus/${encodeURIComponent(target.richMenuId)}`,
        { method: "DELETE" },
      );
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!res.ok || !json.success) {
        setDeleteError(json.error ?? "ลบไม่สำเร็จ");
        setDeleting(false);

        return;
      }

      setDeleting(false);
      onOpenChange();
      setTarget(null);
      await load();
    } catch {
      setDeleteError("เกิดข้อผิดพลาด");
      setDeleting(false);
    }
  }

  const tone = data
    ? badgeToneForRemaining(data.remaining, data.count)
    : "default";
  const chipColor =
    tone === "danger" ? "danger" : tone === "warning" ? "warning" : "default";

  return (
    <>
      <Card className="border border-default-200 shadow-none">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">Rich Menus บน LINE</span>
            {data ? (
              <Chip color={chipColor} size="sm" variant="flat">
                {data.count}/{data.max}
              </Chip>
            ) : null}
          </div>
          <Button
            isDisabled={loading}
            size="sm"
            variant="flat"
            onPress={() => void load()}
          >
            รีเฟรช
          </Button>
        </CardHeader>
        <CardBody className="gap-3">
          <p className="text-default-500 text-sm">
            นับเฉพาะ Rich Menu ที่สร้างผ่าน Messaging API (ไม่รวมที่สร้างจาก
            LINE Official Account Manager) — สูงสุด 1,000 ต่อ OA
          </p>

          {loading ? (
            <p className="text-default-500 text-sm">กำลังโหลดจาก LINE…</p>
          ) : null}

          {error ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-danger text-sm" role="alert">
                {error}
              </p>
              <Button size="sm" variant="flat" onPress={() => void load()}>
                ลองใหม่
              </Button>
            </div>
          ) : null}

          {!loading && !error && data && data.richMenus.length === 0 ? (
            <EmptyState title="ยังไม่มี Rich Menu บน LINE (0/1000)" />
          ) : null}

          {!loading && !error && data && data.richMenus.length > 0 ? (
            <div className="overflow-x-auto">
              <Table
                removeWrapper
                aria-label="Rich Menus บน LINE"
                classNames={{ base: "min-w-[640px]" }}
              >
                <TableHeader>
                  <TableColumn>ชื่อบน LINE</TableColumn>
                  <TableColumn>ขนาด</TableColumn>
                  <TableColumn>Chat bar</TableColumn>
                  <TableColumn>ในระบบ</TableColumn>
                  <TableColumn>{systemAdmin ? "จัดการ" : " "}</TableColumn>
                </TableHeader>
                <TableBody>
                  {data.richMenus.map((menu) => (
                    <TableRow key={menu.richMenuId}>
                      <TableCell>
                        <div className="font-medium">{menu.name}</div>
                        <div className="text-default-400 font-mono text-xs">
                          {menu.richMenuId}
                        </div>
                      </TableCell>
                      <TableCell>
                        {menu.size.width}×{menu.size.height}
                      </TableCell>
                      <TableCell>{menu.chatBarText || "—"}</TableCell>
                      <TableCell>
                        {menu.linkedRichMenuId ? (
                          <Link
                            as={NextLink}
                            href={`/rich-menus/${menu.linkedRichMenuId}/edit`}
                          >
                            {menu.linkedName ?? "ดูในระบบ"}
                            {menu.linkedStatus
                              ? ` (${menu.linkedStatus})`
                              : ""}
                          </Link>
                        ) : (
                          <span className="text-default-400 text-sm">
                            ไม่พบในระบบ
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {systemAdmin ? (
                          <Button
                            color="danger"
                            size="sm"
                            variant="light"
                            onPress={() => openDelete(menu)}
                          >
                            ลบ
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>ลบ Rich Menu บน LINE</ModalHeader>
          <ModalBody>
            {deleteError ? (
              <p className="text-danger text-sm" role="alert">
                {deleteError}
              </p>
            ) : null}
            {target ? (
              <>
                <p>
                  ลบ{" "}
                  <span className="font-semibold">{target.name}</span> (
                  <span className="font-mono text-sm">{target.richMenuId}</span>
                  ) จาก LINE?
                </p>
                {target.linkedRichMenuId ? (
                  <p className="text-default-500 text-sm">
                    เมนูนี้ผูกกับรายการในระบบ — การลบจะยกเลิกการผูก
                    (สถานะกลับเป็น DRAFT) แต่จะไม่ลบ record ในระบบ
                  </p>
                ) : null}
              </>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="light"
              onPress={() => onOpenChange()}
            >
              ยกเลิก
            </Button>
            <Button
              color="danger"
              isLoading={deleting}
              onPress={() => void handleDelete()}
            >
              ลบ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
```

- [ ] **Step 2: Lint the component**

Run: `npx eslint "app/(app)/line-accounts/[id]/LineRichMenusOnLine.tsx"`  
Expected: no errors

---

### Task 5: Mount panel on detail page

**Files:**
- Modify: `app/(app)/line-accounts/[id]/page.tsx`

**Interfaces:**
- Consumes: `LineRichMenusOnLine` from Task 4; `user.isSystemAdmin`
- Produces: detail page with DB card then LINE card

- [ ] **Step 1: Update the page**

Add import:

```tsx
import { LineRichMenusOnLine } from "./LineRichMenusOnLine";
```

After the existing DB Rich Menus `</Card>`, add:

```tsx
      <LineRichMenusOnLine
        lineAccountId={account.id}
        systemAdmin={user.isSystemAdmin}
      />
```

Full return body should be:

```tsx
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button
              as={NextLink}
              color="primary"
              href={`/rich-menus?lineAccountId=${account.id}`}
            >
              Rich Menus
            </Button>
            <Button
              as={NextLink}
              href={`/import?lineAccountId=${account.id}`}
              variant="bordered"
            >
              Import Rich Menu
            </Button>
          </div>
        }
        description={`ผู้ได้รับสิทธิ์ ${account.assignments.length} คน`}
        title={account.name}
      />
      <Card className="border border-default-200 shadow-none">
        <CardHeader>Rich Menus ({account.richMenus.length})</CardHeader>
        <CardBody>
          {account.richMenus.length === 0 ? (
            <EmptyState title="ยังไม่มี Rich Menu" />
          ) : (
            <ul className="divide-y divide-default-200">
              {account.richMenus.map((rm) => (
                <li
                  key={rm.id}
                  className="py-2 flex justify-between items-center"
                >
                  <Link as={NextLink} href={`/rich-menus/${rm.id}/edit`}>
                    {rm.name} — {rm.width}×{rm.height} ({rm.status})
                  </Link>
                  <Button
                    as={NextLink}
                    href={`/rich-menus/${rm.id}/edit`}
                    size="sm"
                    variant="flat"
                  >
                    แก้ไข
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      <LineRichMenusOnLine
        lineAccountId={account.id}
        systemAdmin={user.isSystemAdmin}
      />
    </div>
  );
```

- [ ] **Step 2: Final verification**

1. Run: `npx tsx lib/line/rich-menu-limit.selfcheck.ts` — expect `rich-menu-limit self-check ok`
2. Run: `npm run lint` — expect clean (or only pre-existing unrelated warnings)
3. Manual: open `/line-accounts/<id>` as assignee → see count/list, no delete buttons
4. Manual: as system admin → delete one orphan / linked menu → confirm modal → list refreshes; if linked, DB row still exists with `lineRichMenuId` null and `DRAFT`

---

## Spec coverage checklist

| Spec item | Task |
|---|---|
| `getRichMenus` in client | 1 |
| `count/max/remaining` helpers | 1 |
| GET API + DB link map | 2 |
| DELETE + DB unlink (not delete record) | 3 |
| System admin only delete | 3 + 4 |
| Detail-page panel, auto-load, badge tones | 4 |
| Confirm modal, refresh, error/retry | 4 |
| Mount on page; list page unchanged | 5 |
| No bulk / no dry-run API / no list-page count | out of scope (no task) |
