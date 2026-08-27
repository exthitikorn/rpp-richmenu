# Keyword Auto-Response Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace LINE OA Manager keyword auto-reply with per-OA rules (exact match → text or Flex reply) on the existing webhook, plus settings UI and unmatched-message logging.

**Architecture:** Extend `app/api/webhook/line/[channelId]/route.ts` to handle `message` text events after signature verification; match against `KeywordResponseRule` rows scoped to `LineAccount`; reply synchronously via new `replyMessage` in `lib/line/client.ts`. CRUD via scoped API routes; admin UI at `/line-accounts/[id]/auto-response`.

**Tech Stack:** Next.js App Router, Prisma/MySQL, Zod, HeroUI, existing `decryptSecret` / `lineAccountByIdWhere` patterns

## Global Constraints

- Exact keyword match only: `trim().toLowerCase()` on store and match
- 1:1 chat only: `event.source.type === "user"`
- Master switch off → no match, no fallback, no unmatched log
- Reply via `replyToken` only (no push); one message per reply in v1
- Webhook always returns `200 { ok: true }` even if LINE reply fails
- No unmatched-message UI in v1 (DB only)
- No commits unless the user asks
- Thai API errors where user-facing (duplicate keyword, validation)
- Self-checks via `*.selfcheck.ts` + `node --import tsx` (no test suite)

## File map

| File | Role |
|---|---|
| `prisma/schema.prisma` + migration | enums, `LineAccount` fields, `KeywordResponseRule`, `UnmatchedMessage` |
| `lib/line/types.ts` | `LineOutgoingMessage` union |
| `lib/line/client.ts` | `replyMessage` |
| `lib/line/keyword-match.ts` + `.selfcheck.ts` | normalize + find rule |
| `lib/line/message-schema.ts` | Zod for API bodies + stored payloads |
| `lib/line/flex-builder.ts` + `.selfcheck.ts` | form → Flex `contents` |
| `lib/line/auto-response.ts` | build outgoing message from rule payload |
| `lib/access.ts` | `keywordResponseRuleWhere`, `keywordResponseRuleByIdWhere`, `unmatchedMessageWhere` |
| `app/api/webhook/line/[channelId]/route.ts` | message event branch |
| `app/api/line-accounts/[id]/auto-response/route.ts` | GET/PATCH settings |
| `app/api/line-accounts/[id]/keyword-rules/route.ts` | GET/POST list/create |
| `app/api/line-accounts/[id]/keyword-rules/[ruleId]/route.ts` | GET/PATCH/DELETE |
| `app/(app)/line-accounts/[id]/auto-response/page.tsx` | server page shell |
| `app/(app)/line-accounts/[id]/auto-response/AutoResponseSettings.tsx` | client settings + rules UI |
| `app/(app)/line-accounts/[id]/auto-response/KeywordRuleForm.tsx` | create/edit modal |
| `app/(app)/line-accounts/[id]/page.tsx` | link to auto-response page |

---

### Task 1: Schema + Prisma client

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260827150000_keyword_auto_response/migration.sql`

**Interfaces:**
- Produces: Prisma models `KeywordResponseRule`, `UnmatchedMessage`; enums `KeywordResponseType`, `FlexMessageSource`; `LineAccount.autoResponseEnabled`, `LineAccount.fallbackMessage`

- [ ] **Step 1: Add enums and extend `LineAccount`**

In `prisma/schema.prisma`, after existing enums:

```prisma
enum KeywordResponseType {
  TEXT
  FLEX
}

enum FlexMessageSource {
  FORM
  JSON
}
```

On `LineAccount` model add:

```prisma
  autoResponseEnabled Boolean @default(false)
  fallbackMessage     String? @db.Text

  keywordResponseRules KeywordResponseRule[]
  unmatchedMessages    UnmatchedMessage[]
