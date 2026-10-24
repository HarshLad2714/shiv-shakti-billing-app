import test from "node:test";
import assert from "node:assert/strict";
import { computeTotals, lineAmount, money } from "./calc.js";

test("half kilogram line", () => {
  assert.equal(lineAmount(300, 0.5), 150);
});

test("litre fraction", () => {
  assert.equal(lineAmount(180, 0.2), 36);
});

test("spec example without tax", () => {
  const totals = computeTotals({
    lines: [
      { price: 300, qty: 1 },
      { price: 180, qty: 1 },
    ],
    discountType: "flat",
    discountValue: 0,
    gstEnabled: false,
    gstPercent: 5,
    roundOff: false,
  });
  assert.equal(totals.subtotal, 480);
  assert.equal(totals.grandTotal, 480);
});

test("percent discount then GST then round off", () => {
  const totals = computeTotals({
    lines: [{ price: 100, qty: 1 }],
    discountType: "percent",
    discountValue: 10,
    gstEnabled: true,
    gstPercent: 5,
    roundOff: true,
  });
  assert.equal(totals.discount, 10);
  assert.equal(totals.tax, 4.5);
  assert.equal(totals.beforeRound, 94.5);
  assert.equal(totals.grandTotal, 95);
  assert.equal(totals.roundOffAmount, 0.5);
});

test("flat discount cannot exceed subtotal", () => {
  const totals = computeTotals({
    lines: [{ price: 80, qty: 1 }],
    discountType: "flat",
    discountValue: 500,
    gstEnabled: false,
    roundOff: false,
  });
  assert.equal(totals.discount, 80);
  assert.equal(totals.grandTotal, 0);
});

test("money rounds to paise", () => {
  assert.equal(money(10.126), 10.13);
  assert.equal(money("nope"), 0);
});
