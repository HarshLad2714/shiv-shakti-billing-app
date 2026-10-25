import { getStore } from "@netlify/blobs";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

const MAX_BILLS = 20000;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function billKey(bill) {
  if (bill?.id) return String(bill.id);
  return `legacy:${bill?.billNo ?? ""}:${bill?.dateTime ?? ""}`;
}

function cleanItem(item) {
  if (!item || typeof item.name !== "string" || !item.name.trim()) return null;
  return {
    id: typeof item.id === "string" ? item.id.slice(0, 80) : "",
    name: item.name.trim().slice(0, 80),
    nameGu: typeof item.nameGu === "string" ? item.nameGu.trim().slice(0, 80) : "",
    qty: Number(item.qty) || 0,
    unit: typeof item.unit === "string" ? item.unit.slice(0, 16) : "plate",
    price: Number(item.price) || 0,
    amount: Number(item.amount) || 0,
  };
}

function cleanBill(bill) {
  if (!bill || typeof bill.dateTime !== "string" || Number.isNaN(Date.parse(bill.dateTime))) return null;
  if (!Number.isFinite(Number(bill.grandTotal))) return null;
  const items = Array.isArray(bill.items) ? bill.items.map(cleanItem).filter(Boolean).slice(0, 80) : [];
  if (!items.length) return null;
  return {
    id: typeof bill.id === "string" && bill.id ? bill.id.slice(0, 80) : "",
    billNo: Number(bill.billNo) || 0,
    dateTime: bill.dateTime,
    items,
    subtotal: Number(bill.subtotal) || 0,
    discount: Number(bill.discount) || 0,
    discountType: bill.discountType === "percent" ? "percent" : "flat",
    discountValue: Number(bill.discountValue) || 0,
    tax: Number(bill.tax) || 0,
    gstPercent: Number(bill.gstPercent) || 0,
    roundOffAmount: Number(bill.roundOffAmount) || 0,
    grandTotal: Number(bill.grandTotal) || 0,
    paymentMode: typeof bill.paymentMode === "string" ? bill.paymentMode.slice(0, 16) : "Cash",
    received: Number(bill.received) || 0,
    change: Number(bill.change) || 0,
  };
}

function mergeBills(left = [], right = []) {
  const map = new Map();
  for (const bill of [...left, ...right]) {
    const clean = cleanBill(bill);
    if (!clean) continue;
    const key = billKey(clean);
    if (!map.has(key)) map.set(key, clean);
  }
  return [...map.values()]
    .sort((a, b) => String(b.dateTime).localeCompare(String(a.dateTime)))
    .slice(0, MAX_BILLS);
}

function publicBills(data) {
  return {
    bills: Array.isArray(data?.bills) ? data.bills : [],
    updatedAt: Number(data?.updatedAt) || 0,
  };
}

export default async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const store = getStore("shiv-shakti-menu");
  const current = await store.get("bills", { type: "json" });

  if (request.method === "GET") return json(publicBills(current));
  if (request.method !== "PUT") return json({ error: "method" }, 405);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "body" }, 400);
  }

  const menu = await store.get("menu", { type: "json" });
  const storedPin = menu?.pin || "1234";
  if (String(body.pin || "") !== String(storedPin)) return json({ error: "pin" }, 401);
  if (!Array.isArray(body.bills) || body.bills.length === 0 || body.bills.length > MAX_BILLS) return json({ error: "bills" }, 400);

  const serverAt = Number(current?.updatedAt) || 0;
  const baseAt = Number(body.baseUpdatedAt) || 0;
  if (serverAt !== baseAt) return json(publicBills(current), 409);

  const next = {
    bills: mergeBills(current?.bills, body.bills),
    updatedAt: Date.now(),
  };
  if (!next.bills.length) return json({ error: "bills" }, 400);
  await store.setJSON("bills", next);
  return json(publicBills(next));
};

export const config = { path: "/api/bills" };
