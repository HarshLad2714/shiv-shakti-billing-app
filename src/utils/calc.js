export function money(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

export function roundQty(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.round(x * 1000) / 1000;
}

export function lineAmount(price, qty) {
  return money(money(price) * Number(qty || 0));
}

export function qtyStep(unit) {
  if (unit === "kg") return 0.25;
  if (unit === "litre") return 0.1;
  return 1;
}

export function computeTotals({
  lines,
  discountType = "flat",
  discountValue = 0,
  gstEnabled = false,
  gstPercent = 0,
  roundOff = false,
}) {
  const subtotal = money(lines.reduce((sum, line) => sum + lineAmount(line.price, line.qty), 0));
  const rawDiscount = Math.max(0, Number(discountValue) || 0);
  let discount = 0;
  if (discountType === "percent") {
    const percent = Math.min(100, rawDiscount);
    discount = money(subtotal * (percent / 100));
  } else {
    discount = money(Math.min(subtotal, rawDiscount));
  }
  const afterDiscount = money(subtotal - discount);
  const tax = gstEnabled ? money(afterDiscount * (Math.max(0, Number(gstPercent) || 0) / 100)) : 0;
  const beforeRound = money(afterDiscount + tax);
  const grandTotal = roundOff ? Math.round(beforeRound) : beforeRound;
  const roundOffAmount = money(grandTotal - beforeRound);
  return { subtotal, discount, tax, beforeRound, grandTotal, roundOffAmount };
}
