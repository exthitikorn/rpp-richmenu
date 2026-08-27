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
