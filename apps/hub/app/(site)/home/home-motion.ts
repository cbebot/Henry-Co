"use client";

import { useMemo } from "react";
import { useReducedMotion, type Transition, type Variants } from "framer-motion";

// House curve — a calm, decisive settle shared across the site's reveals.
const EASE_OUT: Transition["ease"] = [0.22, 1, 0.36, 1];
// Emphasized curve with a subtle overshoot. Reserved for the ONE crafted beat
// (the Index-of-Engines row interaction). Used sparingly — restraint is the luxury.
const EASE_EMPHASIZED: Transition["ease"] = [0.34, 1.4, 0.64, 1];

const STAGGER_STEP = 0.06;

export type HomeMotion = {
  /** False when the user prefers reduced motion — consumers can branch on this. */
  enabled: boolean;
  /** Section / element fade + rise as it scrolls into view. */
  reveal: Variants;
  /** Parent that staggers its `reveal` children into view. */
  stagger: Variants;
  /** Live proof number — subtle pop on mount / recompute (instrument-readout feel). */
  countUp: Variants;
  /** Accent hairline that sweeps in under an Index row on hover/focus (scaleX 0→1). */
  sweep: Variants;
  /** Magnetic lift for the active Index row (slight rise + scale, emphasized ease). */
  magnetic: Variants;
  /** Ambient depth drift for the orb/particle wrapper — slow loop, never on reduced-motion. */
  ambientDrift: Variants;
  /** Per-item reveal transition at a manually incrementing stagger delay. */
  revealAt: (index: number) => Transition;
};

/**
 * useHomeMotion — the company homepage's bespoke framer-motion vocabulary.
 *
 * Richer than the studio request flow's `useStudioMotion` because this surface
 * is the company's front door: beyond reveal/stagger/countUp it adds the
 * interaction primitives the Index of Engines and the ambient depth layer need —
 * `sweep` (accent hairline), `magnetic` (active-row lift), and `ambientDrift`
 * (slow depth loop).
 *
 * Every variant is gated on `useReducedMotion()`. framer animates via inline
 * styles in JS, which the global `@media (prefers-reduced-motion: reduce)`
 * kill-switch in globals.css does NOT stop — so the preference must be honored
 * here, in JS. When reduced: `hidden === visible`, every duration collapses to
 * 0, loops never run, and elements render in their final state with zero
 * transform and zero layout shift.
 *
 * Variants embed their own transitions, so consumers only wire up `variants` +
 * `initial`/`animate` (or `whileInView` / `whileHover` / `whileFocus`).
 */
export function useHomeMotion(): HomeMotion {
  const reduce = useReducedMotion() ?? false;

  return useMemo(() => {
    const d = (full: number) => (reduce ? 0 : full);

    return {
      enabled: !reduce,

      reveal: {
        hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: d(0.5), ease: EASE_OUT },
        },
      },

      stagger: {
        hidden: {},
        visible: {
          transition: {
            staggerChildren: d(STAGGER_STEP),
            delayChildren: d(0.04),
          },
        },
      },

      countUp: {
        hidden: reduce ? { opacity: 1, scale: 1 } : { opacity: 0.5, scale: 0.94 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: { duration: d(0.34), ease: EASE_OUT },
        },
      },

      sweep: {
        rest: { scaleX: reduce ? 1 : 0, opacity: reduce ? 1 : 0 },
        active: {
          scaleX: 1,
          opacity: 1,
          transition: { duration: d(0.32), ease: EASE_EMPHASIZED },
        },
      },

      magnetic: {
        rest: { y: 0, scale: 1 },
        active: reduce
          ? { y: 0, scale: 1 }
          : {
              y: -2,
              scale: 1.005,
              transition: { duration: d(0.26), ease: EASE_EMPHASIZED },
            },
      },

      ambientDrift: {
        rest: { x: 0, y: 0 },
        drift: reduce
          ? { x: 0, y: 0 }
          : {
              x: [0, 12, -8, 0],
              y: [0, -10, 6, 0],
              transition: { duration: 26, repeat: Infinity, ease: "linear" },
            },
      },

      revealAt: (i: number) => ({
        duration: d(0.5),
        delay: reduce ? 0 : i * STAGGER_STEP,
        ease: EASE_OUT,
      }),
    };
  }, [reduce]);
}
