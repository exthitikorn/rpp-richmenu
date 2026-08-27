# Auto-response Visual Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the keyword-rule modal with a full-page visual Flex builder and live LINE chat preview, while keeping webhook send behavior unchanged.

**Architecture:** Flex `contents` JSON is the source of truth. Shared Zod allowlist validates API + editor. Path-based tree helpers mutate `contents` without embedding editor IDs. A client builder page (structure / properties / chat preview) posts the same keyword-rules API with `{ flex: { altText, contents } }`.

**Tech Stack:** Next.js App Router, React client components, HeroUI v2, Zod, existing Prisma `KeywordResponseRule`, selfchecks via `npx tsx …/*.selfcheck.ts` (no Jest).

**Spec:** `docs/superpowers/specs/2026-08-27-auto-response-visual-builder-design.md`

## Global Constraints

- No new npm dependencies
- v1 Flex allowlist only: `bubble`, `carousel`, `box`, `text`, `image`, `button`, `separator`
- Button action v1: `uri` + `https://` only
- Builder/JSON saves set `flexSource: "JSON"`; do not add `BUILDER` enum
- Do not persist editor-only `_id` fields in saved JSON
- Selection uses path strings (e.g. `body.contents.0`)
- JSON tab is allowlisted Flex only, not unrestricted LINE Flex
- Carousel save: 2–10 bubbles; switch to carousel auto-adds second bubble; switch to bubble keeps first only (confirm)
- Remove modal `KeywordRuleForm` when builder ships
- Thai UI copy consistent with existing auto-response pages
- Lazy: fewest files; reuse `DefaultRichMenuChatPreview` phone chrome patterns, do not copy dead rich-menu logic

---

## File map

| Path | Responsibility |
|---|---|
| `lib/line/flex-contents.ts` | Zod allowlist + `parseFlexContents` + empty bubble/carousel defaults |
| `lib/line/flex-contents.selfcheck.ts` | Assert allowlist accept/reject |
| `lib/line/flex-tree.ts` | Path get/set/delete/move/append helpers on `contents` |
| `lib/line/flex-tree.selfcheck.ts` | Assert tree mutations |
| `lib/line/message-schema.ts` | `createKeywordRuleSchema` uses `{ altText, contents }` Flex shape |
| `lib/line/keyword-rule-payload.ts` | Store Flex via allowlist; always `flexSource: "JSON"` |
| Delete `lib/line/flex-builder.ts` + `flex-builder.selfcheck.ts` | After callers gone |
| `app/(app)/…/auto-response/builder/*` | Client UI modules |
| `app/(app)/…/auto-response/rules/new/page.tsx` | Create route |
| `app/(app)/…/auto-response/rules/[ruleId]/page.tsx` | Edit route (load rule server-side) |
| `AutoResponseSettings.tsx` | Link to builder routes; drop modal |
| Delete `KeywordRuleForm.tsx` | Replaced |

---

### Task 1: Flex contents allowlist

**Files:**
- Create: `lib/line/flex-contents.ts`
- Create: `lib/line/flex-contents.selfcheck.ts`
- Test: `lib/line/flex-contents.selfcheck.ts`

**Interfaces:**
- Produces:
  - `export type FlexContents = z.infer<typeof flexContentsSchema>`
  - `export const flexContentsSchema: z.ZodType<…>`
  - `export function emptyBubble(): FlexContents`
  - `export function emptyCarousel(): FlexContents` (2 empty bubbles)
  - `export function parseFlexContents(input: unknown): FlexContents` (throws/returns parse result — use `.parse`)

- [ ] **Step 1: Write selfcheck (fail first)**

```ts
// lib/line/flex-contents.selfcheck.ts
import assert from "node:assert/strict";
import { emptyBubble, emptyCarousel, flexContentsSchema } from "./flex-contents";

assert.equal(emptyBubble().type, "bubble");
assert.equal(emptyCarousel().type, "carousel");
assert.equal(emptyCarousel().contents.length, 2);

assert.ok(
  flexContentsSchema.safeParse({
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [{ type: "text", text: "hi", wrap: true }],
    },
  }).success,
);

assert.equal(
  flexContentsSchema.safeParse({
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [{ type: "video", url: "https://example.com/a.mp4" }],
    },
  }).success,
  false,
);

assert.equal(
  flexContentsSchema.safeParse({
    type: "carousel",
    contents: [emptyBubble()],
  }).success,
  false,
); // need 2–10

console.log("flex-contents.selfcheck: ok");
```

