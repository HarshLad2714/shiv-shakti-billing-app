import { useState } from "react";
import { useApp } from "../store/AppContext";
import { computeTotals } from "../utils/calc";
import { cn, inr } from "../utils/format";
import Modal from "./Modal";

function parkedTotal(draft) {
  const lines = (draft?.lines || []).map((line) => ({ price: Number(line.price) || 0, qty: Number(line.qty) || 0 }));
  return computeTotals({
    lines,
    discountType: draft?.discountType,
    discountValue: draft?.discountValue,
    gstEnabled: draft?.gstEnabled,
    gstPercent: draft?.gstPercent,
    roundOff: draft?.roundOff,
  }).grandTotal;
}

export default function OpenOrderBar() {
  const { orders, activeOrderId, cart, t, switchOrder, startNextCustomer, removeOrder } = useApp();
  const [pending, setPending] = useState(null);

  return (
    <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
      {orders.map((order) => {
        const active = order.id === activeOrderId;
        const count = active ? cart.itemCount : order.draft.lines.length;
        const total = active ? cart.grandTotal : parkedTotal(order.draft);
        const label = order.note.trim() || `${t("orderWord")} ${order.seq}`;
        return (
          <div key={order.id} className={cn("flex shrink-0 items-stretch overflow-hidden rounded-2xl", active ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-black/10")}>
            <button type="button" className="min-h-12 px-3 text-left" aria-pressed={active} onClick={() => switchOrder(order.id)}>
              <span className="block text-sm font-bold leading-tight">{label}</span>
              <span className={cn("block text-xs tabular-nums", active ? "text-gold" : "text-cocoa")}>
                {count} · {inr(total)}
              </span>
            </button>
            <button
              type="button"
              className={cn("grid w-9 place-items-center text-lg", active ? "text-white/70" : "text-cocoa")}
              aria-label={`${t("dropOrder")} ${label}`}
              onClick={() => setPending(order)}
            >
              ×
            </button>
          </div>
        );
      })}
      <button type="button" className="btn-primary shrink-0" onClick={startNextCustomer}>
        {t("newCustomer")}
      </button>

      <Modal open={Boolean(pending)} title={t("dropOrder")} onClose={() => setPending(null)}>
        <p className="text-cocoa">{t("dropOrderBody")}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className="btn-ghost" onClick={() => setPending(null)}>
            {t("cancel")}
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              if (pending) removeOrder(pending.id);
              setPending(null);
            }}
          >
            {t("dropOrder")}
          </button>
        </div>
      </Modal>
    </div>
  );
}
