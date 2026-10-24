import { useMemo, useState } from "react";
import { useApp } from "../store/AppContext";
import { billPlainText, formatDateTime, formatQty, inr, istDateKey, padBill, whatsappUrl } from "../utils/format";

export default function History() {
  const { bills, settings, requestPrint, t } = useApp();
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [openId, setOpenId] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bills.filter((bill) => {
      const dateOk = !date || istDateKey(bill.dateTime) === date;
      const haystack = `${padBill(bill.billNo)} ${bill.items.map((item) => `${item.name} ${item.nameGu || ""}`).join(" ")}`.toLowerCase();
      return dateOk && (!q || haystack.includes(q));
    });
  }, [bills, query, date]);

  return (
    <div className="h-full overflow-y-auto px-3 py-4 lg:px-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl">{t("history")}</h1>
          <p className="text-sm text-cocoa">{filtered.length}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input className="field sm:w-64" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchBills")} />
          <input className="field sm:w-44" type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label={t("date")} />
          {date && (
            <button type="button" className="btn-ghost" onClick={() => setDate("")}>
              {t("allDates")}
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl bg-white px-6 py-16 text-center text-cocoa shadow-card">{bills.length ? t("noMatchBills") : t("noBills")}</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((bill) => {
            const billKey = `${bill.billNo}-${bill.dateTime}`;
            const open = openId === billKey;
            const names = bill.items.map((item) => (settings.language === "gu" && item.nameGu ? item.nameGu : item.name)).join(", ");
            return (
              <article key={billKey} className="rounded-3xl bg-white p-4 shadow-card">
                <button type="button" className="flex w-full items-start justify-between gap-3 text-left" onClick={() => setOpenId(open ? null : billKey)}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-saffronDeep">#{padBill(bill.billNo)}</p>
                    <p className="font-semibold">{formatDateTime(bill.dateTime)}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-cocoa">{names}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl tabular-nums">{inr(bill.grandTotal)}</p>
                    <p className="text-sm font-semibold text-cocoa">{bill.paymentMode}</p>
                  </div>
                </button>
                {open && (
                  <div className="mt-3 border-t border-dashed border-black/10 pt-3">
                    {bill.items.map((item, index) => (
                      <div key={`${item.id}-${index}`} className="flex justify-between gap-3 py-1 text-sm">
                        <span>
                          {settings.language === "gu" && item.nameGu ? item.nameGu : item.name}
                          <span className="text-cocoa"> · {formatQty(item.qty, item.unit)}</span>
                        </span>
                        <span className="font-semibold tabular-nums">{inr(item.amount)}</span>
                      </div>
                    ))}
                    <div className="mt-2 space-y-1 border-t border-dashed border-black/10 pt-2 text-sm">
                      <div className="flex justify-between text-cocoa">
                        <span>{t("subtotal")}</span>
                        <span className="tabular-nums">{inr(bill.subtotal)}</span>
                      </div>
                      {bill.discount > 0 && (
                        <div className="flex justify-between text-cocoa">
                          <span>{t("discount")}</span>
                          <span className="tabular-nums">− {inr(bill.discount)}</span>
                        </div>
                      )}
                      {bill.tax > 0 && (
                        <div className="flex justify-between text-cocoa">
                          <span>{t("gst")}</span>
                          <span className="tabular-nums">{inr(bill.tax)}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" className="btn-dark" onClick={() => requestPrint(bill)}>
                        {t("reprint")}
                      </button>
                      <a className="btn-primary" href={whatsappUrl(billPlainText(bill, settings, settings.language))} target="_blank" rel="noreferrer">
                        {t("whatsapp")}
                      </a>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
