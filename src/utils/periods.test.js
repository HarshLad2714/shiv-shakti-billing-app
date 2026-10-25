import test from "node:test";
import assert from "node:assert/strict";
import { periodRange } from "./periods.js";

test("daily range is today in India time", () => {
  const range = periodRange("day", new Date("2026-10-25T12:00:00Z"));
  assert.deepEqual(range, { from: "2026-10-25", to: "2026-10-25" });
});

test("weekly range runs Monday through Sunday", () => {
  const range = periodRange("week", new Date("2026-10-25T12:00:00Z"));
  assert.deepEqual(range, { from: "2026-10-19", to: "2026-10-25" });
});

test("yearly range is the India calendar year", () => {
  const range = periodRange("year", new Date("2026-10-25T12:00:00Z"));
  assert.deepEqual(range, { from: "2026-01-01", to: "2026-12-31" });
});

test("Monday just after midnight India time starts a new week", () => {
  const range = periodRange("week", new Date("2026-10-18T18:30:00Z"));
  assert.deepEqual(range, { from: "2026-10-19", to: "2026-10-25" });
});
