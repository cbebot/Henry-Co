"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useMarketplaceRuntime } from "@/components/marketplace/runtime-provider";
import { cn } from "@/lib/utils";

export function MarketplaceToastStack() {
  const runtime = useMarketplaceRuntime();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] mx-auto flex max-w-[1480px] justify-end px-4 sm:px-6 xl:px-8">
      <div className="w-full max-w-sm space-y-3">
        <AnimatePresence>
          {runtime.toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              className={cn(
                "pointer-events-auto overflow-hidden rounded-[1.45rem] border px-4 py-4 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl",
                toast.tone === "success" &&
                  "border-[rgba(144,215,186,0.26)] bg-[rgba(11,21,20,0.9)] text-[var(--market-success)]",
                toast.tone === "error" &&
                  "border-[rgba(255,171,151,0.28)] bg-[rgba(27,14,16,0.92)] text-[var(--market-alert)]",
                toast.tone === "info" &&
                  "border-[rgba(117,209,255,0.26)] bg-[rgba(10,16,28,0.92)] text-[var(--market-paper-white)]"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {toast.tone === "success" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : toast.tone === "error" ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : (
                    <Info className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{toast.title}</p>
                  {toast.body ? <p className="mt-1 text-sm opacity-80">{toast.body}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => runtime.dismissToast(toast.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-current/12"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
