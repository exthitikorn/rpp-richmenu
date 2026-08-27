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
assert.equal((flex.responsePayload as { altText: string }).altText, "เมนู");

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
