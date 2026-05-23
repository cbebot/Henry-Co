import { PublicHomeSkeleton } from "@henryco/ui/public-shell";

/**
 * V3-05 (S2) — Studio public-shell route fallback.
 *
 * Stripped of theater copy: previously
 *   title="Loading studio"
 *   subtitle="Preparing services, teams, and portfolio experiences."
 * Replaced with the content-shaped `PublicHomeSkeleton` (4-card grid
 * matching the studio public landing). No warmup language.
 */
export default function StudioPublicLoading() {
  return <PublicHomeSkeleton variant="home" />;
}
