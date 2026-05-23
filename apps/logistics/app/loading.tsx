import { PublicHomeSkeleton } from "@henryco/ui/public-shell";

/**
 * V3-05 (S2) — Logistics root route fallback.
 *
 * Stripped of theater copy: previously
 *   tone="onDark"
 *   title="Loading logistics"
 *   subtitle="Preparing shipping, tracking, and delivery services."
 * — V3 PASS 21 already shipped the logistics backend, so the SSR
 * stream populates the real home layout shortly after mount.
 * Fallback is now the content-shaped `PublicHomeSkeleton` so the user
 * sees the page's hero + service-card grid silhouette, never warmup
 * language. PERF-01's thin top progress bar still applies via the
 * (public)/loading.tsx layer where present.
 */
export default function LogisticsLoading() {
  return <PublicHomeSkeleton variant="home" />;
}