- [ ] **Step 2: Run selfcheck — expect fail (module missing)**

Run: `npx tsx lib/line/flex-contents.selfcheck.ts`  
Expected: cannot find module `./flex-contents`

- [ ] **Step 3: Implement `lib/line/flex-contents.ts`**

Implement recursive Zod for allowlisted nodes. Practical approach (lazy, works):

- Define `flexNodeSchema` with `z.lazy` discriminated by `type`
- `box.contents`: array of nodes
- `carousel.contents`: array of bubbles, `.min(2).max(10)`
- `button.action`: `{ type: z.literal("uri"), label: z.string().trim().min(1), uri: httpsUrl }`
- `image.url`: httpsUrl
- `text.text`: string min 1 when present at save time — for empty builder defaults, allow empty text in editor client only; **API schema requires** non-empty text nodes OR allow empty text in schema and rely on preview — prefer allowing empty `text` string in schema so empty bubble can save only if body has no invalid children; empty bubble with `contents: []` must be valid
- `emptyBubble()`:
  ```ts
  {
    type: "bubble",
    body: { type: "box", layout: "vertical", contents: [] },
  }
  ```
- `emptyCarousel()`: `{ type: "carousel", contents: [emptyBubble(), emptyBubble()] }`
- Export `flexContentsSchema = z.union([bubbleSchema, carouselSchema])`

Keep `httpsUrl` local or import from a tiny shared const in this file (do not couple to old card schemas).

- [ ] **Step 4: Run selfcheck — expect pass**

Run: `npx tsx lib/line/flex-contents.selfcheck.ts`  
Expected: `flex-contents.selfcheck: ok`

- [ ] **Step 5: Commit**

```bash
git add lib/line/flex-contents.ts lib/line/flex-contents.selfcheck.ts
git commit -m "$(cat <<'EOF'
Add Flex contents allowlist for visual builder v1.

EOF
)"
```

---

### Task 2: API schema + payload (drop FORM templates)

**Files:**
- Modify: `lib/line/message-schema.ts`
- Modify: `lib/line/keyword-rule-payload.ts`
- Create: `lib/line/keyword-rule-payload.selfcheck.ts`
- Delete after Task 8 (not yet): `lib/line/flex-builder.ts` — keep until UI removed if still imported; Task 2 should stop importing it

**Interfaces:**
- Consumes: `flexContentsSchema` from `lib/line/flex-contents.ts`
- Produces:
  - `createKeywordRuleSchema` accepts  
    `flex?: { altText: string; contents: unknown }` validated with `flexContentsSchema`
  - `buildStoredKeywordRulePayload` sets `flexSource: "JSON"` for FLEX

- [ ] **Step 1: Write payload selfcheck**

```ts
// lib/line/keyword-rule-payload.selfcheck.ts
import assert from "node:assert/strict";
import { buildStoredKeywordRulePayload } from "./keyword-rule-payload";
import { emptyBubble } from "./flex-contents";

const text = buildStoredKeywordRulePayload({
  keyword: "  Hello ",
  isEnabled: true,
  responseType: "TEXT",
  text: "สวัสดี",
});
assert.equal(text.keyword, "hello"); // normalizeKeyword lowercases — verify actual normalize behavior in keyword-match.ts and match it
assert.equal(text.flexSource, null);

const flex = buildStoredKeywordRulePayload({
  keyword: "menu",
  isEnabled: true,
  responseType: "FLEX",
  flex: { altText: "เมนู", contents: emptyBubble() },
});
assert.equal(flex.flexSource, "JSON");
assert.equal(
  (flex.responsePayload as { altText: string }).altText,
  "เมนู",
);

let threw = false;
try {
  buildStoredKeywordRulePayload({
    keyword: "x",
    isEnabled: true,
    responseType: "FLEX",
    flex: {
      altText: "bad",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [{ type: "video", url: "https://example.com/v.mp4" }],
        },
      },
    },
  });
} catch {
  threw = true;
}
assert.equal(threw, true);

console.log("keyword-rule-payload.selfcheck: ok");
```

