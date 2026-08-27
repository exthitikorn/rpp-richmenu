# Auto-response visual builder

Date: 2026-08-27  
Status: approved for planning (pending user review of this doc)

## Goal

Replace the keyword-rule modal form with a dedicated **visual Flex builder** plus **live LINE chat preview**, so editors can compose auto-replies without hand-writing Flex JSON.

The JSON tab is an escape hatch for editing the **same v1 allowlisted** Flex tree as raw JSON — not a backdoor for unsupported LINE Flex types.

## Non-goals (v1)

- Full LINE Flex Message Simulator parity
- Drag-and-drop tree reordering
- Extra Flex types (`icon`, `span`, `video`, `filler`, `spacer`, …)
- Button actions other than `uri`
- Keeping the old single/carousel template form UI
- Pixel-perfect Flex rendering

## Decisions locked

| Topic | Choice |
|---|---|
| Scope | Live chat preview **+** free-form Flex designer |
| Flex depth | Free-form within v1 allowlist |
| v1 components | `box`, `text`, `image`, `button`, `separator` + `bubble` / `carousel` |
| Shell | Dedicated full page (not modal/drawer) |
| Old form | Removed; advanced JSON tab only as escape hatch |
| Approach | In-house tree editor + approximate Flex renderer; no new dependency |
| Storage | Unchanged DB shape; builder/JSON saves as `flexSource: JSON` |

## Information architecture

### List page (unchanged route)

`/line-accounts/[id]/auto-response`

- Keep: enable toggle, fallback message, rules table, enable/disable per rule
- Create / Edit navigate to builder pages (no `KeywordRuleForm` modal)

### Builder pages

- Create: `/line-accounts/[id]/auto-response/rules/new`
- Edit: `/line-accounts/[id]/auto-response/rules/[ruleId]`

**Desktop layout (3 columns):**

1. **Structure (left)** — rule fields (keyword, enabled, TEXT|FLEX, altText when FLEX); FLEX palette + tree; tabs **Builder | JSON**
2. **Properties (center)** — selected node fields; for TEXT, the message textarea
3. **Chat preview (right)** — phone chrome consistent with existing rich-menu chat mock

**Mobile:** stack vertically (rule/structure → properties → preview).

**Header:** back to list, title, Save.

## Data model

### Database

No schema migration required.

| `responseType` | `responsePayload` | `flexSource` |
|---|---|---|
| `TEXT` | `{ text }` | `null` |
| `FLEX` | `{ altText, contents }` | `JSON` |

- Legacy rows with `flexSource: FORM` remain valid for webhook send.
- Opening them in the builder hydrates from stored `contents`; next successful save sets `flexSource` to `JSON`.
- Do **not** add a `BUILDER` enum value.

### API contract

Reuse:

- `POST /api/line-accounts/[id]/keyword-rules`
- `PATCH /api/line-accounts/[id]/keyword-rules/[ruleId]`
- `GET` / `DELETE` unchanged in behavior

Replace form-oriented Flex body with:

```ts
// TEXT
{ keyword, isEnabled, responseType: "TEXT", text: string }

// FLEX
{
  keyword,
  isEnabled,
  responseType: "FLEX",
  flex: { altText: string, contents: object }
}
```

Validation (Zod):

- TEXT: non-empty `text` (existing limits)
- FLEX: non-empty `altText`; `contents.type` is `bubble` or `carousel`
- Recursive allowlist for nodes: `bubble`, `carousel`, `box`, `text`, `image`, `button`, `separator`
- `button.action` in v1: `{ type: "uri", label, uri }` with `https://` URI
- `image.url` must be `https://` when present

`buildStoredKeywordRulePayload` writes Flex via validate/normalize of `contents` (not `buildFlexPayloadFromForm` template paths). Template helpers may be deleted or left only if still referenced by selfchecks during cleanup.

### Editor client state

- Source of truth: `contents` object (plus `altText` / text / keyword / flags)
- Selection: path into the tree (e.g. `body.contents.0`) — **do not** persist editor-only `_id` fields in saved JSON
- Builder ↔ JSON tab: switch to Builder only when JSON parses and passes client allowlist check; on parse failure, stay on JSON and show a short error

## Interaction

### Defaults

- New FLEX rule: one empty `bubble` with `body: { type: "box", layout: "vertical", contents: [] }`
- Switch to carousel: auto-add a second empty bubble if only one exists; save enforces 2–10 bubbles
- Switch to single bubble: keep the first carousel bubble, discard the rest (after confirm)

### Tree ops (v1)

- Add: select a `box` parent → palette appends to `contents`
- Delete selected node (with guardrails: cannot delete required bubble/body structure without replacement)
- Move up / move down among siblings (buttons; no drag-and-drop)
- Click tree node or preview node → select + show properties
- Switch bubble ↔ carousel: confirm; transform structure explicitly

### Properties (minimal useful set)

- `text`: `text`, `wrap`, `weight`, `size`, `color`
- `image`: `url`, `size`, `aspectRatio`, `aspectMode`
- `button`: `action.label`, `action.uri` (`type: "uri"` fixed)
- `box`: `layout` (`vertical` | `horizontal`), `spacing`, `margin`
- `separator`: `margin`, `color`

## Preview

- Reuse visual language of `DefaultRichMenuChatPreview` phone frame
- TEXT → white chat bubble
- FLEX → approximate React renderer for allowlisted types only
- Selected node: subtle outline in preview
- Live from client state; no preview API

Rendering is intentionally approximate, not LINE SDK–accurate.

## Errors

- Save failures: toast + focus offending field (empty keyword, empty text, schema fail, non-https URL)
- Invalid JSON tab: block Builder tab until fixed
- Contents with non-allowlisted types: **cannot save** (API allowlist always). User must edit JSON or rebuild with supported nodes. Unsupported nodes may appear as read-only placeholders in the tree when loading legacy/advanced JSON, but save still requires allowlist compliance.

## Code touchpoints (expected)

- Remove / stop using: `KeywordRuleForm` modal wiring in `AutoResponseSettings`
- Add builder route pages under `app/(app)/line-accounts/[id]/auto-response/rules/`
- New client modules: tree helpers, Flex preview renderer, properties panel
- Update: `lib/line/message-schema.ts`, `lib/line/keyword-rule-payload.ts`
- Cleanup: FORM template UI paths in `flex-builder.ts` as unused
- Selfcheck: path mutate + allowlist validate (same style as existing `*.selfcheck.ts`)

## Webhook / runtime

No change to matching or send path: still reads `responseType` + `responsePayload` and replies via existing auto-response helpers.

## Success criteria

1. User can create TEXT and FLEX keyword rules on a full page with live chat preview
2. User can build a bubble (and carousel) using only palette + properties without writing JSON
3. Advanced JSON tab round-trips when valid
4. Old modal template form is gone
5. Existing webhook auto-reply still works for old FORM rows and new JSON rows
