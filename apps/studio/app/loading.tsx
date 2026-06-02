import { PublicHomeSkeleton } from "@henryco/ui/public-shell";

/**
 * V3-05 (S2) — Studio root route fallback.
 *
 * Stripped of theater copy: previously
 *   title="Loading Henry & Co. Studio"
 *   subtitle="Preparing your creative workspace."
 * V3 PASS 21 shipped real Studio templates + portfolio surfaces — the
 * route fallback now shows the content-shaped `PublicHomeSkeleton`
 * mirroring the studio home layout (hero + service grid). No warmup
 * text in source, none on the wire.
 */
export default function StudioLoading() {
  return <PublicHomeSkeleton variant="home" />;
}