Before asserting `keyword`, open `lib/line/keyword-match.ts` and use the real normalized value in the assert.

- [ ] **Step 2: Run — expect fail on old flex shape / import**

Run: `npx tsx lib/line/keyword-rule-payload.selfcheck.ts`

- [ ] **Step 3: Update `message-schema.ts`**

Replace card/single/carousel/json form schemas with:

```ts
import { flexContentsSchema } from "./flex-contents";

export const flexBuilderSchema = z.object({
  altText: z.string().trim().min(1, "กรุณาระบุข้อความสำรอง"),
  contents: flexContentsSchema,
});

export const createKeywordRuleSchema = z
  .object({
    keyword: z.string().trim().min(1, "กรุณาระบุ keyword"),
    isEnabled: z.boolean().default(true),
    responseType: z.enum(["TEXT", "FLEX"]),
    text: z.string().trim().optional(),
    flex: flexBuilderSchema.optional(),
  })
  .superRefine(/* same TEXT/FLEX presence checks */);
```

Remove exports that only served the old form (`flexCardSchema`, `flexFormSchema`, …) **if** no remaining imports. Grep before deleting.

Keep `storedTextPayloadSchema` / `storedFlexPayloadSchema`. Optionally tighten `storedFlexPayloadSchema.contents` to `flexContentsSchema` for defense in depth.

- [ ] **Step 4: Update `keyword-rule-payload.ts`**

```ts
const contents = flexContentsSchema.parse(parsed.flex!.contents);
const payload = storedFlexPayloadSchema.parse({
  altText: parsed.flex!.altText,
  contents,
});
return { …, flexSource: "JSON", responsePayload: payload };
```

On parse failure throw `INVALID_FLEX` (keep API route mapping).

- [ ] **Step 5: Run selfcheck — pass**

Run: `npx tsx lib/line/keyword-rule-payload.selfcheck.ts`  
Also run: `npx tsx lib/line/flex-contents.selfcheck.ts`

- [ ] **Step 6: Commit**

```bash
git add lib/line/message-schema.ts lib/line/keyword-rule-payload.ts lib/line/keyword-rule-payload.selfcheck.ts
git commit -m "$(cat <<'EOF'
Accept Flex contents JSON in keyword-rule API payload.

EOF
)"
```

Note: old UI still posts `pattern: single|carousel|json` and will break until Task 7–8 replace it — implement UI next without long gap, or temporarily keep dual schema. Prefer **no dual schema**: finish Tasks 3–8 in the same branch before merging; local old modal may error until removed (acceptable on feature branch).

---

### Task 3: Flex tree path helpers

**Files:**
- Create: `lib/line/flex-tree.ts`
- Create: `lib/line/flex-tree.selfcheck.ts`

**Interfaces:**
- Produces:
  - `export type FlexPath = string` // `""` = root; segments joined by `.` ; numeric segments for arrays
  - `export function getAtPath(root: unknown, path: FlexPath): unknown`
  - `export function setAtPath(root: unknown, path: FlexPath, value: unknown): unknown` // returns new root (immutable clone)
  - `export function deleteAtPath(root: unknown, path: FlexPath): unknown`
  - `export function moveSibling(root: unknown, path: FlexPath, dir: -1 | 1): unknown`
  - `export function appendChild(root: unknown, parentPath: FlexPath, node: unknown): unknown` // parent must be box (or carousel for bubbles)
  - `export function parsePath(path: FlexPath): (string | number)[]`
  - `export function defaultNode(type: "box" | "text" | "image" | "button" | "separator"): Record<string, unknown>`

- [ ] **Step 1: Write selfcheck**

```ts
import assert from "node:assert/strict";
import { emptyBubble } from "./flex-contents";
import {
  appendChild,
  deleteAtPath,
  getAtPath,
  moveSibling,
  setAtPath,
} from "./flex-tree";

let root = emptyBubble();
root = appendChild(root, "body", {
  type: "text",
  text: "A",
  wrap: true,
}) as typeof root;
root = appendChild(root, "body", {
  type: "text",
  text: "B",
  wrap: true,
}) as typeof root;

assert.equal(
  (getAtPath(root, "body.contents.0") as { text: string }).text,
  "A",
);

root = moveSibling(root, "body.contents.0", 1) as typeof root;
assert.equal(
  (getAtPath(root, "body.contents.0") as { text: string }).text,
  "B",
);

root = setAtPath(root, "body.contents.0.text", "BB") as typeof root;
assert.equal(
  (getAtPath(root, "body.contents.0") as { text: string }).text,
  "BB",
);

root = deleteAtPath(root, "body.contents.1") as typeof root;
assert.equal(
  ((getAtPath(root, "body.contents") as unknown[]) ?? []).length,
  1,
);

console.log("flex-tree.selfcheck: ok");
```

