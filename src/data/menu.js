export const CATEGORIES = [
  "Samosa",
  "Rolls & Snacks",
  "Snacks",
  "Momos",
  "Maggi",
  "Pasta",
  "Sandwiches",
  "Franckie",
  "Garlic Bread",
  "Dahi Wada",
  "Dhokla",
  "Uppam",
  "Beverages",
];

export const CATEGORY_META = {
  Samosa: { icon: "🥟" },
  "Rolls & Snacks": { icon: "🌯" },
  Snacks: { icon: "🍟" },
  Momos: { icon: "🥟" },
  Maggi: { icon: "🍜" },
  Pasta: { icon: "🍝" },
  Sandwiches: { icon: "🥪" },
  Franckie: { icon: "🌭" },
  "Garlic Bread": { icon: "🍞" },
  "Dahi Wada": { icon: "🥣" },
  Dhokla: { icon: "🍲" },
  Uppam: { icon: "🍛" },
  Beverages: { icon: "🥤" },
};

export const CATEGORY_LABELS = {
  gu: {
    Samosa: "સમોસા",
    "Rolls & Snacks": "રોલ અને સ્નેક્સ",
    Snacks: "સ્નેક્સ",
    Momos: "મોમોઝ",
    Maggi: "મેગી",
    Pasta: "પાસ્તા",
    Sandwiches: "સેન્ડવિચ",
    Franckie: "ફ્રાંકી",
    "Garlic Bread": "ગાર્લિક બ્રેડ",
    "Dahi Wada": "દહીં વડા",
    Dhokla: "ઢોકળા",
    Uppam: "ઉપ્પમ",
    Beverages: "પીણાં",
  },
};

export function categoryLabel(category, language) {
  if (language === "gu") return CATEGORY_LABELS.gu[category] || category;
  return category;
}

export function slugify(name) {
  const base = String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || `item-${Date.now()}`;
}

export function uniqueId(name, items) {
  const ids = new Set(items.map((item) => item.id));
  let id = slugify(name);
  let n = 2;
  while (ids.has(id)) id = `${slugify(name)}-${n++}`;
  return id;
}

export function orderedCategories(items) {
  const present = new Set(items.map((item) => item.category));
  const preset = CATEGORIES.filter((category) => present.has(category));
  const extra = [...present].filter((category) => !CATEGORIES.includes(category)).sort();
  return [...preset, ...extra];
}

