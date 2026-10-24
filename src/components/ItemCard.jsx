import { useState } from "react";
import { CATEGORY_META, sellOptions } from "../data/menu";
import { cn, formatQty, inr } from "../utils/format";

const CHIPS = {
  kg: [
    { label: "250g", delta: 0.25 },
    { label: "500g", delta: 0.5 },
    { label: "1kg", delta: 1 },
  ],
  litre: [
    { label: "200ml", delta: 0.2 },
    { label: "500ml", delta: 0.5 },
    { label: "1L", delta: 1 },
  ],
};

export default function ItemCard({ item, qty = {}, language, onAdd, t }) {
  const [broken, setBroken] = useState(false);
  const name = language === "gu" && item.nameGu ? item.nameGu : item.name;
  const meta = CATEGORY_META[item.category] || { icon: "🍽️" };
  const disabled = !item.available;
  const options = sellOptions(item);
  const plateQty = qty.plate || 0;
  const kgQty = qty.kg || 0;
  const litreQty = qty.litre || 0;
  const cheeseQty = qty.cheese || 0;
  const badges = [
    plateQty > 0 ? formatQty(plateQty, "plate", language) : "",
    cheeseQty > 0 ? formatQty(cheeseQty, "cheese", language) : "",
    kgQty > 0 ? formatQty(kgQty, "kg") : "",
    litreQty > 0 ? formatQty(litreQty, "litre") : "",
  ].filter(Boolean);
  const chipUnit = options.some((option) => option.unit === "kg" && option.price > 0)
    ? "kg"
    : options.some((option) => option.unit === "litre" && option.price > 0)
      ? "litre"
      : "";

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-2xl bg-white shadow-card ring-1 ring-black/5",
        badges.length > 0 && "ring-2 ring-saffron",
        disabled && "opacity-60",
      )}
    >
      <div className="flex items-start gap-2 p-3 pb-2">
        {item.image && !broken ? (
          <img src={item.image} alt="" className="h-12 w-12 rounded-xl object-cover" onError={() => setBroken(true)} />
        ) : (
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-cream text-2xl" aria-hidden="true">
            {meta.icon}
          </span>
        )}
        <span className="min-w-0 pt-1 text-[15px] font-semibold leading-snug">{name}</span>
      </div>
      <div className={cn("grid gap-1 px-2 pb-2", options.length > 2 ? "grid-cols-3" : options.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
        {options.map((option) => {
          const ready = Number(option.price) > 0;
          const amount = option.unit === "plate" ? plateQty : option.unit === "cheese" ? cheeseQty : option.unit === "kg" ? kgQty : litreQty;
          const label =
            option.unit === "cheese"
              ? t("cheese")
              : option.unit === "plate" && item.offersCheese
                ? t("plain")
                : option.unit === "plate"
                  ? item.category === "Beverages"
                    ? t("glass")
                    : t("plate")
                  : option.unit === "kg"
                    ? "Kg"
                    : "L";
          return (
            <button
              key={option.unit}
              type="button"
              disabled={disabled}
              onClick={() => onAdd(option.unit, option.unit === "plate" ? 1 : 1)}
              className={cn(
                "min-h-11 rounded-xl px-2 text-center text-xs font-bold leading-tight touch-manipulation",
                ready ? "bg-ink text-gold" : "bg-paper text-cocoa",
                amount > 0 && "ring-2 ring-saffron",
              )}
            >
              <span className="block">{label}</span>
              <span className="block tabular-nums">{ready ? inr(option.price, Number.isInteger(option.price) ? 0 : 2) : t("setRate")}</span>
            </button>
          );
        })}
      </div>
      {chipUnit && (
        <div className="grid grid-cols-3 gap-1 px-2 pb-2 pt-1">
          {CHIPS[chipUnit].map((chip) => (
            <button
              key={chip.label}
              type="button"
              disabled={disabled}
              onClick={() => onAdd(chipUnit, chip.delta)}
              className="min-h-11 rounded-xl bg-paper text-sm font-bold text-ink touch-manipulation active:bg-gold"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}
      {disabled && <span className="px-3 pb-3 text-xs font-bold uppercase tracking-wide text-red-600">{t("outOfStock")}</span>}
      {badges.length > 0 && (
        <span className="absolute -right-1 -top-1 grid h-8 min-w-8 place-items-center rounded-full bg-saffron px-1.5 text-[11px] font-extrabold text-ink shadow-card">
          {badges.join(" · ")}
        </span>
      )}
    </article>
  );
}