Implement `appendChild` so path `"body"` targets the box and pushes into its `contents` array (not into bubble.contents). Document that convention in a one-line comment on `appendChild`.

- [ ] **Step 2: Run — fail missing module**

Run: `npx tsx lib/line/flex-tree.selfcheck.ts`

- [ ] **Step 3: Implement `flex-tree.ts`**

- Immutable updates via structuredClone / shallow copy along the path
- `moveSibling`: swap with neighbor; no-op at edges
- `defaultNode`:
  - box: `{ type: "box", layout: "vertical", contents: [] }`
  - text: `{ type: "text", text: "ข้อความ", wrap: true }`
  - image: `{ type: "image", url: "https://via.placeholder.com/300x200", size: "full", aspectMode: "cover" }` — use a stable https placeholder or require URL before save (schema requires https)
  - button: `{ type: "button", action: { type: "uri", label: "เปิดลิงก์", uri: "https://example.com" } }`
  - separator: `{ type: "separator" }`

- [ ] **Step 4: Run — pass**

Run: `npx tsx lib/line/flex-tree.selfcheck.ts`

- [ ] **Step 5: Commit**

```bash
git add lib/line/flex-tree.ts lib/line/flex-tree.selfcheck.ts
git commit -m "$(cat <<'EOF'
Add path helpers for Flex contents tree editing.

EOF
)"
```

---

### Task 4: Builder routes + TEXT save shell

**Files:**
- Create: `app/(app)/line-accounts/[id]/auto-response/builder/KeywordRuleBuilder.tsx`
- Create: `app/(app)/line-accounts/[id]/auto-response/rules/new/page.tsx`
- Create: `app/(app)/line-accounts/[id]/auto-response/rules/[ruleId]/page.tsx`
- Modify later list page in Task 8

**Interfaces:**
- Produces: `<KeywordRuleBuilder mode="create" | "edit" lineAccountId accountName? initialRule? />`
- `initialRule` shape:
  ```ts
  {
    id: string;
    keyword: string;
    isEnabled: boolean;
    responseType: "TEXT" | "FLEX";
    responsePayload: unknown;
  }
  ```

- [ ] **Step 1: Create edit `page.tsx` (server)**

- `getCurrentUser` + `lineAccountByIdWhere`
- Load rule by `ruleId` + `lineAccountId`; `notFound()` if missing
- Select `responsePayload` for hydrate
- Pass into `KeywordRuleBuilder`

- [ ] **Step 2: Create `new/page.tsx`**

- Auth + account check only; render builder in create mode

- [ ] **Step 3: Implement `KeywordRuleBuilder` shell**

Client component with:

- State: keyword, isEnabled, responseType, text, altText, contents (`emptyBubble()`), selectedPath, editorTab (`builder` | `json`), jsonDraft, saving
- Header: NextLink back to `/line-accounts/${id}/auto-response`, title, Save button
- Rule fields: Input keyword, Switch enabled, Radio TEXT|FLEX
- TEXT: Textarea; right column shows simple chat bubble preview (inline minimal phone chrome — extract small presentational bits in Task 6)
- Save TEXT:
  ```ts
  await fetch(`/api/line-accounts/${lineAccountId}/keyword-rules` or `.../${id}`, {
    method: mode === "create" ? "POST" : "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword, isEnabled, responseType: "TEXT", text }),
  })
  ```
- On success: toast + `router.push` list + `router.refresh()`
- FLEX UI can be stubs (disabled Save until Task 5 wires contents) **or** save empty bubble if altText filled — prefer allow FLEX save of empty bubble + altText once Task 1 schema allows empty body

Hydrate edit TEXT from `responsePayload.text`; FLEX from `altText` + `contents` (if contents fail allowlist, still load into `jsonDraft` and open JSON tab with error — Task 7).

