import assert from "node:assert/strict";

import {
  emptyBubble,
  emptyCarousel,
  flexContentsSchema,
} from "./flex-contents";

assert.equal(emptyBubble().type, "bubble");
assert.equal(emptyCarousel().type, "carousel");
assert.equal(emptyCarousel().contents.length, 2);
assert.ok(flexContentsSchema.safeParse(emptyBubble()).success);
assert.ok(flexContentsSchema.safeParse(emptyCarousel()).success);

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
    type: "bubble",
    body: { type: "box", layout: "vertical", contents: [] },
  }).success,
  false,
);

assert.equal(
  flexContentsSchema.safeParse({
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [{ type: "text", text: "h" }],
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [{ type: "text", text: "hi" }],
    },
  }).success,
  false,
);

assert.equal(
  flexContentsSchema.safeParse({
    type: "bubble",
    styles: { body: { backgroundColor: "#fff" } },
    body: {
      type: "box",
      layout: "vertical",
      contents: [{ type: "text", text: "hi" }],
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
