export function billKey(bill) {
  if (bill?.id) return String(bill.id);
  return `legacy:${bill?.billNo ?? ""}:${bill?.dateTime ?? ""}`;
}

export function mergeBills(left = [], right = []) {
  const map = new Map();
  for (const bill of [...left, ...right]) {
    if (!bill || typeof bill.dateTime !== "string" || !bill.dateTime) continue;
    const key = billKey(bill);
    if (!map.has(key)) map.set(key, bill);
  }
  return [...map.values()].sort((a, b) => String(b.dateTime).localeCompare(String(a.dateTime)));
}

export function billsNeedPush(local, serverBills) {
  if (!Array.isArray(local) || !local.length || !Array.isArray(serverBills)) return false;
  const serverKeys = new Set(serverBills.map(billKey));
  return local.some((bill) => !serverKeys.has(billKey(bill)));
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function fetchLiveBills(url = "/api/bills") {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("bills");
  return readJson(response);
}

export async function saveLiveBills({ bills, pin, baseUpdatedAt }, url = "/api/bills") {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bills, pin, baseUpdatedAt }),
  });
  const data = await readJson(response);
  if (response.status === 409) return { conflict: true, bills: data.bills, updatedAt: data.updatedAt };
  if (response.status === 401) return { denied: true };
  if (!response.ok) throw new Error("bills");
  return { ok: true, bills: data.bills, updatedAt: data.updatedAt };
}
