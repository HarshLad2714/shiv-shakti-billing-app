export function chooseSync(localUpdatedAt, server) {
  const serverAt = Number(server?.updatedAt) || 0;
  const localAt = Number(localUpdatedAt) || 0;
  if (!server || !Array.isArray(server.items)) return "keep";
  if (localAt > serverAt) return "push";
  if (serverAt > localAt) return "pull";
  return "keep";
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function fetchLiveMenu(url = "/api/menu") {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("menu");
  return readJson(response);
}

export async function saveLiveMenu({ items, removedIds, pin, nextPin, baseUpdatedAt }, url = "/api/menu") {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items,
      removedIds,
      pin,
      nextPin,
      baseUpdatedAt,
    }),
  });
  const menu = await readJson(response);
  if (response.status === 409) return { conflict: true, menu };
  if (response.status === 401) return { denied: true };
  if (!response.ok) throw new Error("menu");
  return { menu };
}
