import { useApp } from "../store/AppContext";
import { formatDate, formatQty, formatTime, inr, padBill } from "../utils/format";

export default function PrintBill() {
  const { printBill, settings } = useApp();
  if (!printBill) return null;
  const gu = settings.language === "gu";
  const bill = printBill;

  return (
    <article className="bg-white px-1 py-2 font-mono text-[12px] leading-snug text-black">
      <header className="text-center">
        <img src="/icon-512.png" alt="" className="mx-auto mb-1 h-16 w-16 rounded-full" />
        <h1 className="font-sans text-[16px] font-extrabold tracking-wide">{settings.shopName}</h1>
        <p>{gu ? settings.taglineGu || settings.tagline : settings.tagline}</p>
        {settings.address && <p className="mt-1 whitespace-pre-wrap">{settings.address}</p>}
        {settings.phone && <p>{gu ? "ફોન" : "Ph"}: {settings.phone}</p>}
      </header>
      <Divider />
      <p>
        {gu ? "બિલ નં" : "Bill No"}: {padBill(bill.billNo)}
      </p>
      <p>
        {gu ? "તારીખ" : "Date"}: {formatDate(bill.dateTime)} {formatTime(bill.dateTime)}
      </p>
      <Divider />
      <div className="grid grid-cols-[1.4fr_0.7fr_0.7fr_0.8fr] gap-1 font-bold">
        <span>{gu ? "આઇટમ" : "Item"}</span>
        <span className="text-right">{gu ? "સંખ્યા" : "Qty"}</span>
        <span className="text-right">{gu ? "ભાવ" : "Rate"}</span>
        <span className="text-right">{gu ? "રકમ" : "Amt"}</span>
      </div>
      {bill.items.map((item, index) => (
        <div key={`${item.id}-${index}`} className="mt-1 grid grid-cols-[1.4fr_0.7fr_0.7fr_0.8fr] gap-1">
          <span>{gu && item.nameGu ? item.nameGu : item.name}</span>
          <span className="text-right">{formatQty(item.qty, item.unit)}</span>
          <span className="text-right">{Math.round(item.price)}</span>
          <span className="text-right">{Number(item.amount || 0).toFixed(2)}</span>
        </div>
      ))}
      <Divider />
      <Total label={gu ? "સબટોટલ" : "Subtotal"} value={inr(bill.subtotal)} />
      <Total label={gu ? "ડિસ્કાઉન્ટ" : "Discount"} value={inr(bill.discount)} />
      {bill.tax > 0 && <Total label={`GST${bill.gstPercent ? ` ${bill.gstPercent}%` : ""}`} value={inr(bill.tax)} />}
      {bill.roundOffAmount ? <Total label={gu ? "રાઉન્ડ ઓફ" : "Round off"} value={inr(bill.roundOffAmount)} /> : null}
      <p className="mt-1 flex justify-between font-sans text-[14px] font-extrabold">
        <span>{gu ? "કુલ રકમ" : "GRAND TOTAL"}</span>
        <span>{inr(bill.grandTotal)}</span>
      </p>
      <p className="mt-1">
        {gu ? "ચુકવણી" : "Paid by"}: {bill.paymentMode}
      </p>
      {bill.paymentMode === "Cash" && (
        <>
          <Total label={gu ? "મળેલ" : "Received"} value={inr(bill.received)} />
          <Total label={gu ? "પરત" : "Change"} value={inr(bill.change)} />
        </>
      )}
      <Divider />
      <p className="text-center font-sans font-semibold">{gu ? "આભાર! ફરી પધારજો!" : "Thank you! Visit Again!"}</p>
    </article>
  );
}

function Divider() {
  return <div className="my-1 border-t border-dashed border-black" />;
}

function Total({ label, value }) {
  return (
    <p className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </p>
  );
}
