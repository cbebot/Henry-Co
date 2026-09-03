"use client";

import { useMemo } from "react";
import { useReducedMotion, type Transition, type Variants } from "framer-motion";

export type StudioMotion = {
  /** False when the user prefers reduced motion — consumers can branch. */
  enabled: boolean;
  /** Shared tween for ad-hoc animations not covered by the variants below. */
  transition: Transition;
  /** Fade + rise for cards, sections, and step containers. */
  reveal: Variants;
  /** Chat-bubble / list-item arrival — quicker, smaller travel than reveal. */
  messageIn: Variants;
  /** Parent container that staggers its `reveal`/`messageIn` children in. */
  staggerChildren: Variants;
  /** Subtle pop for a value that just recomputed (e.g. a live price). */
  pricingCountUp: Variants;
};

const REVEAL_DURATION = 0.45;
const MESSAGE_DURATION = 0.3;
const COUNT_UP_DURATION = 0.32;
const STAGGER_STEP = 0.06;
const EASE_OUT: Transition["ease"] = [0.22, 1, 0.36, 1];

/**
 * useStudioMotion — the studio request flow's shared framer-motion vocabulary.
 *
 * Every variant is gated on `useReducedMotion()`. This matters because framer
 * animates via inline styles in JS, which the global CSS
 * `@media (prefers-reduced-motion: reduce)` kill-switch in globals.css does
 * NOT stop. So honoring the preference for framer animations has to happen
 * here, in JS: when reduced, `hidden === visible` and every duration collapses
 * to 0, so elements render in their final state with no transform or fade.
 *
 * Variants embed their own transitions, so consumers only wire up
 * `variants` + `initial="hidden"` + `animate="visible"`.
 */
export function useStudioMotion(): StudioMotion {
  const reduce = useReducedMotion() ?? false;

  return useMemo(() => {
    const transition: Transition = {
      duration: reduce ? 0 : REVEAL_DURATION,
      ease: EASE_OUT,
    };

    const reveal: Variants = {
      hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: reduce ? 0 : REVEAL_DURATION, ease: EASE_OUT },
      },
    };

    const messageIn: Variants = {
      hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: reduce ? 0 : MESSAGE_DURATION, ease: EASE_OUT },
      },
    };

    const staggerChildren: Variants = {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: reduce ? 0 : STAGGER_STEP,
          delayChildren: reduce ? 0 : 0.02,
        },
      },
    };

    const pricingCountUp: Variants = {
      hidden: reduce ? { opacity: 1, scale: 1 } : { opacity: 0.55, scale: 0.96 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: reduce ? 0 : COUNT_UP_DURATION, ease: EASE_OUT },
      },
    };

    return { enabled: !reduce, transition, reveal, messageIn, staggerChildren, pricingCountUp };
  }, [reduce]);
}
