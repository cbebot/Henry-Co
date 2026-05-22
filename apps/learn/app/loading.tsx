import { PublicHomeSkeleton } from "@henryco/ui/public-shell";

/**
 * V3-05 — Learn root route fallback.
 *
 * Previously composed `<PublicRouteLoader>` (PERF-01 thin top progress
 * bar) with theater title/subtitle props that already get ignored at
 * the visible layer:
 *   title="Loading your learning experience."
 *   subtitle="Preparing courses, learning paths, and your progress."
 *
 * Replaced with the content-shaped `PublicHomeSkeleton` so the user
 * sees the Learn home shape (hero stack + course grid) on first paint.
 * The theater strings are dropped from source so static-evidence grep
 * stays clean.
 */
export default function LearnRootLoading() {
  return <PublicHomeSkeleton variant="home" />;
}
