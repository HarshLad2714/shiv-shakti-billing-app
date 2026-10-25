import { getStore } from "@netlify/blobs";
import { cleanIncomingOrder } from "../../src/utils/orderSync.js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

const MAX_ORDERS = 200;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function publicOrders(data) {
  const orders = Array.isArray(data?.orders) ? data.orders.filter((order) => order?.status === "new") : [];
  return { orders, updatedAt: Number(data?.updatedAt) || 0 };
}

function trimOrders(orders) {
  return [...orders]
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, MAX_ORDERS);
}

export default async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const store = getStore("shiv-shakti-menu");
  const current = (await store.get("orders", { type: "json" })) || { orders: [], seq: 0, updatedAt: 0 };

  if (request.method === "GET") return json(publicOrders(current));

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "body" }, 400);
  }

  if (request.method === "POST") {
    const clean = cleanIncomingOrder(body);
    if (!clean) return json({ error: "order" }, 400);
    const seq = (Number(current.seq) || 0) + 1;
    const order = {
      id: crypto.randomUUID(),
      seq,
      createdAt: new Date().toISOString(),
      status: "new",
      ...clean,
    };
    const next = {
      orders: trimOrders([order, ...(current.orders || [])]),
      seq,
      updatedAt: Date.now(),
    };
    await store.setJSON("orders", next);
    return json({ order, updatedAt: next.updatedAt }, 201);
  }

  if (request.method === "PUT") {
    const menu = await store.get("menu", { type: "json" });
    const storedPin = menu?.pin || "1234";
    if (String(body.pin || "") !== String(storedPin)) return json({ error: "pin" }, 401);
    const status = body.status === "done" ? "done" : body.status === "billed" ? "billed" : "";
    if (!status || typeof body.id !== "string" || !body.id) return json({ error: "order" }, 400);
    const orders = (current.orders || []).map((order) => (order.id === body.id ? { ...order, status } : order));
    if (!orders.some((order) => order.id === body.id)) return json({ error: "missing" }, 404);
    const next = { orders: trimOrders(orders), seq: Number(current.seq) || 0, updatedAt: Date.now() };
    await store.setJSON("orders", next);
    return json(publicOrders(next));
  }

  return json({ error: "method" }, 405);
};

export const config = { path: "/api/orders" };
