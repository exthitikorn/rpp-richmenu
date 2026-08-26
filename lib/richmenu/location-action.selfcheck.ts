import assert from "node:assert/strict";

import { normalizeRichMenuAction } from "../line/types";

import { parseRichMenuJson } from "./parser";

const json = JSON.stringify({
  size: { width: 2500, height: 1686 },
  name: "Loc test",
  chatBarText: "Menu",
  areas: [
    {
      bounds: { x: 0, y: 0, width: 1250, height: 843 },
      action: { type: "location", label: "Share" },
    },
  ],
});

const parsed = parseRichMenuJson(json);

assert.equal(parsed.areas[0]?.action.type, "location");
assert.equal((parsed.areas[0]?.action as { label?: string }).label, "Share");

const normalized = normalizeRichMenuAction("location", { label: "Share" });

assert.equal(normalized.type, "location");
assert.equal((normalized as { label?: string }).label, "Share");

const bare = normalizeRichMenuAction("location", {});

assert.equal(bare.type, "location");
assert.equal("label" in bare, false);
