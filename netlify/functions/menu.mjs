import { getStore } from "@netlify/blobs";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function publicMenu(data) {
  if (!data?.items) return { items: null, removedIds: [], updatedAt: 0, pin: "" };
  const pin = String(data.pin || "");
  return {
    items: data.items,
    removedIds: Array.isArray(data.removedIds) ? data.removedIds : [],
    updatedAt: Number(data.updatedAt) || 0,
    pin: /^\d{4}$/.test(pin) ? pin : "1234",
  };
}

function validItems(items) {
  return Array.isArray(items) && items.length > 0 && items.length <= 500 && items.every((item) => item && typeof item.id === "string" && typeof item.name === "string");
}

export default async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const store = getStore("shiv-shakti-menu");
  const current = await store.get("menu", { type: "json" });

  if (request.method === "GET") return json(publicMenu(current));

  if (request.method !== "PUT") return json({ error: "method" }, 405);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "body" }, 400);
  }

  const storedPin = current?.pin || "1234";
  if (String(body.pin || "") !== String(storedPin)) return json({ error: "pin" }, 401);
  if (!validItems(body.items)) return json({ error: "items" }, 400);

  const serverAt = Number(current?.updatedAt) || 0;
  const baseAt = Number(body.baseUpdatedAt) || 0;
  if (current?.items && baseAt < serverAt) return json(publicMenu(current), 409);

  const nextPin = /^\d{4}$/.test(String(body.nextPin || "")) ? String(body.nextPin) : storedPin;
  const next = {
    items: body.items,
    removedIds: Array.isArray(body.removedIds) ? body.removedIds.filter((id) => typeof id === "string") : [],
    pin: nextPin,
    updatedAt: Date.now(),
  };
  await store.setJSON("menu", next);
  return json(publicMenu(next));
};

export const config = { path: "/api/menu" };
