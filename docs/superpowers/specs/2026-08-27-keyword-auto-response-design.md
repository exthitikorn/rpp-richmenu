# Keyword Auto-Response — Design Spec

**Date:** 2026-08-27  
**Status:** Draft (approved in brainstorming)  
**Approach:** Extend existing webhook + DB-backed keyword rules (Approach A)

## Problem

LINE Official Account Manager provides built-in auto-reply (keyword response), but this app already owns the OA webhook for Rich Menu click tracking. Teams must configure auto-replies separately in OA Manager, which duplicates configuration, cannot be scoped to assigned app users, and risks double replies if both systems respond.

## Goal

Replace OA Manager keyword auto-reply with an in-app feature:

- Per-OA keyword → response rules managed by assigned users (system admins see all).
- Exact keyword matching (trim + case-insensitive).
- Reply with **text** or **Flex Message** (covers rich/card-style content in v1).
- Master switch per OA plus enable/disable per rule.
- When no rule matches: send a configurable fallback text message and log the unmatched message to DB.
- Coexist with existing Rich Menu postback click tracking on the same webhook URL.

## Non-Goals (v1)

- UI to browse unmatched messages or one-click "create rule from unmatched"
- Contains / regex / fuzzy keyword matching
- Standalone image messages (use image URLs inside Flex instead)
- Sticker, Template (non-Flex), Imagemap message types
- Multiple messages per reply (LINE allows up to 5; v1 sends one)
- Response analytics (hit counts per rule)
- Import / export rules from OA Manager
- Group / room chat replies (1:1 user chat only)
- Push messages (reply-token only; no proactive push)

## Decisions Log

| Topic | Decision |
|---|---|
| Primary goal | Replace OA Manager auto-reply entirely |
| Architecture | Extend existing webhook; reply synchronously via Reply API |
| Keyword match | Exact only: `trim().toLowerCase()` on both sides |
| Response types | Text + Flex Message |
| Flex authoring | Form for 2–3 common patterns + raw JSON mode |
| Enable control | Master switch on `LineAccount` + `isEnabled` per rule |
| No match | Log to `UnmatchedMessage` + send `fallbackMessage` if set |
| Unmatched UI | DB only in v1 (Prisma Studio / SQL) |
| Chat scope | 1:1 only (`source.type === "user"`) |
| Master switch off | No match, no fallback, no unmatched log |
| Duplicate keywords | Blocked per OA (`@@unique([lineAccountId, keyword])`) |
| Access control | Same as Rich Menus — assigned users + system admin |

---

## Data Model

### Extend `LineAccount`

| Field | Type | Default | Notes |
|---|---|---|---|
| `autoResponseEnabled` | `Boolean` | `false` | Master switch; when false webhook ignores text messages for auto-response |
| `fallbackMessage` | `String?` `@db.Text` | `null` | Plain text sent when no rule matches; omit reply if null/empty |

### New enum: `KeywordResponseType`

```
TEXT | FLEX
```

### New enum: `FlexMessageSource`

```
FORM | JSON
```

### New model: `KeywordResponseRule`

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | PK |
| `lineAccountId` | String | FK → `LineAccount` |
| `keyword` | String | Stored normalized: `trim().toLowerCase()` |
| `isEnabled` | Boolean | Default `true` |
| `responseType` | `KeywordResponseType` | |
| `responsePayload` | Json | TEXT: `{ "text": "..." }`; FLEX: full Flex `contents` object or wrapper with `altText` + `contents` |
| `flexSource` | `FlexMessageSource?` | `null` when `responseType = TEXT`; `FORM` or `JSON` when FLEX |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

**Constraints & indexes:**

- `@@unique([lineAccountId, keyword])`
- `@@index([lineAccountId, isEnabled])`

**Relations:**

- `LineAccount.keywordResponseRules`
- `LineAccount.unmatchedMessages`

### New model: `UnmatchedMessage`

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | PK |
| `lineAccountId` | String | FK → `LineAccount` |
| `lineUserId` | String | LINE user ID from event source |
| `messageText` | String `@db.Text` | Raw incoming text (not normalized) |
| `createdAt` | DateTime | |

**Index:** `@@index([lineAccountId, createdAt])`

Migration: additive columns + two new tables.

---

## LINE API

### Reply Message

Add to `lib/line/client.ts`:

