import Link from "next/link";
import { PropertyEmptyState, PropertyListingCard, PropertySearchBar, PropertySectionIntro } from "@/components/property/ui";
import { getPropertySnapshot, searchProperties } from "@/lib/property/data";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  kind?: string;
  area?: string;
  managed?: string;
  furnished?: string;
};

export default async function PropertySearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const snapshot = await getPropertySnapshot();
  const results = await searchProperties(params);
  const active = Object.entries(params).filter(([, value]) => Boolean(value));

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 lg:px-10">
      <PropertySectionIntro
        kicker="Search"
        title="Browse listings with less clutter and more conviction."
        description="Filter across rent, sale, commercial, managed, and short-let surfaces without losing the context that serious decisions need."
      />

      <div className="mt-8">
        <PropertySearchBar
          areas={snapshot.areas}
          defaults={{
            q: params.q,
            kind: params.kind,
            area: params.area,
            managed: params.managed,
            furnished: params.furnished,
          }}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-[var(--property-ink-soft)]">
          {results.length} live {results.length === 1 ? "listing" : "listings"} found
        </div>
        {active.length ? (
          <div className="flex flex-wrap gap-2">
            {active.map(([key, value]) => (
              <span
                key={key}
                className="rounded-full border border-[var(--property-line)] px-3 py-1 text-xs text-[var(--property-ink-soft)]"
              >
                {key}: {value}
              </span>
            ))}
            <Link href="/search" className="text-xs font-semibold text-[var(--property-accent-strong)]">
              Clear filters
            </Link>
          </div>
        ) : null}
      </div>

      {results.length ? (
        <div className="mt-8 grid gap-5 xl:grid-cols-3">
          {results.map((listing) => (
            <PropertyListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <PropertyEmptyState
            title="No listings match this combination yet."
            body="Try removing a filter, broadening the area, or switching from a precise search phrase to a market category."
            action={
              <Link
                href="/search"
                className="property-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
              >
                Reset search
              </Link>
            }
          />
        </div>
      )}
    </main>
  );
}
