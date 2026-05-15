import { PublicRouteLoader } from "@henryco/ui/public-shell";

/**
 * V3 Wave A1 D4 — calendar route-segment loader.
 *
 * PERF-01 canonical thin progress bar (memory:
 * project_henryco_perf01_loading.md).
 */
export default function CalendarLoading() {
  return <PublicRouteLoader />;
}
