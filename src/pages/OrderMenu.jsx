import { useMemo, useState } from "react";
import CategoryTabs from "../components/CategoryTabs";
import ItemGrid from "../components/ItemGrid";
import Logo from "../components/Logo";
import { orderedCategories, sellOptions } from "../data/menu";
import { useApp } from "../store/AppContext";
import { money, roundQty } from "../utils/calc";
import { cn, formatQty, inr } from "../utils/format";
import { localOrderFrom, placeCustomerOrder } from "../utils/orderSync";

export default function OrderMenu() {
  const { items, settings, updateSettings, stashCustomerOrder, t, toast } = useApp();
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [table, setTable] = useState("");
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(null);

  const visible = useMemo(() => items.filter((item) => !item.hidden), [items]);
  const categories = useMemo(() => orderedCategories(visible), [visible]);
  const trimmed = query.trim();
  const searching = trimmed.length > 0;
  const filtered = useMemo(() => {
    const q = trimmed.toLowerCase();
    return visible.filter((item) => {
      const matchesQuery = !q || item.name.toLowerCase().includes(q) || (item.nameGu || "").toLowerCase().includes(q);
      const matchesCategory = searching || category === "all" || item.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [visible, trimmed, searching, category]);
  const groups = useMemo(() => {
    if (searching || category !== "all") {
      return [{ category: category === "all" ? "search" : category, items: filtered, flat: true }];
    }
    return categories
      .map((group) => ({ category: group, items: filtered.filter((item) => item.category === group) }))
      .filter((group) => group.items.length);
  }, [searching, category, filtered, categories]);

  const count = lines.reduce((sum, line) => sum + (line.unit === "kg" || line.unit === "litre" ? 1 : line.qty), 0);
  const total = money(lines.reduce((sum, line) => sum + line.price * line.qty, 0));

  const qtyOf = (id) => {
    const qtyFor = (unit) => lines.find((line) => line.itemId === id && line.unit === unit)?.qty || 0;
    return {
      plate: qtyFor("plate"),
      bottle: qtyFor("bottle"),
      tin: qtyFor("tin"),
      cheese: qtyFor("cheese"),
      kg: qtyFor("kg"),
      litre: qtyFor("litre"),
    };
  };

  const add = (itemId, unit, delta = 1) => {
    const item = items.find((entry) => entry.id === itemId);
    const option = sellOptions(item || {}).find((entry) => entry.unit === unit);
    if (!item || item.hidden) return;
    if (!item.available) {
      toast(t("outToast"), "err");
      return;
    }
    if (!(Number(option?.price) > 0)) {
      toast(t("askCounter"), "err");
      return;
    }
    setLines((current) => {
      const existing = current.find((line) => line.itemId === itemId && line.unit === unit);
      const nextQty = roundQty((existing?.qty || 0) + delta);
      if (nextQty <= 0) return current.filter((line) => !(line.itemId === itemId && line.unit === unit));
      if (nextQty > 99) return current;
      const row = { itemId, unit, qty: nextQty, name: item.name, nameGu: item.nameGu || "", price: option.price };
      return existing ? current.map((line) => (line.itemId === itemId && line.unit === unit ? row : line)) : [...current, row];
    });
  };

  const place = async () => {
    if (!lines.length || placing) return;
    setPlacing(true);
    const payload = { name, table, note, items: lines };
    try {
      const order = await placeCustomerOrder(payload);
      setPlaced({ ...order, localOnly: false });
      setLines([]);
      setOpen(false);
    } catch {
      const order = localOrderFrom(payload);
      if (order) {
        stashCustomerOrder(order);
        setPlaced(order);
        setLines([]);
        setOpen(false);
      } else {
        toast(t("emptyCart"), "err");
      }
    } finally {
      setPlacing(false);
    }
  };

  if (placed) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
        <Logo className="h-20 w-20" />
        <p className="mt-4 font-display text-3xl text-saffron">{t("orderSent")}</p>
        <p className="mt-3 font-display text-6xl text-ink">#{String(placed.seq).padStart(3, "0")}</p>
        <p className="mt-3 max-w-xs text-cocoa">{placed.localOnly ? t("orderOffline") : t("orderSentBody")}</p>
        <button
          type="button"
          className="btn-primary mt-8 w-full max-w-xs"
          onClick={() => {
            setPlaced(null);
            setName("");
            setTable("");
            setNote("");
          }}
        >
          {t("orderMore")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="shrink-0 bg-ink px-4 py-3 text-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <Logo className="h-14 w-14" />
          <div className="min-w-0">
            <p className="font-display text-2xl leading-none text-gold">Shiv Shakti</p>
            <p className="text-sm text-white/70">{t("orderHere")}</p>
          </div>
          <div className="ml-auto flex rounded-full bg-white/10 p-1" role="group" aria-label={t("language")}>
            {[
              ["en", "EN"],
              ["gu", "ગુ"],
            ].map(([code, label]) => (
              <button
                key={code}
                type="button"
                onClick={() => updateSettings({ language: code })}
                className={cn("min-h-10 min-w-11 rounded-full px-2 text-sm font-bold", settings.language === code ? "bg-saffron text-ink" : "text-white")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
        <div className="space-y-3 px-3 pb-2 pt-3">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchPlaceholder")} className="field" autoComplete="off" />
          {searching ? (
            <p className="text-sm font-semibold text-cocoa">{t("searchingAll")}</p>
          ) : (
            <CategoryTabs categories={categories} value={category} onChange={setCategory} language={settings.language} allLabel={t("all")} />
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-28 pt-2">
          <ItemGrid groups={groups} flat={filtered} language={settings.language} qtyOf={qtyOf} onAdd={add} t={t} />
        </div>
      </div>
      <button
        type="button"
        className="fixed inset-x-3 z-30 flex min-h-14 items-center justify-between rounded-2xl bg-ink px-4 text-white shadow-lift"
        style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        onClick={() => lines.length && setOpen(true)}
      >
        <span className="font-semibold">{lines.length ? `${t("yourOrder")} · ${count}` : t("startOrder")}</span>
        <span className="font-display text-2xl text-gold">{inr(total, 0)}</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-40">
          <button type="button" className="absolute inset-0 bg-ink/55" aria-label={t("close")} onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 top-10 mx-auto flex max-w-lg flex-col rounded-t-3xl bg-cream p-4 shadow-lift">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-2xl">{t("yourOrder")}</h2>
              <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
                {t("close")}
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
              {lines.map((line) => {
                const label = settings.language === "gu" && line.nameGu ? line.nameGu : line.name;
                return (
                  <div key={`${line.itemId}-${line.unit}`} className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-card">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{label}</p>
                      <p className="text-xs text-cocoa">
                        {inr(line.price)} · {formatQty(line.qty, line.unit, settings.language)}
                      </p>
                    </div>
                    <button type="button" className="grid h-10 w-10 place-items-center rounded-xl bg-paper text-xl font-bold" onClick={() => add(line.itemId, line.unit, line.unit === "kg" ? -0.25 : line.unit === "litre" ? -0.1 : -1)} aria-label="Decrease">
                      −
                    </button>
                    <button type="button" className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-xl font-bold text-gold" onClick={() => add(line.itemId, line.unit, line.unit === "kg" ? 0.25 : line.unit === "litre" ? 0.1 : 1)} aria-label="Increase">
                      +
                    </button>
                  </div>
                );
              })}
              <label className="block pt-2 text-sm font-semibold">
                {t("tableNo")}
                <input className="field mt-1" value={table} onChange={(event) => setTable(event.target.value)} inputMode="text" maxLength={12} />
              </label>
              <label className="block text-sm font-semibold">
                {t("yourName")}
                <input className="field mt-1" value={name} onChange={(event) => setName(event.target.value)} maxLength={24} />
              </label>
              <label className="block text-sm font-semibold">
                {t("orderNoteOptional")}
                <input className="field mt-1" value={note} onChange={(event) => setNote(event.target.value)} maxLength={80} />
              </label>
            </div>
            <button type="button" className="btn-primary mt-3 w-full text-base" disabled={placing || !lines.length} onClick={place}>
              {placing ? t("sending") : `${t("placeOrder")} · ${inr(total, 0)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
