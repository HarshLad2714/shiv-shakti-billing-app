import { useState } from "react";
import { useApp } from "../store/AppContext";
import { cn, inr } from "../utils/format";
import BillRow from "./BillRow";
import Modal from "./Modal";
import OpenOrderBar from "./OpenOrderBar";
import TotalsBox from "./TotalsBox";

const MODES = ["Cash", "UPI", "Card"];

export default function BillPanel({ onDone, onSaved }) {
  const {
    cart,
    draft,
    settings,
    lastAddedId,
    t,
    updateDraft,
    setQty,
    removeLine,
    orders,
    activeOrderId,
    clearDraft,
    updateOrderNote,
    saveBill,
  } = useApp();
  const activeOrder = orders.find((order) => order.id === activeOrderId) || orders[0];
  const orderLabel = activeOrder?.note?.trim() || `${t("orderWord")} ${activeOrder?.seq || 1}`;
  const [confirmClear, setConfirmClear] = useState(false);
  const received = Number(draft.received);
  const cashShort = draft.paymentMode === "Cash" && draft.received !== "" && Number.isFinite(received) && received < cart.grandTotal;
  const change = draft.paymentMode === "Cash" && draft.received !== "" && Number.isFinite(received) ? Math.round((received - cart.grandTotal) * 100) / 100 : 0;

  const checkout = (print) => {
    const bill = saveBill();
    if (!bill) return;
    onDone?.();
    onSaved?.(bill, print);
  };

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col gap-2">
      <OpenOrderBar />
      <div className="receipt-top flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl text-ink shadow-lift">
        <div className="shrink-0 space-y-2 px-4 pb-2 pt-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-saffronDeep">{t("currentBill")}</p>
              <h2 className="truncate font-display text-2xl leading-tight">{orderLabel}</h2>
              <p className="text-xs font-semibold text-cocoa">{t("payAtEnd")}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <p className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-cocoa">
                {cart.itemCount} {cart.itemCount === 1 ? t("billItem") : t("billItems")}
              </p>
              {onDone && (
                <button type="button" className="grid h-10 w-10 place-items-center rounded-full bg-white text-xl font-bold" onClick={onDone} aria-label={t("close")}>
                  ×
                </button>
              )}
            </div>
          </div>
          <input
            className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-base"
            value={activeOrder?.note || ""}
            placeholder={t("orderNote")}
            aria-label={t("orderNote")}
            onChange={(event) => updateOrderNote(event.target.value)}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          {cart.lines.length === 0 ? (
            <p className="py-5 text-center text-sm leading-relaxed text-cocoa">{t("emptyBill")}</p>
          ) : (
            cart.lines.map((line) => (
              <BillRow
                key={`${line.itemId}-${line.unit}`}
                line={line}
                active={lastAddedId === `${line.itemId}:${line.unit}`}
                language={settings.language}
                onSetQty={(qty) => setQty(line.itemId, line.unit, qty)}
                onRemove={() => removeLine(line.itemId, line.unit)}
              />
            ))
          )}
        </div>

        <div className="shrink-0 space-y-2 border-t border-dashed border-black/15 px-4 py-3">
          <TotalsBox cart={cart} t={t} />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{t("discount")}</span>
            <div className="flex rounded-xl bg-paper p-1">
              {[
                ["flat", "₹"],
                ["percent", "%"],
              ].map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateDraft({ discountType: type })}
                  className={cn("h-10 min-w-11 rounded-lg px-2 text-sm font-bold", draft.discountType === type ? "bg-ink text-gold" : "text-cocoa")}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              inputMode="decimal"
              aria-label={t("discount")}
              className="h-11 min-w-24 flex-1 rounded-xl border border-black/10 bg-white px-3 text-right text-base font-semibold tabular-nums"
              value={draft.discountValue}
              onChange={(event) => updateDraft({ discountValue: event.target.value.replace(/[^\d.]/g, "") })}
            />
            <Toggle on={draft.gstEnabled} label={t("gst")} onClick={() => updateDraft({ gstEnabled: !draft.gstEnabled })} />
            {draft.gstEnabled && (
              <input
                inputMode="decimal"
                aria-label={t("gstPercent")}
                className="h-11 w-20 rounded-xl border border-black/10 bg-white px-2 text-right text-base"
                value={draft.gstPercent}
                onChange={(event) => updateDraft({ gstPercent: event.target.value.replace(/[^\d.]/g, "") })}
              />
            )}
            <Toggle on={draft.roundOff} label={t("roundOff")} onClick={() => updateDraft({ roundOff: !draft.roundOff })} />
          </div>
        </div>

      <div className="shrink-0 space-y-2 rounded-b-3xl bg-ink px-4 pb-3 pt-3 text-white">
        <div className="flex items-end justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-wide text-white/60">{t("grandTotal")}</span>
          <span key={cart.grandTotal} className="animate-pop shrink-0 font-display text-3xl leading-none text-gold tabular-nums">
            {inr(cart.grandTotal)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => updateDraft({ paymentMode: mode })}
              className={cn(
                "min-h-11 rounded-xl text-sm font-bold",
                draft.paymentMode === mode ? "bg-saffron text-ink" : "bg-white/10 text-white",
              )}
            >
              {t(mode.toLowerCase())}
            </button>
          ))}
        </div>

        {draft.paymentMode === "Cash" && (
          <div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-white/70" htmlFor="received">
                {t("received")}
              </label>
              <input
                id="received"
                inputMode="decimal"
                placeholder={String(cart.grandTotal)}
                className="ml-auto h-11 w-32 rounded-xl bg-white px-3 text-right text-base font-semibold text-ink tabular-nums"
                value={draft.received}
                onChange={(event) => updateDraft({ received: event.target.value.replace(/[^\d.]/g, "") })}
              />
            </div>
            <p className={cn("mt-1 text-right text-sm font-semibold", cashShort ? "text-red-300" : "text-gold")}>
              {cashShort ? `${t("shortBy")} ${inr(cart.grandTotal - received)}` : `${t("change")} ${inr(Math.max(change, 0))}`}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn bg-white/10 text-white" onClick={() => cart.lines.length && setConfirmClear(true)}>
            {t("clear")}
          </button>
          <button type="button" className="btn-primary" onClick={() => checkout(true)}>
            {t("savePrint")}
          </button>
        </div>
        <button type="button" className="btn w-full bg-white text-ink" onClick={() => checkout(false)}>
          {t("save")}
        </button>
      </div>
      </div>
      </div>

      <Modal open={confirmClear} title={t("confirmClearTitle")} onClose={() => setConfirmClear(false)}>
        <p className="text-cocoa">{t("confirmClearBody")}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className="btn-ghost" onClick={() => setConfirmClear(false)}>
            {t("cancel")}
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              clearDraft();
              setConfirmClear(false);
              onDone?.();
            }}
          >
            {t("yesClear")}
          </button>
        </div>
      </Modal>
    </section>
  );
}

function Toggle({ on, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className={cn("min-h-11 rounded-full px-3 text-sm font-bold", on ? "bg-ink text-gold" : "bg-paper text-cocoa")} aria-pressed={on}>
      {label} {on ? "ON" : "OFF"}
    </button>
  );
}
