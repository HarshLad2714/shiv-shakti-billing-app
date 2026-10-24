import { categoryLabel } from "../data/menu";
import { cn } from "../utils/format";

export default function CategoryTabs({ categories, value, onChange, language, allLabel }) {
  const tabs = [{ id: "all", label: allLabel }, ...categories.map((category) => ({ id: category, label: categoryLabel(category, language) }))];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold touch-manipulation",
              active ? "bg-ink text-gold shadow-card" : "bg-white text-ink ring-1 ring-black/10",
            )}
            aria-pressed={active}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
