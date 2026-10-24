import { useEffect } from "react";
import { cn } from "../utils/format";

export default function Modal({ open, title, onClose, children, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-cream p-4 shadow-lift sm:rounded-3xl",
          wide ? "sm:max-w-xl" : "sm:max-w-md",
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl leading-tight">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-xl" aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
