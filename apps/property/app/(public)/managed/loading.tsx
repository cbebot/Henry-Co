import { PublicRouteLoader } from "@henryco/ui/public-shell";

export default function PropertyManagedLoading() {
  return (
    <main className="property-page property-shell">
      <PublicRouteLoader
        tone="onDark"
        eyebrow="HenryCo Property"
        title="Loading managed properties"
        subtitle="Pulling the portfolio, services, and trust standards."
        className="mx-auto max-w-[92rem] px-5 sm:px-8 lg:px-10"
        spinnerClassName="text-white/85"
      >
        <section className="property-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <div className="space-y-4">
            <div className="property-loading-shimmer h-3 max-w-32 rounded-full bg-[rgba(255,255,255,0.06)]" />
            <div className="property-loading-shimmer h-10 max-w-2xl rounded-[1rem] bg-[rgba(255,255,255,0.06)]" />
            <div className="property-loading-shimmer h-4 max-w-xl rounded-full bg-[rgba(255,255,255,0.05)]" />
          </div>
        </section>
        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="property-paper rounded-[1.9rem] p-6"
              aria-hidden="true"
            >
              <div className="property-loading-shimmer h-3 max-w-24 rounded-full bg-[rgba(255,255,255,0.06)]" />
              <div className="property-loading-shimmer mt-4 h-6 max-w-[70%] rounded-[0.8rem] bg-[rgba(255,255,255,0.06)]" />
              <div className="property-loading-shimmer mt-3 h-3 max-w-full rounded-full bg-[rgba(255,255,255,0.05)]" />
              <div className="property-loading-shimmer mt-2 h-3 max-w-[88%] rounded-full bg-[rgba(255,255,255,0.05)]" />
            </div>
          ))}
        </section>
      </PublicRouteLoader>
    </main>
  );
}
