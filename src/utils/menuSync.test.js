import test from "node:test";
import assert from "node:assert/strict";
import { chooseSync } from "./menuSync.js";

test("empty server does not overwrite this device", () => {
  assert.equal(chooseSync(0, { items: null, updatedAt: 0 }), "keep");
});

test("newer live menu is pulled", () => {
  assert.equal(chooseSync(10, { items: [], updatedAt: 20 }), "pull");
});

test("newer local edit is pushed", () => {
  assert.equal(chooseSync(30, { items: [], updatedAt: 20 }), "push");
});

test("same time keeps the current menu", () => {
  assert.equal(chooseSync(20, { items: [], updatedAt: 20 }), "keep");
});
