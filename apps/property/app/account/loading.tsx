/**
 * V3-05 — Property account route fallback.
 *
 * Stripped of theater copy: previously
 *   <PublicRouteLoader eyebrow="HenryCo Property"
 *      title="Opening property activity"
 *      subtitle="Loading your saved listings, viewings, and inquiries." />
 * Now renders the property shimmer skeleton blocks directly so the
 * user sees the layout silhouette, never warmup text. PERF-01's thin
 * top progress bar is preserved app-wide via the (public)/loading.tsx
 * layer where present.
 */
export default function PropertyAccountLoading() {
  return (
    <main
      className="property-page property-shell"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <section className="mx-auto max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <section className="property-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <div className="space-y-4">
            <div className="property-loading-shimmer h-3 max-w-28 rounded-full bg-[rgba(255,255,255,0.06)]" />
            <div className="property-loading-shimmer h-10 max-w-2xl rounded-[1rem] bg-[rgba(255,255,255,0.06)]" />
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="property-loading-shimmer h-20 rounded-[1.2rem] bg-[rgba(255,255,255,0.04)]"
                />
              ))}
            </div>
          </div>
        </section>
        <span className="sr-only">Loading content.</span>
      </section>
    </main>
  );
}
