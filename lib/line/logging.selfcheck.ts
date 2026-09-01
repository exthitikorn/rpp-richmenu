import assert from "node:assert/strict";

import { getClientIp } from "./logging";

function mockRequest(headers: Record<string, string>): Request {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as Request;
}

assert.equal(
  getClientIp(mockRequest({ "x-forwarded-for": "203.0.113.1, 198.51.100.2" })),
  "203.0.113.1",
);
assert.equal(
  getClientIp(mockRequest({ "x-real-ip": "203.0.113.2" })),
  "203.0.113.2",
);
assert.equal(getClientIp(mockRequest({})), "unknown");

// console.log("logging.selfcheck: ok");
