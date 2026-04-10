export default function PropertySearchLoading() {
  return (
    <main className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 lg:px-10">
      <section className="property-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
        <div className="h-4 w-24 animate-pulse rounded-full bg-[var(--property-line)]" />
        <div className="mt-4 h-12 max-w-3xl animate-pulse rounded-[1.4rem] bg-[var(--property-line)]" />
        <div className="mt-4 h-6 max-w-2xl animate-pulse rounded-[1rem] bg-[var(--property-line)]" />
      </section>

      <section className="property-paper mt-8 grid gap-4 rounded-[1.9rem] p-5 lg:grid-cols-[1.4fr,0.9fr,0.9fr,auto]">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-20 animate-pulse rounded-[1.4rem] bg-[var(--property-line)]" />
        ))}
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <article
            key={index}
            className="property-paper overflow-hidden rounded-[1.9rem] p-0"
            aria-hidden="true"
          >
            <div className="aspect-[4/3] animate-pulse bg-[var(--property-line)]" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-28 animate-pulse rounded-full bg-[var(--property-line)]" />
              <div className="h-8 w-3/4 animate-pulse rounded-[1rem] bg-[var(--property-line)]" />
              <div className="h-16 animate-pulse rounded-[1rem] bg-[var(--property-line)]" />
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
