import { categoryLabel } from "../data/menu";
import ItemCard from "./ItemCard";

export default function ItemGrid({ groups, flat, language, qtyOf, onAdd, t }) {
  if (!flat.length) {
    return <div className="rounded-3xl bg-white px-6 py-16 text-center text-cocoa shadow-card">{t("noResults")}</div>;
  }

  if (groups.length === 1 && groups[0].flat) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {flat.map((item) => (
          <ItemCard key={item.id} item={item} qty={qtyOf(item.id)} language={language} onAdd={(unit, delta) => onAdd(item.id, unit, delta)} t={t} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.category} aria-label={group.category}>
          <h2 className="mb-2 font-display text-xl">{categoryLabel(group.category, language)}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {group.items.map((item) => (
              <ItemCard key={item.id} item={item} qty={qtyOf(item.id)} language={language} onAdd={(unit, delta) => onAdd(item.id, unit, delta)} t={t} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
