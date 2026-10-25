import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "../components/Modal";
import { CATEGORIES, orderedCategories, packUnit, rateMode, uniqueId } from "../data/menu";
import { useApp } from "../store/AppContext";
import { cn, inr, todayKey } from "../utils/format";
import { downloadFile } from "../utils/storage";

function moneyLabel(value) {
  return value > 0 ? inr(value, Number.isInteger(value) ? 0 : 2) : "—";
}

function rateSummary(item, t) {
  const mode = rateMode(item.category);
  const plateName = item.category === "Beverages" ? t("glass") : item.category === "Cold Drinks" ? t(packUnit(item)) : item.offersCheese ? t("plain") : t("plate");
  const plate = `${plateName} ${moneyLabel(item.platePrice)}`;
  if (mode === "kg") return `${plate} · ${t("kg")} ${moneyLabel(item.kgPrice)}`;
  if (mode === "litre") return `${plate} · ${t("litre")} ${moneyLabel(item.litrePrice)}`;
  return item.offersCheese ? `${plate} · ${t("cheese")} ${moneyLabel(item.cheesePrice)}` : plate;
}

const EMPTY_ITEM = {
  id: "",
  name: "",
  nameGu: "",
  category: "Samosa",
  newCategory: "",
  platePrice: "",
  kgPrice: "",
  litrePrice: "",
  cheesePrice: "",
  offersCheese: false,
  image: "",
  available: true,
  hidden: false,
  needsReview: false,
};

export default function Admin() {
  const { adminUnlocked } = useApp();
  if (!adminUnlocked) return <PinGate />;
  return <AdminDesk />;
}

function PinGate() {
  const { settings, unlockAdmin, t } = useApp();
  const [pin, setPin] = useState("");
  const [bad, setBad] = useState(false);

  useEffect(() => {
    const onKey = (event) => {
      if (bad) return;
      if (event.key === "Backspace") {
        setPin((current) => current.slice(0, -1));
        return;
      }
      if (!/^\d$/.test(event.key)) return;
      setPin((current) => `${current}${event.key}`.slice(0, 4));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bad]);

  useEffect(() => {
    if (pin.length !== 4) return undefined;
    if (unlockAdmin(pin)) return undefined;
    setBad(true);
    const timer = setTimeout(() => {
      setPin("");
      setBad(false);
    }, 380);
    return () => clearTimeout(timer);
  }, [pin, unlockAdmin]);

  const press = (digit) => {
    if (bad) return;
    setPin((current) => `${current}${digit}`.slice(0, 4));
  };

  return (
    <div className="grid h-full place-items-center px-4 py-8">
      <div className={cn("w-full max-w-sm rounded-3xl bg-white p-5 text-center shadow-lift", bad && "animate-shake")}>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-saffronDeep">{t("pinTitle")}</p>
        <h1 className="mt-1 font-display text-3xl">{t("pinHint")}</h1>
        <div className="mt-4 flex justify-center gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <span key={index} className={cn("h-4 w-4 rounded-full", pin.length > index ? "bg-saffron" : "bg-paper ring-1 ring-black/10")} />
          ))}
        </div>
        {bad && <p className="mt-3 text-sm font-semibold text-red-600">{t("wrongPin")}</p>}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button key={digit} type="button" className="min-h-14 rounded-2xl bg-paper text-2xl font-bold" onClick={() => press(digit)}>
              {digit}
            </button>
          ))}
          <button type="button" className="min-h-14 rounded-2xl text-sm font-bold text-cocoa" onClick={() => setPin("")}>
            {t("clear")}
          </button>
          <button type="button" className="min-h-14 rounded-2xl bg-paper text-2xl font-bold" onClick={() => press("0")}>
            0
          </button>
          <button type="button" className="min-h-14 rounded-2xl text-xl font-bold" onClick={() => setPin((current) => current.slice(0, -1))} aria-label="Backspace">
            ⌫
          </button>
        </div>
        {settings.pin === "1234" && <p className="mt-4 text-sm text-cocoa">{t("defaultPinNote")}</p>}
      </div>
    </div>
  );
}

