import { PublicRouteLoader } from "@henryco/ui/public-shell";

/**
 * V3 Wave A1 D3 — messages route-segment loader.
 *
 * PERF-01 canonical thin progress bar (memory:
 * project_henryco_perf01_loading.md). The skeleton-free approach keeps
 * perceived latency low on fast nav (320ms animation-delay).
 */
export default function MessagesLoading() {
  return <PublicRouteLoader />;
}
