import type { CSSProperties } from "react";
import { PublicRouteLoader } from "@henryco/ui/public-shell";

/**
 * Real Onyx route loader (V3-LOADER) on the studio division accent (configured
 * teal #4AC1C5). The invoice payment surface fetches the catalog + outstanding
 * invoices + localization, so a cold load has a real gap — this is the calm,
 * brand-true loading moment, never a fake spinner.
 */
export default function StudioPaymentLoading() {
  return (
    <div style={{ display: "contents", ["--home-accent" as string]: "#4AC1C5" } as CSSProperties}>
      <PublicRouteLoader />
    </div>
  );
}
