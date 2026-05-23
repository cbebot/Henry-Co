import { PublicHomeSkeleton } from "@henryco/ui/public-shell";

/**
 * V3-05 (S2) — Marketplace public route fallback.
 *
 * Previously rendered `PublicRouteLoader` with theater props:
 *   title="Loading marketplace"
 *   subtitle="Preparing products, stores, and your personalised experience."
 *
 * PERF-01 already neutered those props at the visible layer (the loader
 * is a thin top progress bar; the strings never paint). V3-05 removes
 * the theater copy entirely and replaces the route fallback with
 * `PublicHomeSkeleton` — the content-shaped placeholder that mirrors
 * the marketplace home layout (hero stack + product/category grid)
 * so the user sees the page's shape on first paint, never warmup text.
 *
 * The SSR query (`getMarketplaceHomeData`) is force-dynamic; this
 * fallback shows for the brief window before the streamed shell flushes.
 */
export default function MarketplacePublicLoading() {
  return <PublicHomeSkeleton variant="home" />;
}