- [ ] **Step 4: Manual check**

Run: `npm run dev`  
Open `/line-accounts/<id>/auto-response/rules/new` — create TEXT rule, confirm appears after navigating to list API or Prisma studio.

- [ ] **Step 5: Commit**

```bash
git add app/(app)/line-accounts/[id]/auto-response/builder/KeywordRuleBuilder.tsx \
  app/(app)/line-accounts/[id]/auto-response/rules/
git commit -m "$(cat <<'EOF'
Add keyword rule builder pages with TEXT save.

EOF
)"
```

---

### Task 5: Structure tree + properties + palette

**Files:**
- Create: `app/(app)/line-accounts/[id]/auto-response/builder/FlexStructurePanel.tsx`
- Create: `app/(app)/line-accounts/[id]/auto-response/builder/FlexPropertiesPanel.tsx`
- Modify: `KeywordRuleBuilder.tsx`

**Interfaces:**
- Consumes: `flex-tree` helpers, `emptyBubble` / `emptyCarousel`
- `FlexStructurePanel` props:
  ```ts
  {
    contents: unknown;
    selectedPath: string;
    onSelect: (path: string) => void;
    onChangeContents: (next: unknown) => void;
  }
  ```
- `FlexPropertiesPanel` props: `{ contents, selectedPath, onChangeContents }`

- [ ] **Step 1: `FlexStructurePanel`**

- Root type toggle Bubble | Carousel with `window.confirm` on switch:
  - to carousel: `emptyCarousel()` or wrap current bubble + extra empty bubble
  - to bubble: keep first carousel item only
- Palette buttons (enabled when selected node is `box` **or** when selection is bubble `body` box path): append via `defaultNode` + `appendChild`
- Tree list: recursive render labels (`text` shows snippet, else type name); click selects path
- Buttons: ลบ, ขึ้น, ลง calling delete/moveSibling
- Guard: do not delete `body` box itself without replacement

- [ ] **Step 2: `FlexPropertiesPanel`**

Switch on `getAtPath` type; controlled inputs calling `setAtPath` for fields from spec:

- text: text, wrap (Switch), weight (`regular`|`bold`), size, color
- image: url, size, aspectRatio, aspectMode
- button: action.label, action.uri
- box: layout, spacing, margin
- separator: margin, color
- unsupported type: message “แก้ในแท็บ JSON”

- [ ] **Step 3: Wire into builder 3-column layout**

Left: rule fields + structure; center: properties; FLEX Save sends:

```ts
{
  keyword,
  isEnabled,
  responseType: "FLEX",
  flex: { altText, contents },
}
```

Validate client-side with `flexContentsSchema.safeParse` before fetch; toast first issue.

- [ ] **Step 4: Manual check** — build bubble with text + button, save, GET rule payload has contents

- [ ] **Step 5: Commit**

```bash
git add app/(app)/line-accounts/[id]/auto-response/builder/
git commit -m "$(cat <<'EOF'
Add Flex tree palette and properties panels.

EOF
)"
```

---

### Task 6: Chat preview (TEXT + Flex approximate)

**Files:**
- Create: `app/(app)/line-accounts/[id]/auto-response/builder/AutoResponseChatPreview.tsx`
- Create: `app/(app)/line-accounts/[id]/auto-response/builder/FlexMessagePreview.tsx`
- Modify: `KeywordRuleBuilder.tsx`

**Interfaces:**
- `AutoResponseChatPreview({ accountName, responseType, text, contents, selectedPath, onSelectPath })`
- `FlexMessagePreview({ contents, selectedPath, onSelectPath })`

- [ ] **Step 1: Phone chrome**

Reuse visual patterns from `DefaultRichMenuChatPreview` (status bar, OA header, `#849bb4` bg) but **do not** import rich-menu data fetching. Keep a slim frame (~320px).

- [ ] **Step 2: TEXT bubble**

White rounded bubble with `text`.

- [ ] **Step 3: `FlexMessagePreview`**

Recursive React renderer:

- carousel: horizontal scroll of bubbles
- bubble: white card column (hero/body/footer if present)
- box: `display: flex` + direction from layout
- text / image / button / separator approximations
- selected path: `outline: 2px solid` accent; `onClick` stopPropagation → `onSelectPath`

