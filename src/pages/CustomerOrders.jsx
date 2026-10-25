import { useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";
import { formatDateTime, formatQty, inr } from "../utils/format";
import { orderTotal } from "../utils/orderSync";

export default function CustomerOrders() {
  const { customerOrders, openCustomerOrder, markCustomerOrder, settings, t } = useApp();
  const navigate = useNavigate();
  const waiting = customerOrders.filter((order) => order.status === "new");

  const makeBill = async (order) => {
    const opened = openCustomerOrder(order);
    if (!opened) return;
    await markCustomerOrder(order.id, "billed");
    navigate("/");
  };

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-3xl flex-col gap-4 overflow-y-auto px-3 py-4 lg:px-5">
      <div>
        <h1 className="font-display text-3xl">{t("customerOrdersTitle")}</h1>
        <p className="mt-1 text-sm text-cocoa">{t("qrHint")}</p>
      </div>

      {waiting.length === 0 ? (
        <div className="rounded-3xl bg-white px-6 py-12 text-center text-cocoa shadow-card">{t("noCustomerOrders")}</div>
      ) : (
        <div className="space-y-3">
          {waiting.map((order) => {
            const title = [order.table ? `${t("tableNo")} ${order.table}` : "", order.name].filter(Boolean).join(" · ");
            return (
              <article key={order.id} className="rounded-3xl bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl">#{String(order.seq).padStart(3, "0")}</p>
                    <p className="text-sm font-semibold">{title || t("customerOrder")}</p>
                    <p className="text-xs text-cocoa">{formatDateTime(order.createdAt)}</p>
                  </div>
                  <p className="font-display text-2xl text-saffron">{inr(orderTotal(order), 0)}</p>
                </div>
                {order.note && <p className="mt-2 text-sm text-cocoa">{order.note}</p>}
                <ul className="mt-3 space-y-1 text-sm">
                  {order.items.map((item) => (
                    <li key={`${item.itemId}-${item.unit}`} className="flex justify-between gap-3">
                      <span className="min-w-0 truncate">
                        {settings.language === "gu" && item.nameGu ? item.nameGu : item.name}
                        <span className="text-cocoa"> · {formatQty(item.qty, item.unit, settings.language)}</span>
                      </span>
                      <span className="shrink-0 tabular-nums">{inr(item.price * item.qty, 0)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" className="btn-ghost" onClick={() => markCustomerOrder(order.id, "done")}>
                    {t("dismissOrder")}
                  </button>
                  <button type="button" className="btn-primary" onClick={() => makeBill(order)}>
                    {t("makeBill")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <section className="rounded-3xl bg-ink p-4 text-white shadow-lift">
        <h2 className="font-display text-2xl text-gold">{t("scanToOrder")}</h2>
        <p className="mt-1 text-sm text-white/70">{t("qrHint")}</p>
        <img src="/table-order-qr.png" alt={t("scanToOrder")} className="mx-auto mt-4 w-full max-w-xs rounded-2xl bg-white" />
        <a className="btn-primary mt-4 w-full" href="/table-order-qr.png" download="shiv-shakti-table-qr.png">
          {t("downloadQr")}
        </a>
      </section>
    </div>
  );
}
