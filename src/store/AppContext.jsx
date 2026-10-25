import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ITEM_RENAMES, RETIRED_IDS, mergeCatalog, normalizeItem, uniqueId } from "../data/menu";
import { STRINGS } from "../i18n";
import { computeTotals, lineAmount, roundQty } from "../utils/calc";
import { billsNeedPush, fetchLiveBills, mergeBills, saveLiveBills } from "../utils/billSync";
import { chooseSync, fetchLiveMenu, saveLiveMenu } from "../utils/menuSync";
import { KEYS, load, save } from "../utils/storage";

const AppContext = createContext(null);

export const DEFAULT_SETTINGS = {
  shopName: "Shiv Shakti Fast Food",
  tagline: "Taste That Connects",
  taglineGu: "સ્વાદ તો દિલને ભાવે... એ તો આપણું જ છે!",
  address: "",
  phone: "",
  gstEnabled: false,
  gstPercent: 5,
  roundOff: true,
  pin: "1234",
  language: "en",
  priceBannerDismissed: false,
  dishRatesBanner: false,
};

export function newDraft(settings = DEFAULT_SETTINGS) {
  return {
    lines: [],
    discountType: "flat",
    discountValue: 0,
    gstEnabled: Boolean(settings.gstEnabled),
    gstPercent: Number(settings.gstPercent) || 0,
    roundOff: settings.roundOff !== false,
    paymentMode: "Cash",
    received: "",
  };
}

function mergeSettings(saved) {
  return { ...DEFAULT_SETTINGS, ...(saved || {}) };
}

function sanitizeDraft(draft, settings) {
  const base = newDraft(settings);
  if (!draft || !Array.isArray(draft.lines)) return base;
  return {
    ...base,
    ...draft,
    lines: draft.lines
      .filter((line) => line && line.itemId && Number(line.qty) > 0 && !RETIRED_IDS.has(line.itemId))
      .map((line) => (ITEM_RENAMES[line.itemId] ? { ...line, itemId: ITEM_RENAMES[line.itemId] } : line)),
    paymentMode: ["Cash", "UPI", "Card"].includes(draft.paymentMode) ? draft.paymentMode : "Cash",
    discountType: draft.discountType === "percent" ? "percent" : "flat",
  };
}

function lineUnit(unit) {
  return unit === "piece" ? "plate" : unit || "plate";
}

function sameLine(line, itemId, unit) {
  return line.itemId === itemId && lineUnit(line.unit) === lineUnit(unit);
}

function rateFor(item, unit) {
  if (!item) return null;
  if (unit === "cheese") return item.cheesePrice;
  if (lineUnit(unit) === "kg") return item.kgPrice;
  if (lineUnit(unit) === "litre") return item.litrePrice;
  return item.platePrice;
}

function resolveLine(line, items) {
  const item = items.find((entry) => entry.id === line.itemId);
  const unit = lineUnit(line.unit || item?.unit);
  const liveRate = rateFor(item, unit);
  const price = liveRate != null ? liveRate : Number(line.price) || 0;
  const name = item?.name || line.name || "Item";
  const nameGu = item?.nameGu || line.nameGu || "";
  return {
    ...line,
    name,
    nameGu,
    unit,
    price,
    amount: lineAmount(price, line.qty),
  };
}

function storedRemovedIds() {
  const raw = load(KEYS.removed, []);
  return Array.isArray(raw) ? raw.filter((id) => typeof id === "string" && id) : [];
}

function makeOrder(seq, settings, draft = newDraft(settings)) {
  return { id: crypto.randomUUID(), seq, note: "", draft };
}

