const WEEK_INDEX = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

export function istCalendar(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const pick = (type) => parts.find((part) => part.type === type)?.value || "";
  return { year: pick("year"), month: pick("month"), day: pick("day"), weekday: pick("weekday") };
}

export function shiftDateKey(key, days) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function periodRange(period, now = new Date()) {
  const calendar = istCalendar(now);
  const today = `${calendar.year}-${calendar.month}-${calendar.day}`;
  if (period === "week") {
    const start = shiftDateKey(today, -(WEEK_INDEX[calendar.weekday] ?? 0));
    return { from: start, to: shiftDateKey(start, 6) };
  }
  if (period === "year") return { from: `${calendar.year}-01-01`, to: `${calendar.year}-12-31` };
  return { from: today, to: today };
}
