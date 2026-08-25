import assert from "node:assert/strict";

import { channelIdsMatch } from "./verify-credentials";

assert.equal(channelIdsMatch("1573163733", "1573163733"), true);
assert.equal(channelIdsMatch(" 1573163733 ", "1573163733"), true);
assert.equal(channelIdsMatch("1573163733", "999"), false);

// console.log("verify-credentials self-check ok");