```

- [ ] **Step 2: Add `KeywordResponseRule` model**

```prisma
model KeywordResponseRule {
  id              String              @id @default(cuid())
  lineAccountId   String
  keyword         String
  isEnabled       Boolean             @default(true)
  responseType    KeywordResponseType
  responsePayload Json
  flexSource      FlexMessageSource?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  lineAccount LineAccount @relation(fields: [lineAccountId], references: [id], onDelete: Cascade)

  @@unique([lineAccountId, keyword])
  @@index([lineAccountId, isEnabled])
}
```

- [ ] **Step 3: Add `UnmatchedMessage` model**

```prisma
model UnmatchedMessage {
  id            String   @id @default(cuid())
  lineAccountId String
  lineUserId    String
  messageText   String   @db.Text
  createdAt     DateTime @default(now())

  lineAccount LineAccount @relation(fields: [lineAccountId], references: [id], onDelete: Cascade)

  @@index([lineAccountId, createdAt])
}
```

- [ ] **Step 4: Migration SQL**

```sql
ALTER TABLE `LineAccount`
  ADD COLUMN `autoResponseEnabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `fallbackMessage` TEXT NULL;

CREATE TABLE `KeywordResponseRule` (
  `id` VARCHAR(191) NOT NULL,
  `lineAccountId` VARCHAR(191) NOT NULL,
  `keyword` VARCHAR(191) NOT NULL,
  `isEnabled` BOOLEAN NOT NULL DEFAULT true,
  `responseType` ENUM('TEXT', 'FLEX') NOT NULL,
  `responsePayload` JSON NOT NULL,
  `flexSource` ENUM('FORM', 'JSON') NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `KeywordResponseRule_lineAccountId_keyword_key`(`lineAccountId`, `keyword`),
  INDEX `KeywordResponseRule_lineAccountId_isEnabled_idx`(`lineAccountId`, `isEnabled`),
  CONSTRAINT `KeywordResponseRule_lineAccountId_fkey`
    FOREIGN KEY (`lineAccountId`) REFERENCES `LineAccount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `UnmatchedMessage` (
  `id` VARCHAR(191) NOT NULL,
  `lineAccountId` VARCHAR(191) NOT NULL,
  `lineUserId` VARCHAR(191) NOT NULL,
  `messageText` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `UnmatchedMessage_lineAccountId_createdAt_idx`(`lineAccountId`, `createdAt`),
  CONSTRAINT `UnmatchedMessage_lineAccountId_fkey`
    FOREIGN KEY (`lineAccountId`) REFERENCES `LineAccount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

- [ ] **Step 5: Generate client**

Run: `npx prisma generate`  
Expected: client includes new models under `app/generated/prisma/`

---

### Task 2: LINE reply + keyword matching helpers

**Files:**
- Modify: `lib/line/types.ts`
- Modify: `lib/line/client.ts`
- Create: `lib/line/keyword-match.ts`, `lib/line/keyword-match.selfcheck.ts`
- Create: `lib/line/auto-response.ts`

**Interfaces:**
- Consumes: Prisma `KeywordResponseRule` type from generated client
- Produces:
  - `LineOutgoingMessage` in `lib/line/types.ts`
  - `replyMessage(accessToken, replyToken, messages): Promise<void>` in `lib/line/client.ts`
  - `normalizeKeyword(text: string): string` in `lib/line/keyword-match.ts`
  - `findMatchingRule(rules, incomingText): KeywordResponseRule | null`
  - `ruleToOutgoingMessage(rule): LineOutgoingMessage | null` in `lib/line/auto-response.ts`

- [ ] **Step 1: Add outgoing message type**

In `lib/line/types.ts`:

```ts
export type LineOutgoingMessage =
  | { type: "text"; text: string }
  | {
      type: "flex";
      altText: string;
      contents: Record<string, unknown>;
    };
```

- [ ] **Step 2: Add `replyMessage` to `lib/line/client.ts`**

```ts
import type { LineOutgoingMessage } from "./types";

export async function replyMessage(
  accessToken: string,
  replyToken: string,
  messages: LineOutgoingMessage[],
): Promise<void> {
  const res = await lineFetch("/message/reply", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ replyToken, messages }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LINE API replyMessage: ${res.status} ${err}`);
  }
}
```

- [ ] **Step 3: Create `lib/line/keyword-match.ts`**

```ts
import type { KeywordResponseRule } from "@/app/generated/prisma/client";

export function normalizeKeyword(text: string): string {
  return text.trim().toLowerCase();
}

export function findMatchingRule(
  rules: Pick<KeywordResponseRule, "keyword" | "isEnabled"> &
    KeywordResponseRule[],
  incomingText: string,
): KeywordResponseRule | null {
  const normalized = normalizeKeyword(incomingText);
  if (!normalized) return null;

  return (
    rules.find(
      (rule) => rule.isEnabled && rule.keyword === normalized,
    ) ?? null
  );
}
```

Fix the type: use `KeywordResponseRule[]` only:

```ts
export function findMatchingRule(
  rules: KeywordResponseRule[],
  incomingText: string,
): KeywordResponseRule | null {
  const normalized = normalizeKeyword(incomingText);
  if (!normalized) return null;
  return rules.find((r) => r.isEnabled && r.keyword === normalized) ?? null;
}
```

- [ ] **Step 4: Create `lib/line/auto-response.ts`**

```ts
import type { KeywordResponseRule } from "@/app/generated/prisma/client";

import type { LineOutgoingMessage } from "./types";

type TextPayload = { text: string };
type FlexPayload = { altText: string; contents: Record<string, unknown> };

export function ruleToOutgoingMessage(
  rule: Pick<KeywordResponseRule, "responseType" | "responsePayload">,
): LineOutgoingMessage | null {
  const payload = rule.responsePayload as TextPayload | FlexPayload;

  if (rule.responseType === "TEXT") {
    const text = (payload as TextPayload).text?.trim();
    if (!text) return null;
    return { type: "text", text };
  }

  const flex = payload as FlexPayload;
  if (!flex.altText?.trim() || !flex.contents) return null;

  return {
    type: "flex",
    altText: flex.altText.trim(),
    contents: flex.contents,
  };
}
```

- [ ] **Step 5: Self-check `lib/line/keyword-match.selfcheck.ts`**

```ts
import assert from "node:assert/strict";

import { findMatchingRule, normalizeKeyword } from "./keyword-match";

assert.equal(normalizeKeyword("  Hello "), "hello");
assert.equal(normalizeKeyword("สวัสดี"), "สวัสดี");

const rules = [
  {
    id: "1",
    lineAccountId: "oa",
    keyword: "help",
    isEnabled: true,
    responseType: "TEXT" as const,
    responsePayload: { text: "ok" },
    flexSource: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

assert.equal(findMatchingRule(rules, "  HELP "), rules[0]);
assert.equal(findMatchingRule(rules, "other"), null);
assert.equal(
  findMatchingRule([{ ...rules[0], isEnabled: false }], "help"),
  null,
);
```

Run: `node --import tsx lib/line/keyword-match.selfcheck.ts`  
Expected: exit 0, no output

---

### Task 3: Zod schemas + Flex builder

**Files:**
- Create: `lib/line/message-schema.ts`
- Create: `lib/line/flex-builder.ts`, `lib/line/flex-builder.selfcheck.ts`

**Interfaces:**
- Produces:
  - `autoResponseSettingsSchema`, `createKeywordRuleSchema`, `updateKeywordRuleSchema`
  - `buildFlexPayloadFromForm(input): { altText: string; contents: Record<string, unknown> }`
  - `buildFlexPayloadFromJson(altText, contentsJson): same`

- [ ] **Step 1: Settings + text payload schemas in `lib/line/message-schema.ts`**

```ts
import { z } from "zod";

export const autoResponseSettingsSchema = z.object({
  autoResponseEnabled: z.boolean(),
  fallbackMessage: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
});

const httpsUrl = z.string().url().refine((u) => u.startsWith("https://"), {
  message: "URL ต้องขึ้นต้นด้วย https://",
});

export const flexCardSchema = z.object({
  imageUrl: httpsUrl.optional().or(z.literal("").transform(() => undefined)),
  title: z.string().trim().optional(),
  body: z.string().trim().min(1, "กรุณาระบุเนื้อหา"),
  actionLabel: z.string().trim().optional(),
  actionUri: httpsUrl.optional(),
});

export const flexSingleFormSchema = z.object({
  pattern: z.literal("single"),
  altText: z.string().trim().min(1, "กรุณาระบุ altText"),
  card: flexCardSchema,
});

export const flexCarouselFormSchema = z.object({
  pattern: z.literal("carousel"),
  altText: z.string().trim().min(1, "กรุณาระบุ altText"),
  cards: z.array(flexCardSchema).min(2, "อย่างน้อย 2 การ์ด").max(3),
});

export const flexJsonFormSchema = z.object({
  pattern: z.literal("json"),
  altText: z.string().trim().min(1, "กรุณาระบุ altText"),
  contentsJson: z.string().trim().min(2, "กรุณาวาง Flex JSON"),
});

export const flexFormSchema = z.discriminatedUnion("pattern", [
  flexSingleFormSchema,
  flexCarouselFormSchema,
  flexJsonFormSchema,
]);

export const createKeywordRuleSchema = z
  .object({
    keyword: z.string().trim().min(1, "กรุณาระบุ keyword"),
    isEnabled: z.boolean().default(true),
    responseType: z.enum(["TEXT", "FLEX"]),
    text: z.string().trim().optional(),
    flex: flexFormSchema.optional(),
  })
  .superRefine((val, ctx) => {
    if (val.responseType === "TEXT") {
      if (!val.text?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "กรุณาระบุข้อความตอบกลับ",
          path: ["text"],
        });
      }
    } else if (!val.flex) {
      ctx.addIssue({
        code: "custom",
        message: "กรุณากำหนด Flex Message",
        path: ["flex"],
      });
    }
  });

export const updateKeywordRuleSchema = createKeywordRuleSchema.partial();

export const storedTextPayloadSchema = z.object({
  text: z.string().trim().min(1).max(5000),
});

export const storedFlexPayloadSchema = z.object({
  altText: z.string().trim().min(1),
  contents: z.record(z.string(), z.unknown()),
});
```

- [ ] **Step 2: Flex builder in `lib/line/flex-builder.ts`**

```ts
import type { z } from "zod";

import type { flexCardSchema, flexFormSchema } from "./message-schema";

type FlexCard = z.infer<typeof flexCardSchema>;
type FlexForm = z.infer<typeof flexFormSchema>;

function bubbleFromCard(card: FlexCard): Record<string, unknown> {
  const bodyContents: Record<string, unknown>[] = [];

  if (card.title) {
    bodyContents.push({
      type: "text",
      text: card.title,
      weight: "bold",
      size: "lg",
      wrap: true,
    });
  }
  bodyContents.push({
    type: "text",
    text: card.body,
    wrap: true,
  });

  const bubble: Record<string, unknown> = {
    type: "bubble",
    body: { type: "box", layout: "vertical", contents: bodyContents },
  };

  if (card.imageUrl) {
    bubble.hero = {
      type: "image",
      url: card.imageUrl,
      size: "full",
      aspectRatio: "20:13",
      aspectMode: "cover",
    };
  }

  if (card.actionLabel && card.actionUri) {
    bubble.footer = {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: card.actionLabel,
            uri: card.actionUri,
          },
        },
      ],
    };
  }

  return bubble;
}

export function buildFlexPayloadFromForm(
  flex: FlexForm,
): { altText: string; contents: Record<string, unknown> } {
  if (flex.pattern === "single") {
    return {
      altText: flex.altText,
      contents: bubbleFromCard(flex.card),
    };
  }

  if (flex.pattern === "carousel") {
    return {
      altText: flex.altText,
      contents: {
        type: "carousel",
        contents: flex.cards.map(bubbleFromCard),
      },
    };
  }

  const parsed = JSON.parse(flex.contentsJson) as Record<string, unknown>;
  return { altText: flex.altText, contents: parsed };
}
```

Wrap `JSON.parse` in API route with try/catch → 400 `Flex JSON ไม่ถูกต้อง`.

- [ ] **Step 3: Self-check `lib/line/flex-builder.selfcheck.ts`**

Assert single bubble has `type: "bubble"`, carousel has `type: "carousel"` with 2 contents, optional hero when imageUrl set.

Run: `node --import tsx lib/line/flex-builder.selfcheck.ts`

---

### Task 4: Access control helpers

**Files:**
- Modify: `lib/access.ts`

**Interfaces:**
- Produces:
  - `keywordResponseRuleWhere(user): Prisma.KeywordResponseRuleWhereInput`
  - `keywordResponseRuleByIdWhere(user, id)`
  - `unmatchedMessageWhere(user)`

- [ ] **Step 1: Add scope helpers**

```ts
export function keywordResponseRuleWhere(
  user: UserWithAssignments,
): Prisma.KeywordResponseRuleWhereInput {
  if (isSystemAdmin(user)) return {};

  return {
    lineAccount: {
      assignments: { some: { userId: user.id } },
    },
  };
}

export function keywordResponseRuleByIdWhere(
  user: UserWithAssignments,
  id: string,
): Prisma.KeywordResponseRuleWhereInput {
  return { id, ...keywordResponseRuleWhere(user) };
}

export function unmatchedMessageWhere(
  user: UserWithAssignments,
): Prisma.UnmatchedMessageWhereInput {
  if (isSystemAdmin(user)) return {};

  return {
    lineAccount: {
      assignments: { some: { userId: user.id } },
    },
  };
}
```

---

### Task 5: Webhook auto-response pipeline

**Files:**
- Modify: `app/api/webhook/line/[channelId]/route.ts`

**Interfaces:**
- Consumes: `replyMessage`, `findMatchingRule`, `normalizeKeyword`, `ruleToOutgoingMessage`, `decryptSecret`
- Produces: inline handler `handleTextMessageEvent(...)` or extracted to `lib/line/handle-auto-response.ts` if route grows

- [ ] **Step 1: Widen event type and load account fields**

Change `lineAccount` select to include:

```ts
select: {
  id: true,
  channelSecret: true,
  accessToken: true,
  autoResponseEnabled: true,
  fallbackMessage: true,
},
```

Extend parsed event type:

```ts
events?: Array<{
  type: string;
  replyToken?: string;
  source?: { type?: string; userId?: string };
  postback?: { data?: string };
  message?: { type?: string; text?: string };
}>;
```

- [ ] **Step 2: Add message branch after postback loop**

For each event where `event.type === "message"` && `event.message?.type === "text"`:

```ts
async function handleAutoResponse(
  lineAccount: {
    id: string;
    accessToken: string;
    autoResponseEnabled: boolean;
    fallbackMessage: string | null;
  },
  event: {
    replyToken?: string;
    source?: { type?: string; userId?: string };
    message?: { text?: string };
  },
): Promise<void> {
  if (!lineAccount.autoResponseEnabled) return;
  if (event.source?.type !== "user" || !event.source.userId) return;
  if (!event.replyToken) return;

  const rawText = event.message?.text ?? "";
  if (!rawText.trim()) return;

  const rules = await prisma.keywordResponseRule.findMany({
    where: { lineAccountId: lineAccount.id, isEnabled: true },
  });

  const match = findMatchingRule(rules, rawText);
  const accessToken = decryptSecret(lineAccount.accessToken);

  if (match) {
    const msg = ruleToOutgoingMessage(match);
    if (!msg) {
      console.error("auto-response: invalid rule payload", match.id);
      return;
    }
    try {
      await replyMessage(accessToken, event.replyToken, [msg]);
    } catch (e) {
      console.error("auto-response: reply failed (match)", e);
    }
    return;
  }

  await prisma.unmatchedMessage.create({
    data: {
      lineAccountId: lineAccount.id,
      lineUserId: event.source.userId,
      messageText: rawText,
    },
  });

  const fallback = lineAccount.fallbackMessage?.trim();
  if (!fallback) return;

  try {
    await replyMessage(accessToken, event.replyToken, [
      { type: "text", text: fallback },
    ]);
  } catch (e) {
    console.error("auto-response: reply failed (fallback)", e);
  }
}
```

Call `await handleAutoResponse(lineAccount, event)` inside the events loop (separate from postback `continue` logic — message events should not require postback fields).

Keep postback loop unchanged; add parallel handling:

```ts
for (const event of events) {
  // existing postback block ...

  if (event.type === "message" && event.message?.type === "text") {
    await handleAutoResponse(lineAccount, event);
  }
}
```

---

### Task 6: Auto-response settings API

**Files:**
- Create: `app/api/line-accounts/[id]/auto-response/route.ts`

**Interfaces:**
- Consumes: `lineAccountByIdWhere`, `autoResponseSettingsSchema`
- Produces: GET `{ autoResponseEnabled, fallbackMessage }`; PATCH same shape

- [ ] **Step 1: GET handler**

```ts
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await prisma.lineAccount.findFirst({
    where: lineAccountByIdWhere(user, id),
    select: { autoResponseEnabled: true, fallbackMessage: true },
  });
  if (!account) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  return NextResponse.json(account);
}
```

- [ ] **Step 2: PATCH handler**

Parse body with `autoResponseSettingsSchema`; update `LineAccount`; return updated settings.

---

### Task 7: Keyword rules CRUD API

**Files:**
- Create: `app/api/line-accounts/[id]/keyword-rules/route.ts`
- Create: `app/api/line-accounts/[id]/keyword-rules/[ruleId]/route.ts`

**Interfaces:**
- Consumes: `createKeywordRuleSchema`, `updateKeywordRuleSchema`, `normalizeKeyword`, `buildFlexPayloadFromForm`, `storedTextPayloadSchema`, `storedFlexPayloadSchema`
- Produces: REST CRUD; duplicate keyword → `409` `{ error: "keyword นี้มีอยู่แล้ว" }`

- [ ] **Step 1: Shared helper `parseRuleBody(body)`**

Returns `{ keyword, isEnabled, responseType, responsePayload, flexSource }`:

```ts
function buildStoredPayload(parsed: z.infer<typeof createKeywordRuleSchema>) {
  const keyword = normalizeKeyword(parsed.keyword);
  if (!keyword) throw new Error("EMPTY_KEYWORD");

  if (parsed.responseType === "TEXT") {
    const payload = storedTextPayloadSchema.parse({ text: parsed.text });
    return {
      keyword,
      isEnabled: parsed.isEnabled ?? true,
      responseType: "TEXT" as const,
      responsePayload: payload,
      flexSource: null,
    };
  }

  let flexPayload;
  try {
    flexPayload = buildFlexPayloadFromForm(parsed.flex!);
  } catch {
    throw new Error("INVALID_FLEX");
  }
  const payload = storedFlexPayloadSchema.parse(flexPayload);
  const flexSource = parsed.flex!.pattern === "json" ? "JSON" : "FORM";

  return {
    keyword,
    isEnabled: parsed.isEnabled ?? true,
    responseType: "FLEX" as const,
    responsePayload: payload,
    flexSource,
  };
}
```

- [ ] **Step 2: GET list** — scoped rules for account, order by `keyword asc`, select public fields.

- [ ] **Step 3: POST create** — verify account access; try create; catch Prisma `P2002` → 409.

- [ ] **Step 4: `[ruleId]/route.ts`** — GET/PATCH/DELETE with `keywordResponseRuleByIdWhere(user, ruleId)` and verify `rule.lineAccountId === id`.

List GET response shape:

```ts
{
  rules: Array<{
    id: string;
    keyword: string;
    isEnabled: boolean;
    responseType: "TEXT" | "FLEX";
    flexSource: "FORM" | "JSON" | null;
  }>;
}
```

Detail GET includes `responsePayload` for edit form.

---

### Task 8: Auto-response UI

**Files:**
- Create: `app/(app)/line-accounts/[id]/auto-response/page.tsx`
- Create: `app/(app)/line-accounts/[id]/auto-response/AutoResponseSettings.tsx`
- Create: `app/(app)/line-accounts/[id]/auto-response/KeywordRuleForm.tsx`
- Modify: `app/(app)/line-accounts/[id]/page.tsx`

**Interfaces:**
- Consumes: API routes from Tasks 6–7
- Produces: working management UI at `/line-accounts/[id]/auto-response`

- [ ] **Step 1: Server page**

Load account with `lineAccountByIdWhere`; `notFound()` if missing. Pass `lineAccountId`, `channelId`, `webhookUrl`, initial settings, initial rules list (query DB directly on server — same as other pages).

Use `PageShell` + `PageHeader` title `Auto-response` description `จัดการ keyword ตอบกลับอัตโนมัติ`.

Back link: `href={`/line-accounts/${id}`}`.

- [ ] **Step 2: `AutoResponseSettings.tsx` (client)**

Sections:

1. **Callout** (warning color): `ปิด Auto-reply ใน LINE OA Manager แล้วตั้ง Webhook URL ของระบบนี้` + copy webhook URL button (reuse pattern from `LineAccountWebhookCopy` or pass `webhookUrl` prop).

2. **Settings card:** Switch `autoResponseEnabled`; Textarea `fallbackMessage`; Save → PATCH `/api/line-accounts/[id]/auto-response`; toast success/error.

3. **Rules table:** columns keyword, type chip (TEXT/FLEX), Switch isEnabled → PATCH rule `{ isEnabled }`, Edit opens modal, Delete with confirm → DELETE.

4. **Button** `เพิ่ม Keyword` → opens `KeywordRuleForm` in create mode.

- [ ] **Step 3: `KeywordRuleForm.tsx` (client modal)**

Fields per spec:

- keyword
- responseType radio: Text | Flex
- Text: textarea
- Flex: Select pattern `single | carousel | json`
  - single: altText + card fields (imageUrl, title, body, actionLabel, actionUri)
  - carousel: altText + 2–3 card field groups (add/remove card buttons, clamp 2–3)
  - json: altText + contentsJson textarea
- isEnabled switch (default on)

Submit → POST or PATCH; close modal + refresh router on success.

- [ ] **Step 4: Link from OA detail page**

In `app/(app)/line-accounts/[id]/page.tsx` `PageHeader` actions, add:

```tsx
<Button as={NextLink} href={`/line-accounts/${account.id}/auto-response`} variant="bordered">
  Auto-response
</Button>
```

Place before or after Webhook button.

---

### Task 9: Verification

**Files:** (run only)

- [ ] **Step 1: Run self-checks**

```bash
node --import tsx lib/line/keyword-match.selfcheck.ts
node --import tsx lib/line/flex-builder.selfcheck.ts
```

Expected: exit 0

- [ ] **Step 2: Lint touched files**

```bash
npm run lint
```

- [ ] **Step 3: Manual smoke (dev + LINE OA)**

1. Master switch off → text in LINE → no reply, no `UnmatchedMessage` row
2. Create text rule keyword `help` → message `help` → reply text
3. Create flex single card rule → keyword match → bubble in LINE
4. Unknown text + fallback set → fallback reply + `UnmatchedMessage` row
5. Unknown text + no fallback → row only
6. Rich Menu postback → `ClickEvent` still created
7. Non-assigned user → API 404

---

## Spec coverage (self-review)

| Spec requirement | Task |
|---|---|
| Extend webhook, keep postback | Task 5 |
| Exact keyword match | Task 2 |
| Text + Flex replies | Tasks 2–3, 5 |
| Flex form patterns + JSON | Task 3, 8 |
| Master switch + per-rule enable | Task 1, 5, 6, 8 |
| Fallback + unmatched log | Task 1, 5 |
| No unmatched UI | — (omitted by design) |
| 1:1 only | Task 5 |
| Access control | Task 4, 6, 7 |
| Settings + rules API | Tasks 6–7 |
| Management UI | Task 8 |
| replyMessage in client | Task 2 |
| Self-checks | Tasks 2–3, 9 |

No placeholders. Types consistent: `LineOutgoingMessage`, `normalizeKeyword`, `buildFlexPayloadFromForm`, `ruleToOutgoingMessage` defined before use.
