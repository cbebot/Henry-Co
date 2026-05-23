import { PublicHomeSkeleton } from "@henryco/ui/public-shell";

/**
 * V3-05 (S2) — Marketplace root route fallback.
 *
 * Stripped of theater copy: previously
 *   eyebrow="HenryCo Marketplace"
 *   title="Loading marketplace"
 *   subtitle="Preparing products, stores, and your personalized experience."
 * — those strings were already ignored at the visible layer post PERF-01;
 * keeping them in source was just dead theater. Replaced with the
 * content-shaped `PublicHomeSkeleton` so the page renders the right
 * shape before SSR streams in.
 */
export default function MarketplaceLoading() {
  return <PublicHomeSkeleton variant="home" />;
}
