import "server-only";

import { headers } from "next/headers";

/**
 * Coarse server-side device class for the home projection (V3-34 applies the
 * desktop vs mobile module order per device). UA-based and advisory only — it
 * never gates a paid action; the responsive grid still adapts client-side.
 */
export async function detectDevice(): Promise<"mobile" | "desktop"> {
  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  return /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(ua)
    ? "mobile"
    : "desktop";
}
