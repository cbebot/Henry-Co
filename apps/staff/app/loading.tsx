import { PublicRouteLoader } from "@henryco/ui/public-shell";

/**
 * Staff root route-segment loader.
 *
 * V3 Wave A1 D6 coverage: every web app's `app/loading.tsx` must
 * consume `PublicRouteLoader` (PERF-01 canonical — see memory
 * `project_henryco_perf01_loading.md`). The thin progress-bar loader
 * stays invisible on fast nav (320ms animation-delay) and only paints
 * when a route genuinely needs time.
 */
export default function StaffRootLoading() {
  return <PublicRouteLoader />;
}
