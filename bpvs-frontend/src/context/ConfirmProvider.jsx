import { createContext, useContext, useCallback, useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

/**
 * Reusable confirmation dialog.
 *
 * Usage anywhere in the app:
 *   const confirm = useConfirm();
 *   const ok = await confirm({
 *     title: "Delete member?",
 *     message: "This action cannot be undone.",
 *     confirmText: "Delete",
 *     variant: "danger",
 *   });
 *   if (!ok) return;
 *
 * Returns a Promise<boolean> — true if confirmed, false if cancelled.
 */
const ConfirmContext = createContext(null);

const DEFAULTS = {
  title: "Are you sure?",
  message: "",
  confirmText: "Confirm",
  cancelText: "Cancel",
  variant: "danger", // "danger" | "primary"
};

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { options, resolve } | null

  const confirm = useCallback(
    (options = {}) =>
      new Promise((resolve) => {
        setState({ options: { ...DEFAULTS, ...options }, resolve });
      }),
    [],
  );

  const close = useCallback(
    (result) => {
      setState((curr) => {
        if (curr) curr.resolve(result);
        return null;
      });
    },
    [],
  );

  // Close on Escape (treated as cancel)
  useEffect(() => {
    if (!state) return;
    const onKey = (e) => {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter") close(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, close]);

  const opts = state?.options;
  const isDanger = opts?.variant === "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {state && (
        <div
          onClick={() => close(false)}
          className="fixed inset-0 z-[600] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full overflow-hidden shadow-2xl"
            style={{ maxWidth: 400, margin: "auto", animation: "dp-fade-scale 0.22s ease-out both" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b border-stone-100"
              style={{ background: isDanger ? "#FEF2F2" : "#FEF8F6" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: isDanger ? "#FEE2E2" : "#FCE9E3" }}
                >
                  <AlertTriangle
                    size={16}
                    strokeWidth={2.3}
                    style={{ color: isDanger ? "#DC2626" : "#C94621" }}
                  />
                </div>
                <h2 className="text-base font-semibold text-gray-900">{opts.title}</h2>
              </div>
              <button
                onClick={() => close(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-stone-200 bg-white text-gray-500 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X size={15} strokeWidth={2.2} />
              </button>
            </div>

            {/* Body */}
            {opts.message && (
              <div className="px-5 py-4">
                <p className="text-[13.5px] text-gray-600 leading-relaxed">{opts.message}</p>
              </div>
            )}

            {/* Actions */}
            <div className={`flex gap-3 px-5 pb-5 ${opts.message ? "" : "pt-4"}`}>
              <button
                onClick={() => close(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                {opts.cancelText}
              </button>
              <button
                onClick={() => close(true)}
                autoFocus
                className={`flex-1 py-3 rounded-xl text-sm font-semibold text-white transition cursor-pointer ${
                  isDanger ? "bg-[#DC2626] hover:bg-[#B91C1C]" : "bg-[#C94621] hover:bg-[#B33D1E]"
                }`}
              >
                {opts.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within <ConfirmProvider>");
  return ctx;
}
