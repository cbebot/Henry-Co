"use client";

import { useEffect } from "react";

/**
 * MarkOwnerSeen — stamps the owner's "last here" heartbeat (OCC-3b, W1).
 *
 * The server reads the PREVIOUS heartbeat to compute the "while you were away"
 * delta, then this stamps `now`. Scoped to /owner and best-effort — a blocked
 * cookie just means the greeting won't fire, never an error. Written client-side
 * because a Server Component cannot set cookies during render.
 */
export default function MarkOwnerSeen() {
  useEffect(() => {
    try {
      const thirtyDays = 60 * 60 * 24 * 30;
      document.cookie = `hc-owner-heartbeat=${encodeURIComponent(new Date().toISOString())}; path=/owner; max-age=${thirtyDays}; samesite=lax`;
    } catch {
      /* cookies unavailable — the greeting simply won't fire */
    }
  }, []);

  return null;
}
