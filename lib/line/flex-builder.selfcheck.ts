import assert from "node:assert/strict";

import { buildFlexPayloadFromForm } from "./flex-builder";

const single = buildFlexPayloadFromForm({
  pattern: "single",
  altText: "card",
  card: {
    title: "Title",
    body: "Body text",
    imageUrl: "https://example.com/a.jpg",
    actionLabel: "Open",
    actionUri: "https://example.com",
  },
});

assert.equal((single.contents as { type: string }).type, "bubble");
assert.ok((single.contents as { hero?: unknown }).hero);

const carousel = buildFlexPayloadFromForm({
  pattern: "carousel",
  altText: "carousel",
  cards: [{ body: "One" }, { body: "Two" }],
});

assert.equal((carousel.contents as { type: string }).type, "carousel");
assert.equal(
  ((carousel.contents as { contents: unknown[] }).contents ?? []).length,
  2,
);

const json = buildFlexPayloadFromForm({
  pattern: "json",
  altText: "custom",
  contentsJson:
    '{"type":"bubble","body":{"type":"box","layout":"vertical","contents":[{"type":"text","text":"hi"}]}}',
});

assert.equal((json.contents as { type: string }).type, "bubble");
