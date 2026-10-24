import { useMemo, useState } from "react";
import { useApp } from "../store/AppContext";
import { formatDate, formatQty, formatTime, inr, istDateKey, padBill, todayKey, toCsv } from "../utils/format";
import { downloadFile } from "../utils/storage";

const MODES = ["Cash", "UPI", "Card"];

export default function Reports() {
  const { bills, t } = useApp();
  const today = todayKey();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const filtered = useMemo(() => {
    const start = from <= to ? from : to;
    const end = from <= to ? to : from;
    return bills.filter((bill) => {
      const key = istDateKey(bill.dateTime);
      return key >= start && key <= end;
    });
  }, [bills, from, to]);

  const sales = filtered.reduce((sum, bill) => sum + Number(bill.grandTotal || 0), 0);
  const average = filtered.length ? sales / filtered.length : 0;
  const split = MODES.map((mode) => {
    const rows = filtered.filter((bill) => bill.paymentMode === mode);
    return {
      mode,
      count: rows.length,
      total: rows.reduce((sum, bill) => sum + Number(bill.grandTotal || 0), 0),
    };
  });
  const top = useMemo(() => {
    const map = new Map();
    filtered.forEach((bill) => {
      bill.items.forEach((item) => {
        const key = `${item.name}|${item.unit}`;
        const current = map.get(key) || { name: item.name, qty: 0, amount: 0, unit: item.unit };
        current.qty += Number(item.qty) || 0;
        current.amount += Number(item.amount) || 0;
        map.set(key, current);
      });
    });
    return [...map.values()].sort((a, b) => b.amount - a.amount).slice(0, 8);
  }, [filtered]);
  const maxTop = top[0]?.amount || 1;

  const exportBills = () => {
    const rows = [
      ["Bill No", "Date", "Time", "Items", "Subtotal", "Discount", "GST", "Round off", "Grand Total", "Payment", "Received", "Change"],
      ...filtered.map((bill) => [
        padBill(bill.billNo),
        formatDate(bill.dateTime),
        formatTime(bill.dateTime),
        bill.items.map((item) => `${item.name} (${formatQty(item.qty, item.unit)})`).join("; "),
        bill.subtotal,
        bill.discount,
        bill.tax,
        bill.roundOffAmount,
        bill.grandTotal,
        bill.paymentMode,
        bill.received,
        bill.change,
      ]),
    ];
    downloadFile(`shiv-shakti-bills-${from}-to-${to}.csv`, toCsv(rows), "text/csv;charset=utf-8");
  };

  const exportItems = () => {
    const rows = [
      ["Bill No", "Date", "Item", "Qty", "Unit", "Rate", "Amount", "Payment"],
      ...filtered.flatMap((bill) =>
        bill.items.map((item) => [
          padBill(bill.billNo),
          formatDate(bill.dateTime),
          item.name,
          item.qty,
          item.unit,
          item.price,
          item.amount,
          bill.paymentMode,
        ]),
      ),
    ];
    downloadFile(`shiv-shakti-items-${from}-to-${to}.csv`, toCsv(rows), "text/csv;charset=utf-8");
  };

  return (
    <div className="h-full overflow-y-auto px-3 py-4 lg:px-6">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="font-display text-3xl">{t("reports")}</h1>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm font-semibold">
            {t("from")}
            <input className="field mt-1" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label className="text-sm font-semibold">
            {t("to")}
            <input className="field mt-1" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </label>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setFrom(today);
              setTo(today);
            }}
          >
            {t("today")}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={t("bills")} value={String(filtered.length)} />
        <Stat label={t("sales")} value={inr(sales)} accent />
        <Stat label={t("avgBill")} value={inr(average)} />
      </div>

      <section className="mt-4 rounded-3xl bg-white p-4 shadow-card">
        <h2 className="font-display text-2xl">{t("paymentSplit")}</h2>
        <div className="mt-3 space-y-3">
          {split.map((row) => (
            <div key={row.mode}>
              <div className="mb-1 flex justify-between text-sm font-semibold">
                <span>
                  {t(row.mode.toLowerCase())} · {row.count}
                </span>
                <span className="tabular-nums">{inr(row.total)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-paper">
                <div className="h-full rounded-full bg-saffron" style={{ width: `${sales ? (row.total / sales) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-3xl bg-white p-4 shadow-card">
        <h2 className="font-display text-2xl">{t("topItems")}</h2>
        {top.length === 0 ? (
          <p className="mt-3 text-cocoa">{t("noSales")}</p>
        ) : (
          <div className="mt-3 space-y-3">
            {top.map((item) => (
              <div key={`${item.name}-${item.unit}`}>
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span className="font-semibold">{item.name}</span>
                  <span className="shrink-0 text-cocoa">
                    {formatQty(item.qty, item.unit)} · {inr(item.amount)}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-paper">
                  <div className="h-full rounded-full bg-ink" style={{ width: `${(item.amount / maxTop) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-dark" onClick={exportBills} disabled={!filtered.length}>
          {t("exportBills")}
        </button>
        <button type="button" className="btn-ghost" onClick={exportItems} disabled={!filtered.length}>
          {t("exportItems")}
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, accent = false }) {
  return (
    <div className={accent ? "rounded-3xl bg-ink p-4 text-white shadow-card" : "rounded-3xl bg-white p-4 shadow-card"}>
      <p className={accent ? "text-xs font-bold uppercase tracking-wider text-white/60" : "text-xs font-bold uppercase tracking-wider text-cocoa"}>{label}</p>
      <p className={accent ? "mt-1 font-display text-3xl text-gold" : "mt-1 font-display text-3xl"}>{value}</p>
    </div>
  );
}
