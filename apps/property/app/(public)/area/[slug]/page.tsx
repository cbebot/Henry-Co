import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createDivisionMetadata } from "@henryco/config";
import { PropertyListingCard, PropertySectionIntro } from "@/components/property/ui";
import { getAreaBySlug } from "@/lib/property/data";
import { formatCurrency } from "@/lib/utils";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getAreaBySlug(slug);

  if (!data) {
    return createDivisionMetadata("property", {
      title: "Area not found | HenryCo Property",
      description: "The requested property area could not be found on HenryCo Property.",
      path: `/area/${slug}`,
      noIndex: true,
    });
  }

  return createDivisionMetadata("property", {
    title: `${data.area.name} property market | HenryCo Property`,
    description: data.area.hero || data.area.marketNote,
    path: `/area/${data.area.slug}`,
  });
}

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

      <section className="mt-8 grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
        <div className="property-panel rounded-[2.3rem] p-6 sm:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-5">
              <div className="property-kicker">Average rent</div>
              <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--property-ink)]">
                {formatCurrency(data.area.averageRent)}
              </div>
            </div>
            <div className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-5">
              <div className="property-kicker">Average sale</div>
              <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--property-ink)]">
                {formatCurrency(data.area.averageSale)}
              </div>
            </div>
          </div>
          <div className="mt-6 text-sm leading-8 text-[var(--property-ink-soft)]">{data.area.marketNote}</div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="property-paper rounded-[1.8rem] p-5">
            <div className="property-kicker">Hotspots</div>
            <div className="mt-4 space-y-3 text-sm text-[var(--property-ink-soft)]">
              {data.area.hotspots.map((item) => (
                <div key={item}>• {item}</div>
              ))}
            </div>
          </div>
          <div className="property-paper rounded-[1.8rem] p-5">
            <div className="property-kicker">Trust notes</div>
            <div className="mt-4 space-y-3 text-sm text-[var(--property-ink-soft)]">
              {data.area.trustNotes.map((item) => (
                <div key={item}>• {item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 text-sm text-[var(--property-ink-soft)]">
          {data.listings.length} live {data.listings.length === 1 ? "listing" : "listings"} in{" "}
          {data.area.name}
        </div>
        <div className="grid gap-5 xl:grid-cols-3">
          {data.listings.map((listing) => (
            <PropertyListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </main>
  );
}
