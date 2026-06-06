import type { CSSProperties } from "react";
import { PublicRouteLoader } from "@henryco/ui/public-shell";

/**
 * The shared Onyx route loader (V3-LOADER) — the one real, brand-aware,
 * theme-aware loading experience, on the studio division accent (configured
 * teal #4AC1C5, see packages/config/company.ts). NEVER a fake spinner: it
 * shows nothing for fast loads, a calm hairline rail past ~280ms, and the
 * breathing H·Onyx mark only on genuinely slow loads. /pay is force-dynamic,
 * so this is what the buyer sees before the payment surface paints.
 */
export default function PayLoading() {
  return (
    <div style={{ display: "contents", ["--home-accent" as string]: "#4AC1C5" } as CSSProperties}>
      <PublicRouteLoader />
    </div>
  );
}
