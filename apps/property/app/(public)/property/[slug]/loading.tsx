import { PublicRouteLoader } from "@henryco/ui/public-shell";

/**
 * Property listing detail loader — thin top progress bar only.
 *
 * Previously rendered a full shimmer scaffold (16:10 image placeholder
 * + meta column + 4 stat tiles + button placeholder) inside the
 * loader's children slot. That shipped a heavy fake page before the
 * real one and made every navigation feel laggy. PublicRouteLoader
 * matches what marketplace does — fast progress bar, paint into
 * empty viewport, no skeleton-to-content reflow.
 */
export default function PropertyDetailLoading() {
  return <PublicRouteLoader />;
}
