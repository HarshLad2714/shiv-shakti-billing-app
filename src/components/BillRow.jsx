import { useEffect, useState } from "react";
import { qtyStep } from "../utils/calc";
import { cn, formatQty, inr } from "../utils/format";

const SET_QTY = {
  kg: [
    { label: "250g", qty: 0.25 },
    { label: "500g", qty: 0.5 },
    { label: "1kg", qty: 1 },
  ],
  litre: [
    { label: "200ml", qty: 0.2 },
    { label: "500ml", qty: 0.5 },
    { label: "1L", qty: 1 },
  ],
};

export default function BillRow({ line, active, language, onSetQty, onRemove }) {
  const [text, setText] = useState(String(line.qty));
  const name = language === "gu" && line.nameGu ? line.nameGu : line.name;
  const step = qtyStep(line.unit);
  const chips = SET_QTY[line.unit];

  useEffect(() => {
    setText(String(line.qty));
  }, [line.qty]);

  const commit = () => {
    const next = Number(text);
    if (!Number.isFinite(next) || next <= 0) {
      onRemove();
      return;
    }
    onSetQty(next);
  };

  const unitLabel =
    line.unit === "kg"
      ? "kg"
      : line.unit === "litre"
        ? "L"
        : line.unit === "cheese"
          ? language === "gu"
            ? "ચીઝ"
            : "cheese"
          : line.unit === "bottle"
            ? language === "gu"
              ? "બોટલ"
              : "bottle"
            : line.unit === "tin"
              ? language === "gu"
                ? "ટિન"
                : "tin"
              : language === "gu"
                ? "પ્લેટ"
                : "plate";

  return (
    <div className={cn("border-b border-dashed border-black/10 py-2.5 last:border-b-0", active && "animate-pop")}>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold leading-snug">{name}</div>
          <div className="text-xs text-cocoa">
            {inr(line.price)} · {unitLabel}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" className="grid h-10 w-10 place-items-center rounded-xl bg-paper text-xl font-bold" onClick={() => onSetQty(line.qty - step)} aria-label="Decrease">
            −
          </button>
          <input
            inputMode="decimal"
            className="h-10 w-12 rounded-xl border border-black/10 bg-white text-center text-base font-semibold tabular-nums"
            value={text}
            aria-label={`${name} quantity`}
            onChange={(event) => setText(event.target.value)}
            onBlur={commit}
            onFocus={(event) => event.target.select()}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
          />
          <button type="button" className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-xl font-bold text-gold" onClick={() => onSetQty(line.qty + step)} aria-label="Increase">
            +
          </button>
        </div>
        <div className="w-20 shrink-0 text-right">
          <div className="font-bold tabular-nums">{inr(line.amount)}</div>
          <button type="button" onClick={onRemove} className="ml-auto grid h-7 w-7 place-items-center rounded-full text-lg text-cocoa hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${name}`}>
            ×
          </button>
        </div>
      </div>
      {(line.unit === "kg" || line.unit === "litre") && <p className="mt-1 text-xs font-semibold text-cocoa">{formatQty(line.qty, line.unit, language)}</p>}
      {chips && (
        <div className="mt-2 flex gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => onSetQty(chip.qty)}
              className={cn(
                "min-h-10 flex-1 rounded-xl px-2 text-xs font-bold",
                Number(line.qty) === chip.qty ? "bg-saffron text-ink" : "bg-paper text-ink",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
