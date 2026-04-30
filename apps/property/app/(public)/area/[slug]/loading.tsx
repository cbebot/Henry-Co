import { PublicRouteLoader } from "@henryco/ui/public-shell";

export default function PropertyAreaLoading() {
  return (
    <main className="property-page property-shell">
      <PublicRouteLoader
        tone="onDark"
        eyebrow="HenryCo Property"
        title="Loading area"
        subtitle="Gathering listings, neighbourhood detail, and trust signals."
        className="mx-auto max-w-[92rem] px-5 sm:px-8 lg:px-10"
        spinnerClassName="text-white/85"
      >
        <section className="property-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <div className="space-y-4">
            <div className="property-loading-shimmer h-3 max-w-28 rounded-full bg-[rgba(255,255,255,0.06)]" />
            <div className="property-loading-shimmer h-12 max-w-3xl rounded-[1rem] bg-[rgba(255,255,255,0.06)]" />
            <div className="property-loading-shimmer h-4 max-w-2xl rounded-full bg-[rgba(255,255,255,0.05)]" />
          </div>
        </section>
        <section className="mt-8 grid gap-5 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <article
              key={index}
              className="property-paper overflow-hidden rounded-[1.9rem] p-0"
              aria-hidden="true"
            >
              <div className="property-loading-shimmer aspect-[4/3] bg-[rgba(255,255,255,0.05)]" />
              <div className="space-y-3 p-5">
                <div className="property-loading-shimmer h-3 max-w-28 rounded-full bg-[rgba(255,255,255,0.06)]" />
                <div className="property-loading-shimmer h-5 max-w-[80%] rounded-[0.8rem] bg-[rgba(255,255,255,0.06)]" />
                <div className="property-loading-shimmer h-3 max-w-[88%] rounded-full bg-[rgba(255,255,255,0.05)]" />
              </div>
            </article>
          ))}
        </section>
      </PublicRouteLoader>
    </main>
  );
}
