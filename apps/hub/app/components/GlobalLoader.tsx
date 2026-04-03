"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Layers3 } from "lucide-react";
import { getCompany } from "@henryco/brand";

type GlobalLoaderProps = {
  variant?: "boot" | "route";
  minDurationMs?: number;
};

const BOOT_SESSION_KEY = "henryco:hub:boot-loader-seen";

function getInitialVisibility(variant: GlobalLoaderProps["variant"]) {
  if (variant === "route") {
    return true;
  }

  if (typeof window === "undefined") {
    return true;
  }

  try {
    return window.sessionStorage.getItem(BOOT_SESSION_KEY) !== "1";
  } catch {
    return true;
  }
}

export default function GlobalLoader({
  variant = "boot",
  minDurationMs,
}: GlobalLoaderProps) {
  const reduceMotion = useReducedMotion();
  const company = getCompany("hub") as
    | {
        parentBrand?: string;
        title?: string;
        accent?: string;
      }
    | undefined;

  const brandTitle = company?.parentBrand?.trim() || "Henry & Co.";
  const brandSub = company?.title?.trim() || "Company Hub";
  const accent = company?.accent?.trim() || "#C9A227";

  const duration = useMemo(() => {
    if (typeof minDurationMs === "number") return minDurationMs;
    return variant === "boot" ? 900 : 380;
  }, [minDurationMs, variant]);

  const [visible, setVisible] = useState(() => getInitialVisibility(variant));

  useEffect(() => {
    if (!visible) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (variant === "boot") {
        try {
          window.sessionStorage.setItem(BOOT_SESSION_KEY, "1");
        } catch {
          // Ignore storage issues and still dismiss the loader.
        }
      }

      setVisible(false);
    }, duration);

    return () => window.clearTimeout(timer);
  }, [duration, variant, visible]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key={`${variant}-loader`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.22 } }}
          className="pointer-events-auto fixed inset-0 z-[200] overflow-hidden bg-[#040814]"
          aria-live="polite"
          aria-busy="true"
          role="status"
          style={{ "--loader-accent": accent } as CSSProperties}
        >
          <span className="sr-only">Loading</span>

          <div className="absolute inset-0 bg-[radial-gradient(1100px_600px_at_18%_8%,rgba(201,162,39,0.16),transparent_55%),radial-gradient(900px_520px_at_82%_18%,rgba(59,130,246,0.10),transparent_58%),radial-gradient(880px_520px_at_50%_100%,rgba(168,85,247,0.10),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:24px_24px] opacity-30" />
          <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/6 blur-3xl" />

          <div className="relative flex min-h-screen items-center justify-center px-6">
            <div className="w-full max-w-md">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.42 }}
                className="rounded-[32px] border border-white/10 bg-white/[0.055] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.36)] backdrop-blur-2xl"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    {!reduceMotion ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
                        />
                        <motion.div
                          animate={{ rotate: -360 }}
                          transition={{
                            duration: 14,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.08, 1] }}
                          transition={{
                            duration: 2.1,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--loader-accent)]/10 blur-2xl"
                        />
                      </>
                    ) : null}

                    <div className="relative grid h-20 w-20 place-items-center rounded-[24px] border border-white/12 bg-[color:var(--loader-accent)] shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
                      <Layers3 className="h-8 w-8 text-black" />
                    </div>
                  </div>

                  <div className="mt-8 text-[12px] uppercase tracking-[0.34em] text-white/42">
                    {brandSub}
                  </div>

                  <div className="mt-2 text-3xl font-semibold tracking-tight text-white">
                    {brandTitle}
                  </div>

                  <div className="mt-6 w-full">
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "220%" }}
                        transition={{
                          duration: reduceMotion ? 1.4 : 1.15,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="h-full w-1/2 rounded-full bg-[color:var(--loader-accent)]"
                      />
                    </div>
                  </div>

                  <div className="mt-4 text-sm font-medium text-white/58">
                    Preparing experience
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
