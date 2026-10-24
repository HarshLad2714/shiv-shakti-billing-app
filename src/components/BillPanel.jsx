import { useState } from "react";
import { useApp } from "../store/AppContext";
import { cn, inr, padBill } from "../utils/format";
import BillRow from "./BillRow";
import Modal from "./Modal";
import TotalsBox from "./TotalsBox";

const MODES = ["Cash", "UPI", "Card"];

export default function BillPanel({ onDone, onSaved }) {
  const {
    cart,
    draft,
    nextBillNo,
    settings,
    lastAddedId,
    t,
    updateDraft,
    setQty,
    removeLine,
    clearDraft,
    saveBill,
  } = useApp();
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
    <section className="flex h-full min-h-0 flex-col">
      <div className="receipt-top flex min-h-0 flex-1 flex-col rounded-t-3xl px-4 pb-3 pt-5 text-ink shadow-lift">
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-saffronDeep">{t("currentBill")}</p>
            <h2 className="font-display text-2xl leading-none">#{padBill(nextBillNo)}</h2>
          </div>
          <p className="text-sm font-semibold text-cocoa">
            {cart.itemCount} {cart.itemCount === 1 ? t("billItem") : t("billItems")}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {cart.lines.length === 0 ? (
            <div className="grid h-full min-h-40 place-items-center px-6 text-center text-cocoa">
              <p>{t("emptyBill")}</p>
            </div>
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

        <div className="mt-3 space-y-3 border-t border-dashed border-black/15 pt-3">
          <TotalsBox cart={cart} t={t} />

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{t("discount")}</span>
            <div className="ml-auto flex rounded-xl bg-paper p-1">
              {[
                ["flat", "₹"],
                ["percent", "%"],
              ].map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateDraft({ discountType: type })}
                  className={cn("h-9 min-w-10 rounded-lg px-2 text-sm font-bold", draft.discountType === type ? "bg-ink text-gold" : "text-cocoa")}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              inputMode="decimal"
              aria-label={t("discount")}
              className="h-11 w-24 rounded-xl border border-black/10 bg-white px-2 text-right text-base font-semibold tabular-nums"
              value={draft.discountValue}
              onChange={(event) => updateDraft({ discountValue: event.target.value.replace(/[^\d.]/g, "") })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
      </div>

      <div className="space-y-3 rounded-b-3xl bg-ink p-3 text-white">
        <div className="flex items-end justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">{t("grandTotal")}</span>
          <span key={cart.grandTotal} className="animate-pop font-display text-4xl leading-none text-gold tabular-nums">
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
            <p className="text-right text-[11px] text-white/50">{t("exactHint")}</p>
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
