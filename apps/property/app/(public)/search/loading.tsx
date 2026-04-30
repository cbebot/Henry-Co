import { PublicRouteLoader } from "@henryco/ui/public-shell";

export default function PropertySearchLoading() {
  return (
    <main className="property-page property-shell">
      <PublicRouteLoader
        tone="onDark"
        eyebrow="HenryCo Property"
        title="Searching listings"
        subtitle="Filtering vetted homes, apartments, and managed properties for you."
        className="mx-auto max-w-[92rem] px-5 sm:px-8 lg:px-10"
        spinnerClassName="text-white/85"
      >
        <section className="property-paper rounded-[1.9rem] p-5">
          <div className="grid gap-4 lg:grid-cols-[1.4fr,0.9fr,0.9fr,auto]">
            {Array.from({ length: 4 }).map((_, item) => (
              <div
                key={item}
                className="property-loading-shimmer h-12 rounded-[1.2rem] bg-[rgba(255,255,255,0.05)]"
              />
            ))}
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
                <div className="property-loading-shimmer h-6 max-w-[80%] rounded-[0.8rem] bg-[rgba(255,255,255,0.06)]" />
                <div className="property-loading-shimmer h-3 max-w-full rounded-full bg-[rgba(255,255,255,0.05)]" />
                <div className="property-loading-shimmer h-3 max-w-[88%] rounded-full bg-[rgba(255,255,255,0.05)]" />
              </div>
            </article>
          ))}
        </section>
      </PublicRouteLoader>
    </main>
  );
}
