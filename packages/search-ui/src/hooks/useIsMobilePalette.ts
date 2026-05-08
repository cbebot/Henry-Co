/**
 * Hook: useIsMobilePalette — true when the viewport is narrow enough
 * that the palette should render as a `<BottomSheet>`. Anti-pattern
 * #21 (mobile = different layout, NOT the desktop dialog cropped via
 * media-query).
 *
 * Re-evaluates on resize so a tablet rotation switches the surface
 * the next time the palette opens.
 */

"use client";

import { useEffect, useState } from "react";

const MOBILE_PALETTE_QUERY = "(max-width: 720px)";

export function useIsMobilePalette(): boolean {
  // SSR-safe initial value — assume desktop until we can read the
  // media query. The palette is mounted as `ssr: false` in the host
  // app so this does not flicker.
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(MOBILE_PALETTE_QUERY);
    setIsMobile(mq.matches);
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
    // Safari fallback
    mq.addListener(handler);
    return () => mq.removeListener(handler);
  }, []);

  return isMobile;
}