```ts
replyMessage(
  accessToken: string,
  replyToken: string,
  messages: LineOutgoingMessage[],
): Promise<void>
```

`POST https://api.line.me/v2/bot/message/reply`

Body:

```json
{
  "replyToken": "...",
  "messages": [ { "type": "text", "text": "..." } ]
}
```

`LineOutgoingMessage` (app-level union, v1):

- `{ type: "text"; text: string }`
- `{ type: "flex"; altText: string; contents: FlexContainer }`

Throw on non-2xx (caller catches and logs; webhook still returns 200 to LINE).

### Reply token constraints

- Valid ~30 seconds — must reply inside the webhook handler (no queue in v1).
- One reply per event (one `replyToken`).

---

## Webhook Flow

Extend `app/api/webhook/line/[channelId]/route.ts`.

### Event handling (after signature verification)

| Event | Action |
|---|---|
| `postback` with `rpp:richMenuId:areaIndex` | Unchanged — record `ClickEvent` |
| `message` where `message.type === "text"` | Auto-response pipeline (below) |
| All other events | Ignore |

### Auto-response pipeline

Preconditions (all must pass):

1. `lineAccount.autoResponseEnabled === true`
2. `event.source.type === "user"` (1:1 chat)
3. `event.replyToken` present
4. Incoming text non-empty after trim

Steps:

1. Load enabled rules for this `lineAccountId` (or all rules and filter enabled in memory — prefer DB filter).
2. `normalized = incomingText.trim().toLowerCase()`
3. Find rule where `rule.keyword === normalized && rule.isEnabled`
4. **Match:** build outgoing message from `responsePayload`, call `replyMessage`
5. **No match:**
   - `prisma.unmatchedMessage.create({ lineAccountId, lineUserId, messageText: rawText })`
   - If `fallbackMessage` is non-empty after trim, `replyMessage` with text
6. Always return `200 { ok: true }` to LINE (even if reply fails — log server-side)

### Master switch off

Skip steps 1–5 entirely for text messages (postback handling unaffected).

### Credentials

Decrypt `accessToken` from `LineAccount` for `replyMessage` (same pattern as deploy routes).

---

## Keyword Matching

```ts
function normalizeKeyword(text: string): string {
  return text.trim().toLowerCase();
}
```

- Incoming message and stored keyword both use this normalization at match time.
- On create/update API: reject empty keyword after normalize; store normalized value.
- No priority ordering needed in v1 (unique keyword per OA guarantees at most one match).

---

## Flex Message Authoring

### Form patterns (server builds Flex JSON)

**1. Single bubble card**

Fields:

- `altText` (required, for notifications)
- `imageUrl` (optional, HTTPS)
- `title` (optional)
- `body` (required)
- `actionLabel` + `actionUri` (optional button)

Server output: Flex bubble with hero image (if URL), body text, optional URI action button.

**2. Carousel (2–3 cards)**

Same fields per card (array length 2–3). Server output: Flex carousel container.

**3. Advanced JSON**

User pastes raw Flex `contents` JSON (+ `altText` field in form). Validate with Zod:

- Must be object
- For JSON mode: accept `{ altText, contents }` or bare `contents` with separate `altText` input

On save, persist canonical shape in `responsePayload`:

```json
{ "altText": "...", "contents": { ... } }
```

Set `flexSource` to `FORM` or `JSON` accordingly.

### Text responses

`responsePayload`: `{ "text": "..." }`  
Validate non-empty, reasonable max length (e.g. 5000 chars — LINE text limit).

---

## Access Control

Add to `lib/access.ts`:

- `keywordResponseRuleWhere(user)` — scope via `lineAccount.assignments`
- `keywordResponseRuleByIdWhere(user, id)` — id + scope
- `unmatchedMessageWhere(user)` — for future UI; not exposed in v1 API

API routes follow existing mutating pattern:

```ts
const user = await getCurrentUser();
if (!user) return 401;
const account = await prisma.lineAccount.findFirst({
  where: lineAccountByIdWhere(user, lineAccountId),
});
if (!account) return 404;
```

Rule mutations additionally verify `rule.lineAccountId === lineAccountId`.

---

