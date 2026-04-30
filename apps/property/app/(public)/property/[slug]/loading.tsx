import { PublicRouteLoader } from "@henryco/ui/public-shell";

export default function PropertyDetailLoading() {
  return (
    <main className="property-page property-shell">
      <PublicRouteLoader
        tone="onDark"
        eyebrow="HenryCo Property"
        title="Loading listing"
        subtitle="Pulling photos, location detail, and viewing availability."
        className="mx-auto max-w-[92rem] px-5 sm:px-8 lg:px-10"
        spinnerClassName="text-white/85"
      >
        <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
          <div className="property-paper property-loading-shimmer aspect-[16/10] rounded-[1.9rem] bg-[rgba(255,255,255,0.05)]" />
          <div className="space-y-4">
            <div className="property-loading-shimmer h-3 max-w-32 rounded-full bg-[rgba(255,255,255,0.06)]" />
            <div className="property-loading-shimmer h-10 max-w-full rounded-[1rem] bg-[rgba(255,255,255,0.06)]" />
            <div className="property-loading-shimmer h-4 max-w-[88%] rounded-full bg-[rgba(255,255,255,0.05)]" />
            <div className="property-loading-shimmer h-4 max-w-[72%] rounded-full bg-[rgba(255,255,255,0.05)]" />
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="property-loading-shimmer h-16 rounded-[1.2rem] bg-[rgba(255,255,255,0.04)]"
                />
              ))}
            </div>
            <div className="property-loading-shimmer h-12 max-w-56 rounded-full bg-[rgba(255,255,255,0.06)]" />
          </div>
        </section>
      </PublicRouteLoader>
    </main>
  );
}
