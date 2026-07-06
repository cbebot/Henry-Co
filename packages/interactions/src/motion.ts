"use client";

/**
 * @henryco/interactions — motion presets + reduced-motion hook.
 *
 * Values mirror `PublicMotionTokens` in
 * `packages/ui/src/public-shell/public-tokens.ts`. Durations are in ms.
 * Under `prefers-reduced-motion: reduce`, engines strip scale + glow and
 * keep only the inline label / opacity change (doctrine Principles 2 + 15).
 */

import { useEffect, useState } from "react";

export const MOTION = {
  cta: { pressScale: 0.98, pressMs: 120, successMs: 1500 },
  joy: { envelopeMs: 600, iconScaleFrom: 0.6 },
  routeFadeMs: 200,
  sheetEase: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * SSR-safe reduced-motion hook. Returns `false` during SSR / first paint,
 * then reconciles to the real preference after mount and on change.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(REDUCE_QUERY);
    setReduced(mql.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
