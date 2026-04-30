import { PublicRouteLoader } from "@henryco/ui/public-shell";

export default function PropertySubmitLoading() {
  return (
    <main className="property-page property-shell">
      <PublicRouteLoader
        tone="onDark"
        eyebrow="HenryCo Property"
        title="Opening submission form"
        subtitle="Preparing the listing form, area presets, and your saved context."
        className="mx-auto max-w-[92rem] px-5 sm:px-8 lg:px-10"
        spinnerClassName="text-white/85"
      >
        <section className="property-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <div className="space-y-4">
            <div className="property-loading-shimmer h-3 max-w-28 rounded-full bg-[rgba(255,255,255,0.06)]" />
            <div className="property-loading-shimmer h-10 max-w-3xl rounded-[1rem] bg-[rgba(255,255,255,0.06)]" />
            <div className="property-loading-shimmer h-4 max-w-2xl rounded-full bg-[rgba(255,255,255,0.05)]" />
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="property-loading-shimmer h-12 rounded-[1.2rem] bg-[rgba(255,255,255,0.04)]"
                />
              ))}
            </div>
            <div className="property-loading-shimmer h-12 max-w-44 rounded-full bg-[rgba(255,255,255,0.06)]" />
          </div>
        </section>
      </PublicRouteLoader>
    </main>
  );
}
