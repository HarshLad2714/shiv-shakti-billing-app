import { inr } from "../utils/format";

export default function TotalsBox({ cart, t }) {
  return (
    <div className="space-y-1 text-sm">
      <Row label={t("subtotal")} value={inr(cart.subtotal)} />
      <Row label={t("discount")} value={`− ${inr(cart.discount)}`} />
      {cart.tax > 0 && <Row label={t("gstLine")} value={inr(cart.tax)} />}
      {cart.roundOffAmount !== 0 && <Row label={t("roundOffLine")} value={inr(cart.roundOffAmount)} />}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-cocoa">
      <span>{label}</span>
      <span className="font-semibold tabular-nums text-ink">{value}</span>
    </div>
  );
}
