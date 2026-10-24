export function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function inr(value, digits = 2) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value) || 0);
}

export function padBill(n) {
  return String(n).padStart(4, "0");
}

const dateTimeFormat = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFormat = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

export function formatDateTime(iso) {
  return dateTimeFormat.format(new Date(iso));
}

export function formatDate(iso) {
  return dateFormat.format(new Date(iso));
}

export function formatTime(iso) {
  return timeFormat.format(new Date(iso));
}

export function istDateKey(iso) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function todayKey() {
  return istDateKey(new Date().toISOString());
}

export function formatQty(qty, unit, language = "en") {
  const n = Number(qty) || 0;
  const trimmed = String(Math.round(n * 1000) / 1000);
  if (unit === "kg") {
    if (n > 0 && n < 1) return `${Math.round(n * 1000)}g`;
    return `${trimmed} kg`;
  }
  if (unit === "litre") {
    if (n > 0 && n < 1) return `${Math.round(n * 1000)} ml`;
    return `${trimmed} L`;
  }
  if (unit === "cheese") return `${trimmed} ${language === "gu" ? "ચીઝ" : "cheese"}`;
  return `${trimmed} ${language === "gu" ? "પ્લેટ" : "plate"}`;
}

export function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function toCsv(rows) {
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`;
}

export function billPlainText(bill, settings, language = "en") {
  const gu = language === "gu";
  const lines = [
    settings.shopName || "Shiv Shakti Fast Food",
    gu ? settings.taglineGu || settings.tagline : settings.tagline,
  ];
  if (settings.address) lines.push(settings.address);
  if (settings.phone) lines.push(`${gu ? "ફોન" : "Phone"}: ${settings.phone}`);
  lines.push("--------------------------------");
  lines.push(`${gu ? "બિલ નં" : "Bill No"}: ${String(bill.billNo).padStart(4, "0")}    ${gu ? "તારીખ" : "Date"}: ${formatDate(bill.dateTime)} ${formatTime(bill.dateTime)}`);
  lines.push("--------------------------------");
  bill.items.forEach((item) => {
    const name = gu && item.nameGu ? item.nameGu : item.name;
    lines.push(`${name}`);
    lines.push(`  ${formatQty(item.qty, item.unit)}  x  ${inr(item.price)}  =  ${inr(item.amount)}`);
  });
  lines.push("--------------------------------");
  lines.push(`${gu ? "સબટોટલ" : "Subtotal"}: ${inr(bill.subtotal)}`);
  if (bill.discount) lines.push(`${gu ? "ડિસ્કાઉન્ટ" : "Discount"}: -${inr(bill.discount)}`);
  if (bill.tax) lines.push(`GST: ${inr(bill.tax)}`);
  if (bill.roundOffAmount) lines.push(`${gu ? "રાઉન્ડ ઓફ" : "Round off"}: ${inr(bill.roundOffAmount)}`);
  lines.push(`${gu ? "કુલ રકમ" : "GRAND TOTAL"}: ${inr(bill.grandTotal)}`);
  lines.push(`${gu ? "ચુકવણી" : "Paid by"}: ${bill.paymentMode}`);
  if (bill.paymentMode === "Cash") {
    lines.push(`${gu ? "મળેલ" : "Received"}: ${inr(bill.received)}`);
    lines.push(`${gu ? "પરત" : "Change"}: ${inr(bill.change)}`);
  }
  lines.push("--------------------------------");
  lines.push(gu ? "આભાર! ફરી પધારજો!" : "Thank you! Visit Again!");
  return lines.filter(Boolean).join("\n");
}

export function whatsappUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
