import { PublicRouteLoader } from "@henryco/ui/public-shell";

/**
 * Real Onyx route loader (V3-LOADER) for checkout — division-accent + theme
 * aware via the marketplace public layout's accent scope. Checkout runs several
 * parallel server reads (cart, addresses, payment rail, wallet); this is the
 * calm, brand-true loading moment, never a fake spinner.
 */
export default function MarketplaceCheckoutLoading() {
  return <PublicRouteLoader />;
}
