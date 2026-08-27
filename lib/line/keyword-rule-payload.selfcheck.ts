import assert from "node:assert/strict";

import { emptyBubble } from "./flex-contents";
import { buildStoredKeywordRulePayload } from "./keyword-rule-payload";

const text = buildStoredKeywordRulePayload({
  keyword: "  Hello ",
  isEnabled: true,
  responseType: "TEXT",
  text: "สวัสดี",
});

assert.equal(text.keyword, "hello");
assert.equal(text.flexSource, null);

const flex = buildStoredKeywordRulePayload({
  keyword: "menu",
  isEnabled: true,
  responseType: "FLEX",
  flex: {
    altText: "เมนู",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [{ type: "text", text: "หัว" }],
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [{ type: "text", text: "เนื้อหา" }],
      },
    },
  },
});

assert.equal(flex.flexSource, "JSON");
assert.equal((flex.responsePayload as { altText: string }).altText, "เมนู");

{
  let threw = false;

  try {
    buildStoredKeywordRulePayload({
      keyword: "x",
      isEnabled: true,
      responseType: "FLEX",
      flex: { altText: "bad", contents: { type: "flex" } },
    } as unknown as Parameters<typeof buildStoredKeywordRulePayload>[0]);
  } catch {
    threw = true;
  }

  assert.equal(threw, true);
}

{
  let threw = false;

  try {
    buildStoredKeywordRulePayload({
      keyword: "x",
      isEnabled: true,
      responseType: "FLEX",
      flex: { altText: "a".repeat(1501), contents: emptyBubble() },
    });
  } catch {
    threw = true;
  }

  assert.equal(threw, true);
}

console.log("keyword-rule-payload.selfcheck: ok");
