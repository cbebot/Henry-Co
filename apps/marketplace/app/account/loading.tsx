import { PublicHomeSkeleton } from "@henryco/ui/public-shell";

/**
 * V3-05 (S2) — Marketplace account route fallback.
 *
 * Previously rendered `<HenryCoPublicRouteLoading>` with
 *   title="Loading your account"
 *   subtitle="Fetching orders, wishlist, and account details."
 * These strings paint prominently on first response — warmup theater.
 *
 * Replaced with the content-shaped `PublicHomeSkeleton` so the user
 * sees the account layout's silhouette while SSR streams in.
 */
export default function MarketplaceAccountLoading() {
  return <PublicHomeSkeleton variant="site" />;
}
