function PropertyLoadingBar({ widthClass }: { widthClass: string }) {
  return (
    <div
      className={`property-loading-shimmer h-3 rounded-full bg-[rgba(255,255,255,0.08)] ${widthClass}`}
    />
  );
}

export default function Loading() {
  return (
    <div className="property-page property-shell">
      <main className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 lg:px-10">
        <section className="property-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <div className="space-y-4">
            <div className="property-kicker">Loading</div>
            <PropertyLoadingBar widthClass="max-w-72" />
            <PropertyLoadingBar widthClass="max-w-4xl" />
            <PropertyLoadingBar widthClass="max-w-3xl" />
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <div className="property-paper property-loading-shimmer aspect-[16/10] rounded-[2rem] bg-[rgba(255,255,255,0.04)]" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="property-paper property-loading-shimmer h-28 rounded-[1.6rem] bg-[rgba(255,255,255,0.04)]"
                />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="property-panel rounded-[2rem] p-6 sm:p-8"
              >
                <div className="space-y-4">
                  <PropertyLoadingBar widthClass="max-w-40" />
                  <PropertyLoadingBar widthClass="max-w-80" />
                  <PropertyLoadingBar widthClass="max-w-full" />
                  <PropertyLoadingBar widthClass="max-w-[92%]" />
                  <div className="property-loading-shimmer h-12 max-w-52 rounded-full bg-[rgba(255,255,255,0.06)]" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
