"use client";

import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 767px)";

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(MOBILE_QUERY);
    setIsMobile(mq.matches);
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    if ("addEventListener" in mq) {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, []);

  return isMobile;
}
