"use client";

/**
 * @henryco/ui/mobile/use-scroll-direction — auto-hide nav driver.
 *
 * V3-09(S4). Mobile shells choose one of two top-nav behaviours:
 *
 *   1. **Sticky** (always visible) — best for short-form pages
 *      where the navigation IS the page chrome (account, hub).
 *
 *   2. **Auto-hide** — hides on scroll-down, reveals on scroll-up.
 *      Best for reading surfaces and feeds (marketplace, learn,
 *      property listings) where the user wants the full viewport.
 *
 * This hook drives behaviour (2). It debounces scroll events to a
 * single rAF tick, emits a stable `direction` value, and gates on
 * a `threshold` (default 24px) so micro-scrolls don't flicker the
 * nav. The hook is also reduced-motion aware: when the user
 * prefers reduced motion, direction never reports `"down"` so the
 * nav remains visible (no surprise dismiss).
 *
 * Usage:
 *
 *   ```tsx
 *   const direction = useScrollDirection(24);
 *   <nav style={{ transform: direction === "down" ? "translateY(-100%)" : "none" }}>
 *   ```
 */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../a11y/use-reduced-motion";

export type ScrollDirection = "up" | "down" | "idle";

export function useScrollDirection(threshold = 24): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>("idle");
  const reducedMotion = useReducedMotion();
  const lastYRef = useRef(0);
  const accumRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    lastYRef.current = window.scrollY;

    const handle = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastYRef.current;
        // Treat negative scroll-positions (iOS rubber-band) as 0.
        if (y < 0) {
          accumRef.current = 0;
          setDirection("idle");
          lastYRef.current = 0;
          return;
        }
        accumRef.current += delta;
        if (Math.abs(accumRef.current) < threshold) {
          lastYRef.current = y;
          return;
        }
        if (accumRef.current > 0 && !reducedMotion) {
          setDirection("down");
        } else if (accumRef.current < 0) {
          setDirection("up");
        }
        accumRef.current = 0;
        lastYRef.current = y;
      });
    };

    window.addEventListener("scroll", handle, { passive: true });
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", handle);
    };
  }, [threshold, reducedMotion]);

  return direction;
}
