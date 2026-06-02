import { PublicHomeSkeleton } from "@henryco/ui/public-shell";

/**
 * V3-05 — Learn public-shell route fallback.
 *
 * Stripped of theater copy: previously composed
 *   <PublicRouteLoader title="Loading courses, certifications, and
 *      learning paths." subtitle="Curating the latest Henry Onyx Learn
 *      programs ..." />
 * Replaced with the content-shaped `PublicHomeSkeleton` so the user
 * sees the Learn catalogue silhouette on first paint.
 */
export default function LearnPublicLoading() {
  return <PublicHomeSkeleton variant="site" />;
}
