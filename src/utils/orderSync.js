import { KEYS, load, save } from "./storage.js";

const UNITS = new Set(["plate", "kg", "litre", "cheese", "bottle", "tin", "piece"]);

export function cleanOrderItem(item) {
  if (!item || typeof item.itemId !== "string" || !item.itemId.trim()) return null;
  if (typeof item.name !== "string" || !item.name.trim()) return null;
  const qty = Number(item.qty);
  if (!Number.isFinite(qty) || qty <= 0 || qty > 99) return null;
  const price = Number(item.price);
  return {
    itemId: item.itemId.trim().slice(0, 80),
    name: item.name.trim().slice(0, 80),
    nameGu: typeof item.nameGu === "string" ? item.nameGu.trim().slice(0, 80) : "",
    unit: UNITS.has(item.unit) ? item.unit : "plate",
    qty: Math.round(qty * 1000) / 1000,
    price: Number.isFinite(price) && price >= 0 ? Math.round(price * 100) / 100 : 0,
  };
}

export function cleanIncomingOrder(body) {
  const items = Array.isArray(body?.items) ? body.items.map(cleanOrderItem).filter(Boolean).slice(0, 40) : [];
  if (!items.length) return null;
  return {
    name: typeof body?.name === "string" ? body.name.trim().slice(0, 24) : "",
    table: typeof body?.table === "string" ? body.table.trim().slice(0, 12) : "",
    note: typeof body?.note === "string" ? body.note.trim().slice(0, 80) : "",
    items,
  };
}

export function orderTotal(order) {
  return (order?.items || []).reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0);
}

export function mergeIncoming(serverOrders = [], localOrders = []) {
  const map = new Map();
  for (const order of [...serverOrders, ...localOrders]) {
    if (!order || typeof order.id !== "string" || !order.id) continue;
    if (!map.has(order.id)) map.set(order.id, order);
  }
  return [...map.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function fetchCustomerOrders(url = "/api/orders") {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("orders");
  return readJson(response);
}

export async function placeCustomerOrder(order, url = "/api/orders") {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  const data = await readJson(response);
  if (!response.ok || !data.order) throw new Error("orders");
  return data.order;
}

export async function updateCustomerOrderStatus({ id, status, pin }, url = "/api/orders") {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status, pin }),
  });
  if (response.status === 401) return { denied: true };
  if (!response.ok) throw new Error("orders");
  return { ok: true };
}

export function loadLocalOrders() {
  const raw = load(KEYS.incomingOrders, []);
  return Array.isArray(raw) ? raw.filter((order) => order && order.id) : [];
}

export function rememberLocalOrder(order) {
  const next = [order, ...loadLocalOrders().filter((item) => item.id !== order.id)].slice(0, 50);
  save(KEYS.incomingOrders, next);
  return next;
}

export function patchLocalOrder(id, status) {
  const next = loadLocalOrders().map((order) => (order.id === id ? { ...order, status } : order));
  save(KEYS.incomingOrders, next);
  return next;
}

export function localOrderFrom(body) {
  const clean = cleanIncomingOrder(body);
  if (!clean) return null;
  const seq = loadLocalOrders().reduce((max, order) => Math.max(max, Number(order.seq) || 0), 0) + 1;
  return {
    id: crypto.randomUUID(),
    seq,
    createdAt: new Date().toISOString(),
    status: "new",
    localOnly: true,
    ...clean,
  };
}
