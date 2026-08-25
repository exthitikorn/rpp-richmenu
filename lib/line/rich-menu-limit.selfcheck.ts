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
