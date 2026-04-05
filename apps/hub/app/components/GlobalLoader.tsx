"use client";

import type { CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Layers3 } from "lucide-react";
import { getCompany } from "@henryco/brand";
import { HenryCoActivityIndicator } from "@henryco/ui";

type GlobalLoaderProps = {
  title?: string;
  subtitle?: string;
  statusLabel?: string;
  accent?: string;
};

/**
 * Route loading UI for hub segments. No minimum-duration timer — unmounts as soon as the route is ready.
 */
export default function GlobalLoader({
  title,
  subtitle,
  statusLabel,
  accent: accentOverride,
}: GlobalLoaderProps) {
  const reduceMotion = useReducedMotion();
  const company = getCompany("hub") as
    | {
        parentBrand?: string;
        title?: string;
        accent?: string;
      }
    | undefined;

  const brandTitle = title?.trim() || company?.parentBrand?.trim() || "Henry & Co.";
  const brandSub = subtitle?.trim() || company?.title?.trim() || "Company Hub";
  const accent = accentOverride?.trim() || company?.accent?.trim() || "#C9A227";
  const statusText = statusLabel?.trim() || "Loading";

  return (
    <AnimatePresence>
      <motion.div
        key="route-loader"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.18 } }}
        className="pointer-events-auto fixed inset-0 z-[200] overflow-hidden bg-[#040814]"
        aria-live="polite"
        aria-busy="true"
        role="status"
        style={{ "--loader-accent": accent } as CSSProperties}
      >
        <span className="sr-only">{statusText}</span>

        <div className="absolute inset-0 bg-[radial-gradient(1100px_600px_at_18%_8%,rgba(201,162,39,0.16),transparent_55%),radial-gradient(900px_520px_at_82%_18%,rgba(59,130,246,0.10),transparent_58%),radial-gradient(880px_520px_at_50%_100%,rgba(168,85,247,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:24px_24px] opacity-30" />

        <div className="relative flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-md">
            <div className="rounded-[32px] border border-white/10 bg-white/[0.055] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.36)] backdrop-blur-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="relative grid h-20 w-20 place-items-center rounded-[24px] border border-white/12 bg-[color:var(--loader-accent)] shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
                  {reduceMotion ? (
                    <HenryCoActivityIndicator size="md" className="text-black" label={statusText} />
                  ) : (
                    <Layers3 className="h-8 w-8 text-black" aria-hidden />
                  )}
                </div>

                <div className="mt-8 text-[12px] uppercase tracking-[0.34em] text-white/42">{brandSub}</div>
                <div className="mt-2 text-3xl font-semibold tracking-tight text-white">{brandTitle}</div>
                <div className="mt-6 flex items-center justify-center gap-3 text-sm font-medium text-white/58">
                  {!reduceMotion ? (
                    <HenryCoActivityIndicator size="sm" className="text-white/70" label={statusText} />
                  ) : null}
                  {statusText}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
