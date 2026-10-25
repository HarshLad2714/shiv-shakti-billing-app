import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CategoryTabs from "../components/CategoryTabs";
import BillPanel from "../components/BillPanel";
import ItemGrid from "../components/ItemGrid";
import OpenOrderBar from "../components/OpenOrderBar";
import Modal from "../components/Modal";
import { orderedCategories } from "../data/menu";
import { useApp } from "../store/AppContext";
import { billPlainText, cn, inr, padBill, whatsappUrl } from "../utils/format";

export default function Billing() {
  const { items, draft, orders, cart, settings, updateSettings, addQty, requestPrint, customerOrders, billFocus, t } = useApp();
  const waitingOrders = customerOrders.filter((order) => order.status === "new");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (billFocus) setOpen(true);
  }, [billFocus]);

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
      .map((name) => ({ category: name, items: filtered.filter((item) => item.category === name) }))
      .filter((group) => group.items.length);
  }, [searching, category, filtered, categories]);

  const qtyOf = (id) => {
    const lines = draft.lines.filter((line) => line.itemId === id);
    const qtyFor = (unit) => lines.find((line) => (line.unit === "piece" ? "plate" : line.unit) === unit)?.qty || 0;
    return { plate: qtyFor("plate"), bottle: qtyFor("bottle"), tin: qtyFor("tin"), cheese: qtyFor("cheese"), kg: qtyFor("kg"), litre: qtyFor("litre") };
  };

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onSaved = (bill, print) => {
    setSaved(bill);
    if (print) requestPrint(bill);
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="flex min-h-0 flex-col">
        <div className="space-y-3 px-3 pb-2 pt-3 lg:px-5">
          {!settings.dishRatesBanner && (
            <div className="flex items-start gap-3 rounded-2xl bg-gold/40 px-3 py-3 text-sm">
              <p className="flex-1 leading-snug">{t("verifyBanner")}</p>
              <button type="button" className="btn-dark shrink-0" onClick={() => updateSettings({ dishRatesBanner: true })}>
                {t("dismiss")}
              </button>
            </div>
          )}
          {waitingOrders.length > 0 && (
            <Link to="/orders" className="flex min-h-11 items-center justify-between rounded-2xl bg-saffron px-4 text-sm font-bold text-ink">
              <span>
                {waitingOrders.length} {t("newCustomerOrders")}
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          )}
          <div className="lg:hidden">
            <OpenOrderBar />
          </div>
          <div className="relative">
            <label className="sr-only" htmlFor="item-search">
              {t("searchPlaceholder")}
            </label>
            <input
              id="item-search"
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="field pr-12"
              autoComplete="off"
            />
            {query && (
              <button type="button" className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-lg" onClick={() => setQuery("")} aria-label={t("close")}>
                ×
              </button>
            )}
          </div>
          {searching ? (
            <p className="text-sm font-semibold text-cocoa">{t("searchingAll")}</p>
          ) : (
            <CategoryTabs categories={categories} value={category} onChange={setCategory} language={settings.language} allLabel={t("all")} />
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-28 pt-2 lg:px-5 lg:pb-6">
          <ItemGrid groups={groups} flat={filtered} language={settings.language} qtyOf={qtyOf} onAdd={addQty} t={t} />
        </div>
      </section>

      <aside className="hidden h-full min-h-0 p-3 lg:block">
        <BillPanel onSaved={onSaved} />
      </aside>

      <button
        type="button"
        className={cn(
          "no-print fixed inset-x-3 z-30 flex min-h-14 items-center justify-between rounded-2xl bg-ink px-4 text-white shadow-lift lg:hidden",
          open && "hidden",
        )}
        style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        onClick={() => setOpen(true)}
      >
        <span className="font-semibold">
          {t("openOrders")} · {orders.length}
        </span>
        <span key={draft.lines.length} className="animate-pop font-display text-2xl text-gold">
          {inr(cart.grandTotal)}
        </span>
      </button>

      {open && (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink/55" aria-label={t("close")} onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 top-0 flex p-2 pb-12">
            <div className="min-h-0 min-w-0 flex-1">
              <BillPanel onDone={() => setOpen(false)} onSaved={onSaved} />
            </div>
          </div>
        </div>
      )}

      <Modal open={Boolean(saved)} title={t("billSaved")} onClose={() => setSaved(null)}>
        {saved && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-ink px-4 py-5 text-center text-white">
              <p className="text-xs uppercase tracking-[0.16em] text-white/60">#{padBill(saved.billNo)}</p>
              <p className="mt-1 font-display text-5xl text-gold">{inr(saved.grandTotal)}</p>
              <p className="mt-2 text-sm text-white/70">
                {saved.paymentMode}
                {saved.paymentMode === "Cash" ? ` · ${t("change")} ${inr(saved.change)}` : ""}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn-dark" onClick={() => requestPrint(saved)}>
                {t("print")}
              </button>
              <a className="btn-primary" href={whatsappUrl(billPlainText(saved, settings, settings.language))} target="_blank" rel="noreferrer">
                {t("whatsapp")}
              </a>
            </div>
            <button type="button" className="btn-ghost w-full" onClick={() => setSaved(null)}>
              {t("newBill")}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