Unsupported node: gray placeholder box with type name.

- [ ] **Step 4: Wire right column; selecting preview updates properties**

- [ ] **Step 5: Commit**

```bash
git add app/(app)/line-accounts/[id]/auto-response/builder/AutoResponseChatPreview.tsx \
  app/(app)/line-accounts/[id]/auto-response/builder/FlexMessagePreview.tsx \
  app/(app)/line-accounts/[id]/auto-response/builder/KeywordRuleBuilder.tsx
git commit -m "$(cat <<'EOF'
Add live chat preview for auto-response builder.

EOF
)"
```

---

### Task 7: JSON advanced tab

**Files:**
- Modify: `KeywordRuleBuilder.tsx` (or small `FlexJsonEditor.tsx` if file gets huge — prefer inline Tabs first)

- [ ] **Step 1: Tabs Builder | JSON**

- JSON textarea bound to `jsonDraft` string
- On switch to JSON: `jsonDraft = JSON.stringify(contents, null, 2)`
- On switch to Builder: `JSON.parse` + `flexContentsSchema.safeParse`; on failure toast/error text and stay on JSON
- Debounced optional live parse while on JSON tab updating preview only when valid (lazy: update preview on blur or “ใช้ JSON” button — prefer **Apply on blur** when parse ok)

- [ ] **Step 2: Load legacy invalid-for-v1 contents**

If edit hydrate `safeParse` fails: set `editorTab` to `json`, show error, disable Builder until fixed.

- [ ] **Step 3: Manual check** — edit JSON text, return to Builder, tree matches

- [ ] **Step 4: Commit**

```bash
git add app/(app)/line-accounts/[id]/auto-response/builder/KeywordRuleBuilder.tsx
git commit -m "$(cat <<'EOF'
Add allowlisted JSON escape hatch to Flex builder.

EOF
)"
```

---

### Task 8: Wire list page + delete old form

**Files:**
- Modify: `app/(app)/line-accounts/[id]/auto-response/AutoResponseSettings.tsx`
- Delete: `app/(app)/line-accounts/[id]/auto-response/KeywordRuleForm.tsx`
- Delete: `lib/line/flex-builder.ts`
- Delete: `lib/line/flex-builder.selfcheck.ts`
- Grep for `KeywordRuleForm`, `flex-builder`, `flexFormSchema`, `pattern: "single"`

- [ ] **Step 1: Replace modal open with navigation**

```ts
router.push(`/line-accounts/${lineAccountId}/auto-response/rules/new`);
// edit:
router.push(`/line-accounts/${lineAccountId}/auto-response/rules/${rule.id}`);
```

Remove `KeywordRuleForm` import/state.

- [ ] **Step 2: Delete dead files; fix any imports**

- [ ] **Step 3: Run all selfchecks + lint**

```bash
npx tsx lib/line/flex-contents.selfcheck.ts
npx tsx lib/line/flex-tree.selfcheck.ts
npx tsx lib/line/keyword-rule-payload.selfcheck.ts
npm run lint
```

Expected: all ok / lint clean for touched files

- [ ] **Step 4: Manual regression**

- List page create/edit links work  
- TEXT + FLEX save/edit/delete/toggle still work  
- Webhook still sends (optional if no LINE test env: unit path untouched — confirm `handle-auto-response.ts` / `auto-response.ts` unchanged)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Replace keyword rule modal with visual builder entry points.

EOF
)"
```

---

## Spec coverage checklist

| Spec item | Task |
|---|---|
| Full-page builder routes | 4 |
| 3-column IA + header | 4–6 |
| Live chat preview | 6 |
| Free-form allowlist components | 1, 5 |
| Path selection / no `_id` | 3, 5 |
| API `{ altText, contents }` + `flexSource: JSON` | 2 |
| JSON escape hatch allowlisted | 7 |
| Carousel 2–10 + switch rules | 1, 5 |
| Remove modal / FORM templates | 2, 8 |
| Webhook unchanged | 8 verify |
| Selfchecks | 1, 2, 3, 8 |

## Plan self-review notes

- No dual FORM/JSON API after Task 2 — feature branch must land UI before release
- Placeholder image URL must be https for schema; change later in properties
- `normalizeKeyword` assert in Task 2 must match real helper (read file when implementing)
