import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useApp } from "../store/AppContext";
import { cn, formatDateTime, istDateKey, inr, padBill, todayKey } from "../utils/format";
import Logo from "./Logo";

const LINKS = [
  ["/", "billing"],
  ["/history", "history"],
  ["/reports", "reports"],
  ["/admin", "admin"],
];

export default function Layout() {
  const { settings, updateSettings, nextBillNo, bills, t } = useApp();
  const todaySales = bills.filter((bill) => istDateKey(bill.dateTime) === todayKey());
  const todayTotal = todaySales.reduce((sum, bill) => sum + Number(bill.grandTotal || 0), 0);

  return (
    <div className="flex h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-gold focus:px-3 focus:py-2">
        Skip to menu
      </a>
      <header className="no-print shrink-0 bg-ink text-white">
        <div className="flex items-center gap-3 px-3 py-2.5 lg:px-5">
          <Logo className="h-14 w-14 sm:h-16 sm:w-16" />
          <div className="min-w-0">
            <p className="font-display text-xl leading-none text-gold">Shiv Shakti</p>
            <p className="truncate text-xs text-white/70">
              {settings.language === "gu" ? settings.taglineGu : settings.tagline}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-[11px] uppercase tracking-wider text-white/50">
                {t("today")} · {todaySales.length} {todaySales.length === 1 ? t("billOne") : t("bills").toLowerCase()}
              </p>
              <p className="font-semibold tabular-nums text-gold">{inr(todayTotal, 0)}</p>
            </div>
            <div className="hidden text-right md:block">
              <p className="text-[11px] uppercase tracking-wider text-white/50">
                {t("billNo")} #{padBill(nextBillNo)}
              </p>
              <Clock />
            </div>
            <div className="flex rounded-full bg-white/10 p-1" role="group" aria-label={t("language")}>
              {[
                ["en", "EN"],
                ["gu", "ગુ"],
              ].map(([code, label]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => updateSettings({ language: code })}
                  className={cn(
                    "min-h-10 min-w-11 rounded-full px-2 text-sm font-bold",
                    settings.language === code ? "bg-saffron text-ink" : "text-white",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 lg:px-5" aria-label="Primary">
          {LINKS.map(([to, key]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold leading-[2.75rem]",
                  isActive ? "bg-gold text-ink" : "text-white/80 hover:bg-white/10",
                )
              }
            >
              {t(key)}
            </NavLink>
          ))}
        </nav>
      </header>
      <main id="main" className="no-print min-h-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}

function Clock() {
  const [now, setNow] = useState(() => formatDateTime(new Date().toISOString()));
  useEffect(() => {
    const id = setInterval(() => setNow(formatDateTime(new Date().toISOString())), 30000);
    return () => clearInterval(id);
  }, []);
  return <p className="text-xs text-white/80">{now}</p>;
}
