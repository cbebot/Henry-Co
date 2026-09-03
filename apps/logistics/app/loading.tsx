import { PublicRouteLoader } from "@henryco/ui/public-shell";

// The shared Onyx route loader (V3-LOADER) — one world-class, brand-aware,
// theme-aware loading experience across every public surface. Invisible on
// fast navigation; a crafted Onyx brand moment only when a load genuinely
// takes time (no dull content-silhouette skeleton, no warmup copy).
export default function LogisticsLoading() {
  return <PublicRouteLoader />;
}