## API Routes

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/line-accounts/[id]/auto-response` | `{ autoResponseEnabled, fallbackMessage }` |
| PATCH | `/api/line-accounts/[id]/auto-response` | Update settings |
| GET | `/api/line-accounts/[id]/keyword-rules` | List rules (keyword, type, isEnabled, id) |
| POST | `/api/line-accounts/[id]/keyword-rules` | Create rule |
| GET | `/api/line-accounts/[id]/keyword-rules/[ruleId]` | Rule detail |
| PATCH | `/api/line-accounts/[id]/keyword-rules/[ruleId]` | Update rule |
| DELETE | `/api/line-accounts/[id]/keyword-rules/[ruleId]` | Delete rule |

No public API for `UnmatchedMessage` in v1.

### Validation errors (examples)

- Duplicate keyword → `409` with Thai message
- Invalid Flex JSON → `400`
- Empty keyword or empty text body → `400`

---

## UI

### Route

`/line-accounts/[id]/auto-response`

Linked from OA detail page (button or nav item next to existing actions).

### Settings section

- Toggle: เปิดใช้ Auto-response (`autoResponseEnabled`)
- Textarea: ข้อความ Fallback (`fallbackMessage`)
- Info callout: ปิด Auto-reply ใน LINE OA Manager และตั้ง Webhook URL ของระบบนี้ (reuse copy pattern from `LineAccountWebhookCopy`)

### Rules section

- Table: keyword, response type badge, enabled switch, edit / delete
- "เพิ่ม Keyword" opens create form

### Create / Edit rule form

- Keyword (text input)
- Response type: Text | Flex
- **Text:** message textarea
- **Flex:** pattern selector
  - Single card → form fields
  - Carousel → repeat card fields (2–3)
  - JSON → textarea + altText
- Enabled toggle (default on)

Use existing patterns: `PageShell`, `PageHeader`, HeroUI components, `useAppToast`, client fetch to API routes.

Preview of Flex in chat is optional for v1 — defer if it adds significant scope.

---

## Error Handling

| Situation | Behavior |
|---|---|
| Reply API fails (expired token, 429, 5xx) | `console.error`; webhook returns 200; unmatched row still created if applicable |
| Invalid rule payload at runtime | Log error; skip reply (should not happen if save-time validation works) |
| Empty fallback | Log unmatched only; no reply |
| Non-text user message (sticker, image) | Ignore |
| Group / room message | Ignore |
| OA Manager auto-reply still enabled | User may get double replies — document in UI callout |
| Webhook not configured on LINE | No auto-response (unchanged from today) |

---

## Operational Notes

When rolling out per OA:

1. Configure webhook URL in LINE Developers (already required for click tracking).
2. **Disable** keyword auto-reply / greeting auto-reply in LINE OA Manager for that channel.
3. Enable master switch in this app and create rules.
4. Test with a LINE user account in 1:1 chat.

---

## Testing / Checks

No project test suite. Add runnable self-checks where non-trivial:

- `normalizeKeyword()` edge cases (trim, case) — `lib/line/keyword-match.selfcheck.ts`
- Flex form builder output shape — `lib/line/flex-builder.selfcheck.ts` if builder is non-trivial

Manual smoke:

1. Master switch off → user text ignored (no reply, no log).
2. Exact keyword match → correct text reply.
3. Flex single card → renders in LINE client.
4. No match + fallback set → fallback sent + `UnmatchedMessage` row.
5. No match + no fallback → log only.
6. Postback click still records `ClickEvent`.
7. Assigned user can CRUD rules; non-assigned user gets 404.

---

## Implementation Touchpoints (expected)

- `prisma/schema.prisma` + migration
- `lib/access.ts` — scope helpers
- `lib/line/client.ts` — `replyMessage`
- `lib/line/keyword-match.ts` — normalize + find rule
- `lib/line/flex-builder.ts` — form → Flex JSON (if not inline)
- `lib/line/message-schema.ts` — Zod schemas for payloads
- `app/api/webhook/line/[channelId]/route.ts` — message branch
- `app/api/line-accounts/[id]/auto-response/route.ts`
- `app/api/line-accounts/[id]/keyword-rules/route.ts`
- `app/api/line-accounts/[id]/keyword-rules/[ruleId]/route.ts`
- `app/(app)/line-accounts/[id]/auto-response/page.tsx` + form components
- OA detail page — link to auto-response settings

---

## Open Questions

None — resolved in Decisions Log.
