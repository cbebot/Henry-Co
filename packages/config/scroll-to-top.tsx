"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Scrolls window to top whenever the pathname changes.
 *
 * Skips the very first mount so we don't fight against deep-linked anchors,
 * and respects the browser's native back/forward scroll restoration.
 */
export function ScrollToTopOnNavigation() {
  const pathname = usePathname();
  const firstMount = useRef(true);

  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false;
      return;
    }
    if (typeof window === "undefined") return;

    const entries = performance.getEntriesByType("navigation");
    const last = entries[entries.length - 1] as PerformanceNavigationTiming | undefined;
    if (last?.type === "back_forward") return;

    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return null;
}