const ROWS = [
  ["Samosa", "Cheese Paneer Samosa", "ચીઝ પનીર સમોસા", 400, "kg", { needsReview: true }],
  ["Samosa", "Cheese Corn Samosa", "ચીઝ કોર્ન સમોસા", 400, "kg", { needsReview: true }],
  ["Samosa", "Dal Samosa", "દાળ સમોસા", 150, "kg"],
  ["Samosa", "Chinese Samosa", "ચાઇનીઝ સમોસા", 220, "kg"],
  ["Rolls & Snacks", "Spring Roll", "સ્પ્રિંગ રોલ", 350, "kg"],
  ["Rolls & Snacks", "Mexican Roll", "મેક્સિકન રોલ", 350, "kg"],
  ["Rolls & Snacks", "Mayo Paav", "મેયો પાવ", 250, "kg"],
  ["Rolls & Snacks", "Kachi Sandwich", "કચી સેન્ડવિચ", 250, "kg"],
  ["Momos", "Veg Momos", "વેજ મોમોઝ", 300, "kg"],
  ["Momos", "Paneer Momos", "પનીર મોમોઝ", 350, "kg"],
  ["Momos", "Cheese Momos", "ચીઝ મોમોઝ", 400, "kg"],
  ["Momos", "Tandoori Momos", "તંદૂરી મોમોઝ", 400, "kg"],
  ["Momos", "Fried Momos", "ફ્રાઇડ મોમોઝ", 450, "kg"],
  ["Franckie", "Veg Franckie", "વેજ ફ્રાંકી", 300, "kg"],
  ["Franckie", "Tandoori Franckie", "તંદૂરી ફ્રાંકી", 350, "kg"],
  ["Franckie", "Cheese Franckie", "ચીઝ ફ્રાંકી", 400, "kg"],
  ["Franckie", "Schezwan Franckie", "સિઝવાન ફ્રાંકી", 450, "kg"],
  ["Maggi", "Plain Maggi", "પ્લેન મેગી", 250, "kg", { offersCheese: true }],
  ["Maggi", "Veg Maggi", "વેજ મેગી", 300, "kg", { offersCheese: true }],
  ["Maggi", "Cheese Maggi", "ચીઝ મેગી", 350, "kg"],
  ["Maggi", "Tandoori Maggi", "તંદૂરી મેગી", 450, "kg", { offersCheese: true }],
  ["Pasta", "White Sauce Pasta", "વાઇટ સોસ પાસ્તા", 0, "plate", { platePrice: null, needsReview: true }],
  ["Pasta", "Pink Sauce Pasta", "પિંક સોસ પાસ્તા", 0, "plate", { platePrice: null, needsReview: true }],
  ["Sandwiches", "Veg Sandwich", "વેજ સેન્ડવિચ", 300, "kg", { needsReview: true }],
  ["Sandwiches", "Cheese Sandwich", "ચીઝ સેન્ડવિચ", 300, "kg", { needsReview: true }],
  ["Sandwiches", "Corn Sandwich", "કોર્ન સેન્ડવિચ", 360, "kg", { needsReview: true }],
  ["Sandwiches", "Paneer Sandwich", "પનીર સેન્ડવિચ", 360, "kg", { needsReview: true }],
  ["Garlic Bread", "Classic Garlic Bread", "ક્લાસિક ગાર્લિક બ્રેડ", 300, "kg"],
  ["Garlic Bread", "Cheese Garlic Bread", "ચીઝ ગાર્લિક બ્રેડ", 350, "kg"],
  ["Garlic Bread", "Peri Peri Garlic Bread", "પેરી પેરી ગાર્લિક બ્રેડ", 379, "kg", { needsReview: true }],
  ["Dahi Wada", "Dahi Wada", "દહીં વડા", 350, "kg"],
  ["Dhokla", "Cheese Dhokla", "ચીઝ ઢોકળા", 0, "kg", { platePrice: null, kgPrice: null, needsReview: true }],
  ["Dhokla", "Vegetable Makai Dhokla", "વેજીટેબલ મકાઈ ઢોકળા", 0, "kg", { platePrice: null, kgPrice: null, needsReview: true }],
  ["Uppam", "Vegetable Uppam", "વેજીટેબલ ઉપ્પમ", 0, "kg", { platePrice: null, kgPrice: null, needsReview: true }],
  ["Uppam", "Cheese Uppam", "ચીઝ ઉપ્પમ", 0, "kg", { platePrice: null, kgPrice: null, needsReview: true }],
  ["Beverages", "Cold Coco", "કોલ્ડ કોકો", 180, "litre", { platePrice: 30 }],
  ["Beverages", "Cold Coffee", "કોલ્ડ કોફી", 180, "litre"],
  ["Beverages", "Black Coffee", "બ્લેક કોફી", 0, "litre", { platePrice: null, litrePrice: null, needsReview: true }],
  ["Beverages", "Iced Tea", "આઇસ્ડ ટી", 0, "litre", { platePrice: null, litrePrice: null, needsReview: true }],
  ["Beverages", "Masala Chaas", "મસાલા છાશ", 80, "litre"],
  ["Beverages", "Hot Chocolate", "હોટ ચોકલેટ", 180, "litre", { platePrice: 30, litrePrice: 180 }],
  ["Snacks", "French Fries Regular", "ફ્રેન્ચ ફ્રાઈઝ રેગ્યુલર", 0, "piece", { hidden: true, needsReview: true }],
  ["Snacks", "French Fries Peri Peri", "ફ્રેન્ચ ફ્રાઈઝ પેરી પેરી", 0, "piece", { hidden: true, needsReview: true }],
  ["Snacks", "French Fries Cheese", "ફ્રેન્ચ ફ્રાઈઝ ચીઝ", 0, "piece", { hidden: true, needsReview: true }],
  ["Snacks", "Veg Nuggets", "વેજ નગેટ્સ", 0, "piece", { hidden: true, needsReview: true }],
  ["Snacks", "Cheese Nuggets", "ચીઝ નગેટ્સ", 0, "piece", { hidden: true, needsReview: true }],
  ["Snacks", "Cheese Balls", "ચીઝ બોલ્સ", 0, "piece", { hidden: true, needsReview: true }],
];

