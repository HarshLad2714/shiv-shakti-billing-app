import test from "node:test";
import assert from "node:assert/strict";
import { cleanIncomingOrder, mergeIncoming, orderTotal } from "./orderSync.js";

test("a customer order needs at least one real item", () => {
  assert.equal(cleanIncomingOrder({ items: [] }), null);
  assert.equal(cleanIncomingOrder({ items: [{ itemId: "coca-cola", name: "Coca Cola", qty: 0, price: 20 }] }), null);
});

test("a bottle order keeps the table, name, and price", () => {
  const order = cleanIncomingOrder({
    name: "  Rahul  ",
    table: " 4 ",
    note: "less ice",
    items: [{ itemId: "coca-cola", name: "Coca Cola", nameGu: "કોકા કોલા", unit: "bottle", qty: 2, price: 20 }],
  });
  assert.equal(order.name, "Rahul");
  assert.equal(order.table, "4");
  assert.equal(order.items[0].unit, "bottle");
  assert.equal(order.items[0].qty, 2);
  assert.equal(orderTotal(order), 40);
});

test("the counter keeps a phone-only order that the server has not seen", () => {
  const merged = mergeIncoming(
    [{ id: "server", createdAt: "2026-10-25T10:00:00.000Z", status: "new" }],
    [{ id: "phone", createdAt: "2026-10-25T10:05:00.000Z", status: "new" }],
  );
  assert.deepEqual(merged.map((order) => order.id), ["phone", "server"]);
});
