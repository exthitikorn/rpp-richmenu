import assert from "node:assert/strict";

import {
  parseDashboardRange,
  rangeLabel,
  rangeStartDate,
} from "./dashboard-range";

assert.equal(parseDashboardRange(undefined), "30");
assert.equal(parseDashboardRange("7"), "7");
assert.equal(parseDashboardRange("nope"), "30");
assert.equal(parseDashboardRange(["1", "7"]), "1");

const noon = new Date("2026-08-25T12:00:00");

assert.equal(rangeStartDate("all", noon), null);

const todayStart = rangeStartDate("1", noon)!;

assert.equal(todayStart.getHours(), 0);
assert.equal(todayStart.getDate(), 25);

const seven = rangeStartDate("7", noon)!;

assert.equal(seven.getDate(), 18);

assert.equal(rangeLabel("30"), "30 วันล่าสุด");

// console.log("dashboard-range.selfcheck: ok");