function positiveRate(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export const KG_CATEGORIES = ["Samosa", "Momos", "Dhokla", "Uppam"];

export const RETIRED_IDS = new Set(["paneer-maggi", "fresh-lime-soda", "club-sandwich", "plain-dhokla", "badam-shake"]);

export function rateMode(category) {
  if (category === "Beverages") return "litre";
  if (KG_CATEGORIES.includes(category)) return "kg";
  return "plate";
}

function toItem([category, name, nameGu, price, unit, extra = {}]) {
  const platePrice = extra.platePrice !== undefined ? extra.platePrice : unit === "piece" || unit === "plate" ? positiveRate(price) : null;
  const kgPrice = extra.kgPrice !== undefined ? extra.kgPrice : unit === "kg" ? positiveRate(price) : null;
  const litrePrice = extra.litrePrice !== undefined ? extra.litrePrice : unit === "litre" ? positiveRate(price) : null;
  return normalizeItem({
    id: slugify(name),
    name,
    nameGu,
    category,
    platePrice,
    kgPrice,
    litrePrice,
    cheesePrice: extra.cheesePrice !== undefined ? extra.cheesePrice : null,
    offersCheese: Boolean(extra.offersCheese),
    image: "",
    available: true,
    hidden: Boolean(extra.hidden),
    needsReview: Boolean(extra.needsReview),
  });
}

export function normalizeItem(raw) {
  const legacyUnit = raw.unit === "piece" ? "plate" : raw.unit;
  const legacyPrice = positiveRate(raw.price);
  const read = (field, matchUnit) => {
    if (raw[field] === null || raw[field] === "") return null;
    if (raw[field] !== undefined) return positiveRate(raw[field]);
    return legacyUnit === matchUnit ? legacyPrice : null;
  };
  const platePrice = read("platePrice", "plate");
  const kgPrice = read("kgPrice", "kg");
  const litrePrice = read("litrePrice", "litre");
  const cheesePrice = raw.cheesePrice === null || raw.cheesePrice === "" || raw.cheesePrice === undefined ? null : positiveRate(raw.cheesePrice);
  return applySaleMode({
    image: "",
    available: true,
    hidden: false,
    needsReview: false,
    nameGu: "",
    offersCheese: false,
    ...raw,
    platePrice,
    kgPrice,
    litrePrice,
    cheesePrice,
  });
}

function applySaleMode(item) {
  const mode = rateMode(item.category);
  if (mode === "kg") {
    return {
      ...item,
      litrePrice: null,
      cheesePrice: null,
      offersCheese: false,
      price: item.platePrice ?? item.kgPrice ?? 0,
      unit: item.platePrice != null ? "plate" : "kg",
    };
  }
  if (mode === "litre") {
    return {
      ...item,
      kgPrice: null,
      cheesePrice: null,
      offersCheese: false,
      price: item.platePrice ?? item.litrePrice ?? 0,
      unit: item.platePrice != null ? "plate" : "litre",
    };
  }
  const platePrice = item.platePrice != null ? item.platePrice : item.kgPrice ?? null;
  const offersCheese = Boolean(item.offersCheese);
  return {
    ...item,
    platePrice,
    kgPrice: null,
    litrePrice: null,
    offersCheese,
    cheesePrice: offersCheese ? item.cheesePrice ?? null : null,
    price: platePrice ?? 0,
    unit: "plate",
  };
}

export function sellOptions(item) {
  const mode = rateMode(item.category);
  const options = [{ unit: "plate", price: item.platePrice }];
  if (mode === "kg") options.push({ unit: "kg", price: item.kgPrice });
  if (mode === "litre") options.push({ unit: "litre", price: item.litrePrice });
  if (item.offersCheese) options.push({ unit: "cheese", price: item.cheesePrice });
  return options;
}

export const ITEM_RENAMES = {
  "paneer-franckie": "tandoori-franckie",
  "mix-franckie": "schezwan-franckie",
};

export function mergeCatalog(saved, removedIds = []) {
  const removed = new Set(Array.isArray(removedIds) ? removedIds : []);
  const catalog = cloneMenu().filter((item) => !removed.has(item.id));
  if (!Array.isArray(saved) || saved.length === 0) return catalog;
  const byId = new Map(saved.filter((item) => item && item.id).map((item) => [item.id, item]));
  const renamedFrom = new Map(Object.entries(ITEM_RENAMES).map(([from, to]) => [to, from]));
  const catalogIds = new Set(catalog.map((item) => item.id));
  const merged = catalog.map((item) => {
    const old = byId.get(item.id) || byId.get(renamedFrom.get(item.id));
    if (!old) return { ...item };
    const previous = normalizeItem(old);
    const renamed = old.id !== item.id;
    return normalizeItem({
      ...item,
      ...previous,
      id: item.id,
      name: renamed ? item.name : old.name || item.name,
      nameGu: renamed ? item.nameGu : old.nameGu || item.nameGu,
      category: renamed ? item.category : old.category || item.category,
      hidden: old.hidden ?? item.hidden,
      available: old.available ?? item.available,
      needsReview: item.needsReview ? Boolean(old.needsReview) : false,
      image: old.image || "",
      offersCheese: Boolean(item.offersCheese || previous.offersCheese),
      platePrice:
        previous.platePrice != null
          ? previous.platePrice
          : rateMode(item.category) === "plate" && previous.kgPrice != null
            ? previous.kgPrice
            : item.platePrice,
      kgPrice: previous.kgPrice != null ? previous.kgPrice : item.kgPrice,
      litrePrice: previous.litrePrice != null ? previous.litrePrice : item.litrePrice,
      cheesePrice: previous.cheesePrice != null ? previous.cheesePrice : item.cheesePrice,
    });
  });
  const retired = new Set([...Object.keys(ITEM_RENAMES), ...RETIRED_IDS]);
  const extras = [...byId.values()]
    .filter((item) => !catalogIds.has(item.id) && !retired.has(item.id) && !removed.has(item.id))
    .map((item) => normalizeItem(item));
  return [...merged, ...extras];
}

export const DEFAULT_MENU = ROWS.map(toItem);

export function cloneMenu() {
  return DEFAULT_MENU.map((item) => ({ ...item }));
}