function loadOpenOrders(settings) {
  const saved = load(KEYS.openOrders, null);
  const fallback = sanitizeDraft(load(KEYS.draft, null), settings);
  const orders = Array.isArray(saved?.orders)
    ? saved.orders
        .map((order, index) => ({
          id: typeof order?.id === "string" && order.id ? order.id : crypto.randomUUID(),
          seq: Number(order?.seq) > 0 ? Number(order.seq) : index + 1,
          note: typeof order?.note === "string" ? order.note.slice(0, 32) : "",
          draft: sanitizeDraft(order?.draft, settings),
        }))
        .filter((order) => order.id)
    : [];
  if (!orders.length) {
    const first = makeOrder(1, settings, fallback);
    return { orders: [first], activeId: first.id, seq: 1, draft: first.draft };
  }
  const activeId = orders.some((order) => order.id === saved.activeId) ? saved.activeId : orders[0].id;
  const seq = Math.max(Number(saved.seq) || 1, ...orders.map((order) => order.seq));
  return { orders, activeId, seq, draft: orders.find((order) => order.id === activeId).draft };
}

export function AppProvider({ children }) {
  const [removedIds, setRemovedIds] = useState(storedRemovedIds);
  const [items, setItems] = useState(() => mergeCatalog(load(KEYS.items, null), storedRemovedIds()));
  const [bills, setBills] = useState(() => load(KEYS.bills, []));
  const [settings, setSettings] = useState(() => mergeSettings(load(KEYS.settings, null)));
  const [openOrders] = useState(() => loadOpenOrders(mergeSettings(load(KEYS.settings, null))));
  const [orders, setOrders] = useState(openOrders.orders);
  const [activeOrderId, setActiveOrderId] = useState(openOrders.activeId);
  const [orderSeq, setOrderSeq] = useState(openOrders.seq);
  const [draft, setDraft] = useState(openOrders.draft);
  const [nextBillNo, setNextBillNo] = useState(() => {
    const stored = load(KEYS.seq, 1);
    return Number(stored) > 0 ? Number(stored) : 1;
  });
  const [toasts, setToasts] = useState([]);
  const [adminUnlocked, setAdminUnlocked] = useState(() => sessionStorage.getItem("shivshakti.admin") === "1");
  const [printBill, setPrintBill] = useState(null);
  const [printNonce, setPrintNonce] = useState(0);
  const [lastAddedId, setLastAddedId] = useState("");
  const menuUpdatedAtRef = useRef(Number(load(KEYS.menuUpdatedAt, 0)) || 0);
  const billsUpdatedAtRef = useRef(Number(load(KEYS.billsUpdatedAt, 0)) || 0);
  const itemsRef = useRef(items);
  const removedRef = useRef(removedIds);
  const billsRef = useRef(bills);
  const settingsRef = useRef(settings);
  const publishingRef = useRef(false);
  const billPublishingRef = useRef(false);
  const billPendingRef = useRef(false);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => {
    removedRef.current = removedIds;
  }, [removedIds]);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    billsRef.current = bills;
  }, [bills]);

  useEffect(() => {
    save(KEYS.items, items);
  }, [items]);
  useEffect(() => {
    save(KEYS.removed, removedIds);
  }, [removedIds]);
  useEffect(() => {
    save(KEYS.bills, bills);
  }, [bills]);
  useEffect(() => {
    save(KEYS.settings, settings);
  }, [settings]);
  useEffect(() => {
    save(KEYS.draft, draft);
  }, [draft]);
  useEffect(() => {
    save(KEYS.openOrders, { orders, activeId: activeOrderId, seq: orderSeq });
  }, [orders, activeOrderId, orderSeq]);
  useEffect(() => {
    setOrders((current) => {
      const index = current.findIndex((order) => order.id === activeOrderId);
      if (index < 0 || current[index].draft === draft) return current;
      const next = current.slice();
      next[index] = { ...current[index], draft };
      return next;
    });
  }, [draft, activeOrderId]);
  useEffect(() => {
    save(KEYS.seq, nextBillNo);
  }, [nextBillNo]);
  useEffect(() => {
    document.documentElement.lang = settings.language === "gu" ? "gu" : "en";
  }, [settings.language]);

  const t = useCallback(
    (key) => STRINGS[settings.language]?.[key] || STRINGS.en[key] || key,
    [settings.language],
  );

  const toast = useCallback((message, type = "ok") => {
    const id = crypto.randomUUID();
    setToasts((list) => [...list, { id, message, type }].slice(-3));
    setTimeout(() => {
      setToasts((list) => list.filter((item) => item.id !== id));
    }, 2600);
  }, []);

  const rememberUpdatedAt = useCallback((value) => {
    const next = Number(value) || 0;
    menuUpdatedAtRef.current = next;
    save(KEYS.menuUpdatedAt, next);
  }, []);

  const applyRemotePin = useCallback(
    (pin) => {
      const next = String(pin || "");
      if (!/^\d{4}$/.test(next) || next === settingsRef.current.pin) return;
      settingsRef.current = { ...settingsRef.current, pin: next };
      setSettings((current) => (current.pin === next ? current : { ...current, pin: next }));
      toast(t("pinChanged"));
    },
    [t, toast],
  );

  const applyRemoteMenu = useCallback(
    (menu) => {
      const removed = Array.isArray(menu.removedIds) ? menu.removedIds : [];
      removedRef.current = removed;
      const nextItems = mergeCatalog(menu.items, removed);
      itemsRef.current = nextItems;
      setRemovedIds(removed);
      setItems(nextItems);
      applyRemotePin(menu.pin);
      rememberUpdatedAt(menu.updatedAt);
    },
    [applyRemotePin, rememberUpdatedAt],
  );

  const publishMenu = useCallback(
    async (nextItems, nextRemoved, { pin, nextPin, quiet } = {}) => {
      if (publishingRef.current) return false;
      publishingRef.current = true;
      const baseUpdatedAt = menuUpdatedAtRef.current;
      try {
        const result = await saveLiveMenu({
          items: nextItems,
          removedIds: nextRemoved,
          pin: pin || settingsRef.current.pin,
          nextPin,
          baseUpdatedAt,
        });
        if (result.denied) {
          if (!quiet) toast(t("livePin"), "err");
          return false;
        }
        if (result.conflict && Array.isArray(result.menu?.items)) {
          applyRemoteMenu(result.menu);
          if (!quiet) toast(t("liveConflict"), "err");
          return false;
        }
        if (result.menu?.updatedAt) {
          rememberUpdatedAt(result.menu.updatedAt);
          applyRemotePin(result.menu.pin);
          if (!quiet) toast(t("liveSaved"));
          return true;
        }
        throw new Error("menu");
      } catch {
        rememberUpdatedAt(Date.now());
        if (!quiet) toast(t("liveOffline"), "err");
        return false;
      } finally {
        publishingRef.current = false;
      }
    },
    [applyRemoteMenu, applyRemotePin, rememberUpdatedAt, t, toast],
  );

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      if (publishingRef.current) return;
      try {
        const server = await fetchLiveMenu();
        if (stop || publishingRef.current) return;
        const choice = chooseSync(menuUpdatedAtRef.current, server);
        applyRemotePin(server?.pin);
        if (choice === "pull") applyRemoteMenu(server);
        if (choice === "push") await publishMenu(itemsRef.current, removedRef.current, { quiet: true });
      } catch {
        // The live menu is unreachable. This device keeps its saved menu.
      }
    };
    tick();
    const timer = setInterval(tick, 15000);
    const onFocus = () => tick();
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop = true;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [applyRemoteMenu, applyRemotePin, publishMenu]);

  const rememberBillsUpdatedAt = useCallback((value) => {
    const next = Number(value) || 0;
    billsUpdatedAtRef.current = next;
    save(KEYS.billsUpdatedAt, next);
  }, []);

  const applyBills = useCallback(
    (nextBills, updatedAt) => {
      const merged = mergeBills(billsRef.current, nextBills);
      billsRef.current = merged;
      setBills(merged);
      const maxNo = merged.reduce((max, bill) => Math.max(max, Number(bill.billNo) || 0), 0);
      setNextBillNo((current) => Math.max(current, maxNo + 1));
      if (updatedAt != null) rememberBillsUpdatedAt(updatedAt);
    },
    [rememberBillsUpdatedAt],
  );

  const publishBills = useCallback(
    async (list, { quiet } = {}) => {
      if (billPublishingRef.current) {
        billPendingRef.current = true;
        return false;
      }
      const payload = mergeBills(list, []);
      if (!payload.length) return false;
      billPublishingRef.current = true;
      try {
        let pending = payload;
        let base = billsUpdatedAtRef.current;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          const result = await saveLiveBills({
            bills: pending,
            pin: settingsRef.current.pin,
            baseUpdatedAt: base,
          });
          if (result.denied) {
            if (!quiet) toast(t("livePin"), "err");
            return false;
          }
          if (result.conflict) {
            pending = mergeBills(billsRef.current, result.bills);
            base = Number(result.updatedAt) || 0;
            applyBills(pending, base);
            continue;
          }
          applyBills(mergeBills(billsRef.current, result.bills || pending), result.updatedAt);
          return true;
        }
        throw new Error("bills");
      } catch {
        if (!quiet) toast(t("liveOffline"), "err");
        return false;
      } finally {
        billPublishingRef.current = false;
        if (billPendingRef.current) {
          billPendingRef.current = false;
          publishBills(billsRef.current, { quiet: true });
        }
      }
    },
    [applyBills, t, toast],
  );

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      if (billPublishingRef.current) return;
      try {
        const server = await fetchLiveBills();
        if (stop || billPublishingRef.current || !Array.isArray(server.bills)) return;
        const merged = mergeBills(billsRef.current, server.bills);
        const serverAt = Number(server.updatedAt) || 0;
        if (merged.length !== billsRef.current.length) applyBills(merged, serverAt);
        else rememberBillsUpdatedAt(serverAt);
        if (billsNeedPush(merged, server.bills)) await publishBills(merged, { quiet: true });
      } catch {
        // Bills stay on this device until the live site can be reached.
      }
    };
    tick();
    const timer = setInterval(tick, 15000);
    const onFocus = () => tick();
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop = true;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [applyBills, publishBills, rememberBillsUpdatedAt]);

  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((item) => item.id !== id));
  }, []);

  const updateSettings = useCallback((partial) => {
    setSettings((current) => ({ ...current, ...partial }));
  }, []);

  const updateDraft = useCallback((partial) => {
    setDraft((current) => ({ ...current, ...partial }));
  }, []);

  const cart = useMemo(() => {
    const lines = draft.lines.map((line) => resolveLine(line, items));
    const totals = computeTotals({
      lines,
      discountType: draft.discountType,
      discountValue: draft.discountValue,
      gstEnabled: draft.gstEnabled,
      gstPercent: draft.gstPercent,
      roundOff: draft.roundOff,
    });
    const count = lines.reduce((sum, line) => sum + (line.unit === "kg" || line.unit === "litre" ? 1 : line.qty), 0);
    return { lines, count, itemCount: lines.length, ...totals };
  }, [draft, items]);

  const addQty = useCallback(
    (itemId, unit, delta = 1) => {
      const item = items.find((entry) => entry.id === itemId);
      const sellUnit = lineUnit(unit);
      if (!item || item.hidden) return;
      if (!item.available) {
        toast(t("outToast"), "err");
        return;
      }
      const price = rateFor(item, sellUnit);
      if (!(Number(price) > 0)) {
        const message = sellUnit === "kg" ? t("setKgRate") : sellUnit === "litre" ? t("setLitreRate") : sellUnit === "cheese" ? t("setCheeseRate") : t("setPlateRate");
        toast(message, "err");
        return;
      }
      setDraft((current) => {
        const existing = current.lines.find((line) => sameLine(line, itemId, sellUnit));
        const nextQty = roundQty((existing?.qty || 0) + delta);
        if (nextQty <= 0) {
          return { ...current, lines: current.lines.filter((line) => !sameLine(line, itemId, sellUnit)) };
        }
        if (nextQty > 999) return current;
        const snapshot = {
          itemId,
          qty: nextQty,
          name: item.name,
          nameGu: item.nameGu,
          unit: sellUnit,
          price,
        };
        const lines = existing
          ? current.lines.map((line) => (sameLine(line, itemId, sellUnit) ? { ...line, ...snapshot } : line))
          : [...current.lines, snapshot];
        return { ...current, lines };
      });
      setLastAddedId(`${itemId}:${sellUnit}`);
    },
    [items, t, toast],
  );

  const setQty = useCallback((itemId, unit, qty) => {
    const nextQty = roundQty(qty);
    setDraft((current) => ({
      ...current,
      lines:
        nextQty <= 0
          ? current.lines.filter((line) => !sameLine(line, itemId, unit))
          : current.lines.map((line) => (sameLine(line, itemId, unit) ? { ...line, qty: Math.min(nextQty, 999) } : line)),
    }));
  }, []);

  const removeLine = useCallback((itemId, unit) => {
    setDraft((current) => ({ ...current, lines: current.lines.filter((line) => !sameLine(line, itemId, unit)) }));
  }, []);

  const clearDraft = useCallback(() => {
    setDraft(newDraft(settings));
    setLastAddedId("");
  }, [settings]);

  const startNextCustomer = useCallback(() => {
    if (!draft.lines.length) {
      toast(t("addItemsFirst"), "err");
      return;
    }
    const created = makeOrder(orderSeq + 1, settings);
    setOrders((current) => [...current.map((order) => (order.id === activeOrderId ? { ...order, draft } : order)), created]);
    setActiveOrderId(created.id);
    setOrderSeq(created.seq);
    setDraft(created.draft);
    setLastAddedId("");
  }, [activeOrderId, draft, orderSeq, settings, t, toast]);

  const switchOrder = useCallback(
    (id) => {
      if (id === activeOrderId) return;
      const target = orders.find((order) => order.id === id);
      if (!target) return;
      setOrders((current) => current.map((order) => (order.id === activeOrderId ? { ...order, draft } : order)));
      setActiveOrderId(id);
      setDraft(sanitizeDraft(target.draft, settings));
      setLastAddedId("");
    },
    [activeOrderId, draft, orders, settings],
  );

  const updateOrderNote = useCallback(
    (note) => {
      const clean = String(note || "").slice(0, 32);
      setOrders((current) => current.map((order) => (order.id === activeOrderId ? { ...order, note: clean } : order)));
    },
    [activeOrderId],
  );

  const removeOrder = useCallback(
    (id) => {
      const rest = orders.filter((order) => order.id !== id);
      if (!rest.length) {
        const cleared = newDraft(settings);
        setOrders((current) => current.map((order) => (order.id === id ? { ...order, note: "", draft: cleared } : order)));
        setDraft(cleared);
        setLastAddedId("");
        return;
      }
      setOrders(rest);
      if (id === activeOrderId) {
        const next = rest[rest.length - 1];
        setActiveOrderId(next.id);
        setDraft(sanitizeDraft(next.draft, settings));
      }
      setLastAddedId("");
    },
    [activeOrderId, orders, settings],
  );

  const finishActiveOrder = useCallback(() => {
    const rest = orders.filter((order) => order.id !== activeOrderId);
    if (rest.length) {
      const next = rest[rest.length - 1];
      setOrders(rest);
      setActiveOrderId(next.id);
      setDraft(sanitizeDraft(next.draft, settings));
      return;
    }
    const created = makeOrder(orderSeq + 1, settings);
    setOrders([created]);
    setActiveOrderId(created.id);
    setOrderSeq(created.seq);
    setDraft(created.draft);
  }, [activeOrderId, orderSeq, orders, settings]);

  const saveBill = useCallback(() => {
    if (!cart.lines.length) {
      toast(t("emptyCart"), "err");
      return null;
    }
    let received = cart.grandTotal;
    let change = 0;
    if (draft.paymentMode === "Cash" && String(draft.received).trim() !== "") {
      received = roundQty(draft.received);
      received = Math.round(received * 100) / 100;
      if (received + 0.001 < cart.grandTotal) {
        toast(t("cashShort"), "err");
        return null;
      }
      change = Math.round((received - cart.grandTotal) * 100) / 100;
    }
    const bill = {
      id: crypto.randomUUID(),
      billNo: nextBillNo,
      dateTime: new Date().toISOString(),
      items: cart.lines.map((line) => ({
        id: line.itemId,
        name: line.name,
        nameGu: line.nameGu,
        qty: line.qty,
        unit: line.unit,
        price: line.price,
        amount: line.amount,
      })),
      subtotal: cart.subtotal,
      discount: cart.discount,
      discountType: draft.discountType,
      discountValue: Number(draft.discountValue) || 0,
      tax: cart.tax,
      gstPercent: draft.gstEnabled ? Number(draft.gstPercent) || 0 : 0,
      roundOffAmount: cart.roundOffAmount,
      grandTotal: cart.grandTotal,
      paymentMode: draft.paymentMode,
      received: draft.paymentMode === "Cash" ? received : cart.grandTotal,
      change: draft.paymentMode === "Cash" ? change : 0,
    };
    setBills((current) => {
      const next = [bill, ...current];
      billsRef.current = next;
      queueMicrotask(() => publishBills(next));
      return next;
    });
    setNextBillNo((current) => current + 1);
    finishActiveOrder();
    setLastAddedId("");
    toast(`${t("billSaved")} #${String(bill.billNo).padStart(4, "0")}`);
    return bill;
  }, [cart, draft, finishActiveOrder, nextBillNo, publishBills, t, toast]);

  const requestPrint = useCallback((bill) => {
    setPrintBill(bill);
    setPrintNonce((n) => n + 1);
  }, []);

  const saveItem = useCallback(
    (item) => {
      if (!item.name?.trim()) {
        toast(t("required"), "err");
        return false;
      }
      const rates = [item.platePrice, item.kgPrice, item.litrePrice, item.cheesePrice];
      const invalid = rates.some((rate) => rate !== "" && rate != null && (!Number.isFinite(Number(rate)) || Number(rate) < 0));
      if (invalid) {
        toast(t("required"), "err");
        return false;
      }
      setItems((list) => {
        const exists = list.some((entry) => entry.id === item.id);
        const next = normalizeItem({
          ...item,
          name: item.name.trim(),
          nameGu: item.nameGu?.trim() || "",
          category: item.category?.trim() || "Snacks",
          image: item.image?.trim() || "",
          platePrice: item.platePrice === "" ? null : item.platePrice,
          kgPrice: item.kgPrice === "" ? null : item.kgPrice,
          litrePrice: item.litrePrice === "" ? null : item.litrePrice,
          cheesePrice: item.cheesePrice === "" ? null : item.cheesePrice,
          offersCheese: Boolean(item.offersCheese),
        });
        const nextList = !exists ? [...list, { ...next, id: item.id || uniqueId(next.name, list) }] : list.map((entry) => (entry.id === item.id ? next : entry));
        itemsRef.current = nextList;
        queueMicrotask(() => publishMenu(nextList, removedRef.current));
        return nextList;
      });
      toast(t("itemSaved"));
      return true;
    },
    [publishMenu, t, toast],
  );

  const deleteItem = useCallback(
    (itemId) => {
      const nextRemoved = removedRef.current.includes(itemId) ? removedRef.current : [...removedRef.current, itemId];
      const nextItems = itemsRef.current.filter((item) => item.id !== itemId);
      removedRef.current = nextRemoved;
      itemsRef.current = nextItems;
      setRemovedIds(nextRemoved);
      setItems(nextItems);
      setDraft((current) => ({ ...current, lines: current.lines.filter((line) => line.itemId !== itemId) }));
      publishMenu(nextItems, nextRemoved);
      toast(t("itemDeleted"));
    },
    [publishMenu, t, toast],
  );

  const resetMenu = useCallback(() => {
    const nextItems = mergeCatalog(null);
    removedRef.current = [];
    itemsRef.current = nextItems;
    setRemovedIds([]);
    setItems(nextItems);
    publishMenu(nextItems, []);
    toast(t("menuReset"));
  }, [publishMenu, t, toast]);

  const restoreBackup = useCallback(
    (data) => {
      if (!data || !Array.isArray(data.items) || !Array.isArray(data.bills)) {
        toast(t("invalidBackup"), "err");
        return false;
      }
      const cleanItems = data.items
        .filter((item) => item && item.id && item.name)
        .map((item) =>
          normalizeItem({
            image: "",
            available: true,
            hidden: false,
            needsReview: false,
            nameGu: "",
            category: "Snacks",
            ...item,
          }),
        );
      if (!cleanItems.length) {
        toast(t("invalidBackup"), "err");
        return false;
      }
      const nextSettings = mergeSettings(data.settings);
      const maxBill = data.bills.reduce((max, bill) => Math.max(max, Number(bill.billNo) || 0), 0);
      const keptRemoved = removedIds.filter((id) => !cleanItems.some((item) => item.id === id));
      const nextItems = mergeCatalog(cleanItems, keptRemoved);
      removedRef.current = keptRemoved;
      itemsRef.current = nextItems;
      setRemovedIds(keptRemoved);
      setItems(nextItems);
      publishMenu(nextItems, keptRemoved);
      const nextBills = mergeBills(data.bills, []);
      billsRef.current = nextBills;
      setBills(nextBills);
      queueMicrotask(() => publishBills(nextBills));
      setSettings(nextSettings);
      setNextBillNo(Math.max(Number(data.nextBillNo) || 1, maxBill + 1));
      const restored = makeOrder(1, nextSettings, sanitizeDraft(data.draft, nextSettings));
      setOrders([restored]);
      setActiveOrderId(restored.id);
      setOrderSeq(1);
      setDraft(restored.draft);
      toast(t("restored"));
      return true;
    },
    [publishBills, publishMenu, removedIds, t, toast],
  );

  const unlockAdmin = useCallback((pin) => {
    if (pin !== settings.pin) return false;
    sessionStorage.setItem("shivshakti.admin", "1");
    setAdminUnlocked(true);
    return true;
  }, [settings.pin]);

  const lockAdmin = useCallback(() => {
    sessionStorage.removeItem("shivshakti.admin");
    setAdminUnlocked(false);
  }, []);

  const changePin = useCallback(
    (currentPin, newPin, confirmPin) => {
      if (currentPin !== settings.pin) {
        toast(t("pinWrongCurrent"), "err");
        return false;
      }
      if (!/^\d{4}$/.test(newPin)) {
        toast(t("pinRule"), "err");
        return false;
      }
      if (newPin !== confirmPin) {
        toast(t("pinMismatch"), "err");
        return false;
      }
      const previousPin = settings.pin;
      settingsRef.current = { ...settingsRef.current, pin: newPin };
      updateSettings({ pin: newPin });
      publishMenu(itemsRef.current, removedRef.current, { pin: previousPin, nextPin: newPin });
      toast(t("pinChanged"));
      return true;
    },
    [publishMenu, settings.pin, t, toast, updateSettings],
  );

  const value = {
    items,
    bills,
    settings,
    draft,
    orders,
    activeOrderId,
    cart,
    nextBillNo,
    toasts,
    adminUnlocked,
    printBill,
    printNonce,
    lastAddedId,
    t,
    toast,
    dismissToast,
    updateSettings,
    updateDraft,
    addQty,
    setQty,
    removeLine,
    clearDraft,
    startNextCustomer,
    switchOrder,
    updateOrderNote,
    removeOrder,
    saveBill,
    requestPrint,
    saveItem,
    deleteItem,
    resetMenu,
    restoreBackup,
    unlockAdmin,
    lockAdmin,
    changePin,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
