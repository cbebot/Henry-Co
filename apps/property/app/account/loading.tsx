import { StructuredSkeleton } from "@henryco/ui";

/**
 * V3-05 + FIX-LT-01 — Property account route fallback.
 *
 * Previously rendered a property shell wrapper around the locally-styled
 * `property-loading-shimmer` blocks. FIX-LT-01 migrates the in-flight
 * placeholder to the canonical `StructuredSkeleton` primitive from
 * `@henryco/ui/loading` so every account section across every division
 * shares the same shape, threshold-aware telemetry, and reduced-motion
 * behaviour. No warmup text — content-shape silhouette only.
 */
export default function PropertyAccountLoading() {
  return (
    <main className="property-page property-shell">
      <section className="mx-auto max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <section className="property-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <StructuredSkeleton
            variant="card-list"
            surface="property.account"
            count={4}
          />
        </section>
      </section>
    </main>
  );
}
