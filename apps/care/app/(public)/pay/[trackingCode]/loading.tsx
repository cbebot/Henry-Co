import { PublicRouteLoader } from "@henryco/ui/public-shell";

/**
 * Real Onyx route loader (V3-LOADER) — division-accent + theme aware via the
 * care public layout's accent scope. The /pay surface is force-dynamic (live
 * booking + payment-rail reads), so this is the calm, brand-true moment a
 * payer sees before the payment surface paints. Never a fake spinner.
 */
export default function CarePayLoading() {
  return <PublicRouteLoader />;
}
