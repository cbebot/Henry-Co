import { notFound } from "next/navigation";
import { PropertyListingCard, PropertySectionIntro } from "@/components/property/ui";
import { getAreaBySlug } from "@/lib/property/data";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AreaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getAreaBySlug(slug);

  if (!data) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 lg:px-10">
      <PropertySectionIntro
        kicker={data.area.city}
        title={`${data.area.name}: context before commitment.`}
        description={data.area.hero}
      />

      <section className="mt-12">
        <p className="property-kicker text-[10.5px] uppercase tracking-[0.28em]">
          Market snapshot
        </p>
        <dl className="mt-5 grid gap-x-6 gap-y-5 border-y border-[var(--property-line)] py-5 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
              Average rent
            </dt>
            <dd className="text-2xl font-semibold tracking-tight text-[var(--property-ink)] sm:text-[1.7rem]">
              {formatCurrency(data.area.averageRent)}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
              Average sale
            </dt>
            <dd className="text-2xl font-semibold tracking-tight text-[var(--property-ink)] sm:text-[1.7rem]">
              {formatCurrency(data.area.averageSale)}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
              Live listings
            </dt>
            <dd className="text-2xl font-semibold tracking-tight text-[var(--property-ink)] sm:text-[1.7rem]">
              {data.listings.length}
            </dd>
          </div>
        </dl>
        {data.area.marketNote ? (
          <p className="mt-5 max-w-3xl text-sm leading-8 text-[var(--property-ink-soft)]">
            {data.area.marketNote}
          </p>
        ) : null}
      </section>

      <section className="mt-12 grid gap-12 md:grid-cols-2 md:divide-x md:divide-[var(--property-line)]">
        <div>
          <p className="property-kicker text-[10.5px] uppercase tracking-[0.28em]">Hotspots</p>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--property-ink-soft)]">
            {data.area.hotspots.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--property-accent-strong)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:pl-12">
          <p className="property-kicker text-[10.5px] uppercase tracking-[0.28em]">Trust notes</p>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--property-ink-soft)]">
            {data.area.trustNotes.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--property-accent-strong)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-14">
        <div className="flex items-end justify-between gap-4 border-b border-[var(--property-line)] pb-4">
          <p className="property-kicker text-[10.5px] uppercase tracking-[0.22em]">
            Live in {data.area.name}
          </p>
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
            {data.listings.length} {data.listings.length === 1 ? "listing" : "listings"}
          </span>
        </div>
        <div className="mt-6 grid gap-5 xl:grid-cols-3">
          {data.listings.map((listing) => (
            <PropertyListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </main>
  );
}
