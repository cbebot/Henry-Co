import { PublicHomeSkeleton } from "@henryco/ui/public-shell";

/**
 * V3-05 (S2) — Marketplace vendor workspace route fallback.
 *
 * Previously rendered `<HenryCoPublicRouteLoading>` with
 *   title="Loading vendor workspace"
 *   subtitle="Preparing your products, orders, and store settings."
 * Unlike `PublicRouteLoader` (thin top progress bar — PERF-01), the
 * `HenryCoPublicRouteLoading` shell PAINTS those strings prominently
 * on first response — pure warmup theater.
 *
 * Replaced with the content-shaped `PublicHomeSkeleton` so the user
 * sees the workspace's hero + tile silhouette while SSR streams in.
 */
export default function VendorLoading() {
  return <PublicHomeSkeleton variant="site" />;
}
