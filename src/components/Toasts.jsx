import { useApp } from "../store/AppContext";
import { cn } from "../utils/format";

export default function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="no-print pointer-events-none fixed inset-x-0 top-3 z-[70] flex flex-col items-center gap-2 px-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto rounded-full px-4 py-2 text-sm font-semibold shadow-lift",
            toast.type === "err" ? "bg-red-600 text-white" : "bg-ink text-gold",
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
