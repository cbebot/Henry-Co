import { PublicRouteLoader } from "@henryco/ui/public-shell";

/**
 * Property route-segment loader.
 *
 * The previous implementation rendered a 60-line shimmer skeleton (panels,
 * image placeholders, grid). That much painted scaffolding pushed perceived
 * load time up rather than down — visitors saw a heavy fake page before
 * the real one.
 *
 * Now: just the canonical thin top progress bar (delayed 320ms so fast nav
 * stays invisible). When the real content arrives it paints directly into
 * an empty viewport — no skeleton-to-content reflow.
 */
export default function Loading() {
  return <PublicRouteLoader />;
}
