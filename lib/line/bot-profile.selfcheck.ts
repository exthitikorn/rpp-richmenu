import assert from "node:assert/strict";

import { botInfoToProfile } from "./bot-profile";

assert.deepEqual(
  botInfoToProfile({ displayName: "  My OA  ", pictureUrl: " https://x/y " }),
  { name: "My OA", pictureUrl: "https://x/y" },
);

assert.deepEqual(botInfoToProfile({ displayName: "OA" }), {
  name: "OA",
  pictureUrl: null,
});

assert.deepEqual(botInfoToProfile({ displayName: "OA", pictureUrl: "   " }), {
  name: "OA",
  pictureUrl: null,
});

assert.throws(
  () => botInfoToProfile({ displayName: "   " }),
  /ไม่สามารถดึงข้อมูลโปรไฟล์จาก LINE ได้/,
);

// console.log("bot-profile self-check ok");
