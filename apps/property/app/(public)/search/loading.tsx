import { PublicRouteLoader } from "@henryco/ui/public-shell";

/**
 * Property search loader — thin top progress bar only. Matches
 * marketplace's pattern — no shimmer skeleton, no fake card grid,
 * no perceived-lag scaffolding.
 */
export default function PropertySearchLoading() {
  return <PublicRouteLoader />;
}
