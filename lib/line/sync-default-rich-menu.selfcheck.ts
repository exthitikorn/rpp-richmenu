/**
 * Runnable self-check for sync-default phase order + hint copy.
 * Run: npx --yes tsx lib/line/sync-default-rich-menu.selfcheck.ts
 */
import assert from "node:assert/strict";

import { SYNC_DEFAULT_PHASES, syncDefaultHint } from "./sync-default-rich-menu";

assert.deepEqual(
  [...SYNC_DEFAULT_PHASES],
  ["setDefault", "refreshFollowers", "linkExtras"],
);
assert.equal(SYNC_DEFAULT_PHASES[0], "setDefault");
assert.ok(
  !SYNC_DEFAULT_PHASES.includes("clearDefault" as never),
  "must not clear default before set",
);

const unavailable = syncDefaultHint({
  followerSync: "unavailable",
  followerCount: 0,
  linkedExtraUserIds: [],
});

assert.ok(unavailable.includes("บังคับอัปเดต"));

const linked = syncDefaultHint({
  followerSync: "unavailable",
  followerCount: 0,
  linkedExtraUserIds: ["Uxxx"],
});

assert.ok(linked.includes("โปรไฟล์"));

// console.log("sync-default-rich-menu.selfcheck: ok");
