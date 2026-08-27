import assert from "node:assert/strict";

import {
  emptyBubble,
  flexContentsSchema,
  unwrapFlexJson,
} from "./flex-contents";

assert.equal(emptyBubble().type, "bubble");
assert.ok(flexContentsSchema.safeParse(emptyBubble()).success);

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

// Simulator-style extras must be accepted
assert.ok(
  flexContentsSchema.safeParse({
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      contents: [{ type: "text", text: "h" }],
    },
    hero: {
      type: "image",
      url: "https://example.com/a.jpg",
      size: "full",
      aspectMode: "cover",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "hi" },
        { type: "video", url: "https://example.com/a.mp4" },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          action: { type: "uri", label: "Open", uri: "https://example.com" },
        },
      ],
    },
    styles: { body: { backgroundColor: "#FFFFFF" } },
  }).success,
);

assert.ok(
  flexContentsSchema.safeParse({
    type: "carousel",
    contents: [emptyBubble(), emptyBubble()],
  }).success,
);

assert.equal(
  flexContentsSchema.safeParse({
    type: "carousel",
    contents: [emptyBubble()],
  }).success,
  false,
);

assert.equal(flexContentsSchema.safeParse({ type: "flex" }).success, false);

{
  const wrapped = unwrapFlexJson({
    type: "flex",
    altText: "hello",
    contents: emptyBubble(),
  });

  assert.equal(wrapped.altText, "hello");
  assert.ok(flexContentsSchema.safeParse(wrapped.contents).success);
}

// console.log("flex-contents.selfcheck: ok");
