import { PublicRouteLoader } from "@henryco/ui/public-shell";

/**
 * Real Onyx route loader (V3-LOADER) — division-accent + theme aware via the
 * marketplace public layout's accent scope. The /pay surface is force-dynamic
 * (live order + payment-rail reads), so this is the calm, brand-true moment a
 * buyer sees before the payment surface paints. Never a fake spinner.
 */
export default function MarketplacePayLoading() {
  return <PublicRouteLoader />;
}