function AdminDesk() {
  const {
    items,
    bills,
    settings,
    draft,
    nextBillNo,
    t,
    updateSettings,
    saveItem,
    deleteItem,
    resetMenu,
    restoreBackup,
    lockAdmin,
    changePin,
  } = useApp();
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingReset, setPendingReset] = useState(false);
  const [pendingRestore, setPendingRestore] = useState(null);
  const [pinForm, setPinForm] = useState({ current: "", next: "", confirm: "" });
  const fileRef = useRef(null);

  const categories = useMemo(() => orderedCategories(items), [items]);
  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...items]
      .filter((item) => !q || item.name.toLowerCase().includes(q) || (item.nameGu || "").includes(query.trim()))
      .sort((a, b) => categories.indexOf(a.category) - categories.indexOf(b.category) || a.name.localeCompare(b.name));
  }, [items, query, categories]);

  const downloadBackup = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      items,
      bills,
      settings,
      draft,
      nextBillNo,
    };
    downloadFile(`shiv-shakti-backup-${todayKey()}.json`, JSON.stringify(payload, null, 2), "application/json");
  };

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      setPendingRestore(data);
    } catch {
      setPendingRestore({ invalid: true });
    }
  };

  const submitItem = (event) => {
    event.preventDefault();
    const category = form.category === "__new" ? form.newCategory.trim() : form.category;
    const item = {
      id: form.id || uniqueId(form.name, items),
      name: form.name,
      nameGu: form.nameGu,
      category,
      platePrice: form.platePrice,
      kgPrice: form.kgPrice,
      litrePrice: form.litrePrice,
      cheesePrice: form.cheesePrice,
      offersCheese: form.offersCheese,
      image: form.image,
      available: form.available,
      hidden: form.hidden,
      needsReview: false,
    };
    if (saveItem(item)) setForm(null);
  };

  return (
    <div className="h-full overflow-y-auto px-3 py-4 lg:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{t("admin")}</h1>
          <p className="text-sm text-cocoa">{t("savedOk")}</p>
        </div>
        <button type="button" className="btn-ghost" onClick={lockAdmin}>
          {t("lock")}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-3xl bg-white p-4 shadow-card">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-2xl">{t("items")}</h2>
            <button type="button" className="btn-primary" onClick={() => setForm({ ...EMPTY_ITEM })}>
              {t("addItem")}
            </button>
          </div>
          <input className="field mb-3" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchPlaceholder")} />
          <div className="grid gap-2">
            {visibleItems.map((item) => (
              <article key={item.id} className="flex flex-col gap-3 rounded-2xl bg-paper p-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-cocoa">
                    {item.nameGu ? `${item.nameGu} · ` : ""}
                    {item.category} · {rateSummary(item, t)}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {!item.available && <Badge>{t("outOfStock")}</Badge>}
                    {item.hidden && <Badge>{t("hidden")}</Badge>}
                    {item.needsReview && <Badge tone="warn">{t("needsReview")}</Badge>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" className="btn-ghost" onClick={() => saveItem({ ...item, available: !item.available })}>
                    {item.available ? t("stockOut") : t("stockIn")}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => saveItem({ ...item, hidden: !item.hidden })}>
                    {item.hidden ? t("showItem") : t("hideItem")}
                  </button>
                  <button
                    type="button"
                    className="btn-dark"
                    onClick={() =>
                      setForm({
                        ...item,
                        newCategory: "",
                        platePrice: item.platePrice ?? "",
                        kgPrice: item.kgPrice ?? "",
                        litrePrice: item.litrePrice ?? "",
                        cheesePrice: item.cheesePrice ?? "",
                        offersCheese: Boolean(item.offersCheese),
                      })
                    }
                  >
                    {t("edit")}
                  </button>
                  <button type="button" className="btn-danger" onClick={() => setPendingDelete(item)}>
                    {t("delete")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-3xl bg-white p-4 shadow-card">
            <h2 className="font-display text-2xl">{t("shopSettings")}</h2>
            <div className="mt-3 space-y-3">
              <Field label={t("shopName")}>
                <input className="field" value={settings.shopName} onChange={(event) => updateSettings({ shopName: event.target.value })} />
              </Field>
              <Field label={t("tagline")}>
                <input className="field" value={settings.tagline} onChange={(event) => updateSettings({ tagline: event.target.value })} />
              </Field>
              <Field label={t("taglineGu")}>
                <input className="field" value={settings.taglineGu} onChange={(event) => updateSettings({ taglineGu: event.target.value })} />
              </Field>
              <Field label={t("address")}>
                <textarea className="field min-h-20 py-2" value={settings.address} onChange={(event) => updateSettings({ address: event.target.value })} />
              </Field>
              <Field label={t("phone")}>
                <input className="field" value={settings.phone} onChange={(event) => updateSettings({ phone: event.target.value })} />
              </Field>
              <label className="flex min-h-11 items-center justify-between gap-3 text-sm font-semibold">
                {t("gstDefault")}
                <input type="checkbox" checked={settings.gstEnabled} onChange={(event) => updateSettings({ gstEnabled: event.target.checked })} />
              </label>
              <Field label={t("gstPercent")}>
                <input className="field" inputMode="decimal" value={settings.gstPercent} onChange={(event) => updateSettings({ gstPercent: Number(event.target.value) || 0 })} />
              </Field>
              <label className="flex min-h-11 items-center justify-between gap-3 text-sm font-semibold">
                {t("roundDefault")}
                <input type="checkbox" checked={settings.roundOff} onChange={(event) => updateSettings({ roundOff: event.target.checked })} />
              </label>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-4 shadow-card">
            <h2 className="font-display text-2xl">{t("changePin")}</h2>
            <form
              className="mt-3 space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (changePin(pinForm.current, pinForm.next, pinForm.confirm)) setPinForm({ current: "", next: "", confirm: "" });
              }}
            >
              <input className="field" inputMode="numeric" maxLength={4} placeholder={t("currentPin")} value={pinForm.current} onChange={(event) => setPinForm({ ...pinForm, current: event.target.value.replace(/\D/g, "") })} />
              <input className="field" inputMode="numeric" maxLength={4} placeholder={t("newPin")} value={pinForm.next} onChange={(event) => setPinForm({ ...pinForm, next: event.target.value.replace(/\D/g, "") })} />
              <input className="field" inputMode="numeric" maxLength={4} placeholder={t("confirmPin")} value={pinForm.confirm} onChange={(event) => setPinForm({ ...pinForm, confirm: event.target.value.replace(/\D/g, "") })} />
              <button type="submit" className="btn-dark w-full">
                {t("updatePin")}
              </button>
            </form>
          </section>

          <section className="rounded-3xl bg-ink p-4 text-white shadow-card">
            <h2 className="font-display text-2xl text-gold">{t("danger")}</h2>
            <p className="mt-1 text-sm text-white/70">{t("installHint")}</p>
            <div className="mt-3 grid gap-2">
              <button type="button" className="btn-primary" onClick={downloadBackup}>
                {t("downloadBackup")}
              </button>
              <button type="button" className="btn bg-white text-ink" onClick={() => fileRef.current?.click()}>
                {t("restoreBackup")}
              </button>
              <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
              <button type="button" className="btn bg-white/10 text-white" onClick={() => setPendingReset(true)}>
                {t("resetMenu")}
              </button>
            </div>
          </section>
        </div>
      </div>

      <Modal open={Boolean(form)} title={form?.id ? t("editItem") : t("addItem")} onClose={() => setForm(null)} wide>
        {form && (
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={submitItem}>
            <Field label={t("name")}>
              <input className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </Field>
            <Field label={t("nameGu")}>
              <input className="field" value={form.nameGu} onChange={(event) => setForm({ ...form, nameGu: event.target.value })} />
            </Field>
            <Field label={t("category")}>
              <select
                className="field"
                value={form.category}
                onChange={(event) =>
                  setForm({
                    ...form,
                    category: event.target.value,
                    offersCheese: event.target.value === "Maggi" ? true : form.offersCheese,
                  })
                }
              >
                {[...new Set([...CATEGORIES, ...categories])].map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
                <option value="__new">{t("newCategory")}</option>
              </select>
            </Field>
            {form.category === "__new" && (
              <Field label={t("newCategory")}>
                <input className="field" value={form.newCategory} onChange={(event) => setForm({ ...form, newCategory: event.target.value })} required />
              </Field>
            )}
            <Field label={form.category === "Beverages" ? t("glassRate") : form.category === "Cold Drinks" ? t(/tin|ટિન/i.test(`${form.name} ${form.nameGu}`) ? "tinRate" : "bottleRate") : form.offersCheese ? t("plainRate") : t("plateRate")}>
              <input className="field" inputMode="decimal" placeholder={t("optional")} value={form.platePrice} onChange={(event) => setForm({ ...form, platePrice: event.target.value })} />
            </Field>
            {rateMode(form.category) === "kg" && (
              <Field label={t("kgRate")}>
                <input className="field" inputMode="decimal" placeholder={t("optional")} value={form.kgPrice} onChange={(event) => setForm({ ...form, kgPrice: event.target.value })} />
              </Field>
            )}
            {rateMode(form.category) === "litre" && (
              <Field label={t("litreRate")}>
                <input className="field" inputMode="decimal" placeholder={t("optional")} value={form.litrePrice} onChange={(event) => setForm({ ...form, litrePrice: event.target.value })} />
              </Field>
            )}
            {rateMode(form.category) === "plate" && form.category !== "Cold Drinks" && (
              <label className="flex min-h-11 items-center gap-2 text-sm font-semibold sm:col-span-2">
                <input type="checkbox" checked={form.offersCheese} onChange={(event) => setForm({ ...form, offersCheese: event.target.checked })} />
                {t("cheeseOption")}
              </label>
            )}
            {rateMode(form.category) === "plate" && form.offersCheese && (
              <Field label={t("cheeseRate")}>
                <input className="field" inputMode="decimal" placeholder={t("optional")} value={form.cheesePrice} onChange={(event) => setForm({ ...form, cheesePrice: event.target.value })} />
              </Field>
            )}
            <Field label={`${t("imageUrl")} (${t("optional")})`}>
              <input className="field" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="https://" />
            </Field>
            <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={form.available} onChange={(event) => setForm({ ...form, available: event.target.checked })} />
              {t("available")}
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={form.hidden} onChange={(event) => setForm({ ...form, hidden: event.target.checked })} />
              {t("hidden")}
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary w-full">
                {t("saveItem")}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={Boolean(pendingDelete)} title={t("deleteConfirm")} onClose={() => setPendingDelete(null)}>
        <p className="text-cocoa">{t("deleteBody")}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className="btn-ghost" onClick={() => setPendingDelete(null)}>
            {t("cancel")}
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              deleteItem(pendingDelete.id);
              setPendingDelete(null);
            }}
          >
            {t("delete")}
          </button>
        </div>
      </Modal>

      <Modal open={pendingReset} title={t("resetMenu")} onClose={() => setPendingReset(false)}>
        <p className="text-cocoa">{t("resetWarn")}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className="btn-ghost" onClick={() => setPendingReset(false)}>
            {t("cancel")}
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              resetMenu();
              setPendingReset(false);
            }}
          >
            {t("yesReset")}
          </button>
        </div>
      </Modal>

      <Modal open={Boolean(pendingRestore)} title={t("restore")} onClose={() => setPendingRestore(null)}>
        <p className="text-cocoa">{pendingRestore?.invalid ? t("invalidBackup") : t("restoreWarn")}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className="btn-ghost" onClick={() => setPendingRestore(null)}>
            {t("cancel")}
          </button>
          <button
            type="button"
            className="btn-danger"
            disabled={pendingRestore?.invalid}
            onClick={() => {
              if (restoreBackup(pendingRestore)) setPendingRestore(null);
            }}
          >
            {t("yesRestore")}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Badge({ children, tone = "neutral" }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide", tone === "warn" ? "bg-gold text-ink" : "bg-white text-cocoa")}>
      {children}
    </span>
  );
}
