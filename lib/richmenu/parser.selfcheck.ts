import assert from "node:assert/strict";

import {
  LINE_RICH_MENU_IMAGE_MAX_BYTES,
  validateImageByteSize,
} from "./parser";

assert.equal(LINE_RICH_MENU_IMAGE_MAX_BYTES, 1024 * 1024);

assert.doesNotThrow(() => validateImageByteSize(1024 * 1024));
assert.doesNotThrow(() => validateImageByteSize(1));

assert.throws(
  () => validateImageByteSize(1024 * 1024 + 1),
  (err: unknown) =>
    err instanceof Error &&
    err.message.includes("1 MB") &&
    err.message.includes("LINE"),
);

// console.log("lib/richmenu/parser image byte size: ok");
