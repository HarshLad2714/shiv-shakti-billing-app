import test from "node:test";
import assert from "node:assert/strict";
import { billKey, billsNeedPush, mergeBills } from "./billSync.js";

test("bills from two devices stay together", () => {
  const merged = mergeBills(
    [{ id: "a", billNo: 1, dateTime: "2026-10-25T08:00:00.000Z", grandTotal: 100 }],
    [{ id: "b", billNo: 1, dateTime: "2026-10-25T09:00:00.000Z", grandTotal: 80 }],
  );
  assert.deepEqual(merged.map((bill) => bill.id), ["b", "a"]);
});

test("the same bill is kept once", () => {
  const bill = { id: "a", billNo: 2, dateTime: "2026-10-25T08:00:00.000Z" };
  assert.equal(mergeBills([bill], [bill]).length, 1);
});

test("older bills without an id stay distinct", () => {
  const first = { billNo: 4, dateTime: "2026-10-20T08:00:00.000Z" };
  const second = { billNo: 4, dateTime: "2026-10-21T08:00:00.000Z" };
  assert.notEqual(billKey(first), billKey(second));
  assert.equal(mergeBills([first], [second]).length, 2);
});

test("a device pushes only bills the live site does not have", () => {
  const local = [{ id: "a", dateTime: "2026-10-25T08:00:00.000Z" }];
  assert.equal(billsNeedPush(local, []), true);
  assert.equal(billsNeedPush(local, local), false);
  assert.equal(billsNeedPush([], [{ id: "a", dateTime: "2026-10-25T08:00:00.000Z" }]), false);
});
