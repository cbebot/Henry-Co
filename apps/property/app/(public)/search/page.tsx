import Link from "next/link";
import type { Metadata } from "next";
import { PropertyEmptyState, PropertyListingCard, PropertySearchBar, PropertySectionIntro } from "@/components/property/ui";
import { getPropertySnapshot, searchProperties } from "@/lib/property/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Search property listings | HenryCo Property",
  description:
    "Search HenryCo Property with deep-linkable filters for area, listing kind, management, and furnishing state.",
};

type SearchParams = {
  q?: string;
  kind?: string;
  area?: string;
  managed?: string;
  furnished?: string;
};

const FILTER_LABELS: Record<keyof SearchParams, string> = {
  q: "Search",
  kind: "Category",
  area: "Area",
  managed: "Managed",
  furnished: "Furnished",
};

function buildSearchHref(params: SearchParams, removeKey?: keyof SearchParams) {
  const next = new URLSearchParams();

  (Object.entries(params) as Array<[keyof SearchParams, string | undefined]>).forEach(([key, value]) => {
    if (removeKey === key) return;
    if (!value) return;
    next.set(key, value);
  });

  const query = next.toString();
  return query ? `/search?${query}` : "/search";
}

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
        title="Search serious listings without losing your filters or your pace."
        description="The filter state stays shareable in the URL, the results update without a blunt refresh, and every listing carries clearer trust context before you commit attention."
      />

      <div className="mt-8">
        <PropertySearchBar
          key={`${params.q || ""}|${params.kind || ""}|${params.area || ""}|${params.managed || ""}|${params.furnished || ""}`}
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
        <div
          className="text-sm text-[var(--property-ink-soft)]"
          role="status"
          aria-live="polite"
        >
          {results.length} live {results.length === 1 ? "listing" : "listings"} found
          {active.length ? ` across ${active.length} active filter${active.length === 1 ? "" : "s"}` : ""}
        </div>
        {active.length ? (
          <div className="flex flex-wrap gap-2">
            {active.map(([key, value]) => (
              <Link
                key={key}
                href={buildSearchHref(params, key as keyof SearchParams)}
                className="rounded-full border border-[var(--property-line)] px-3 py-1 text-xs text-[var(--property-ink-soft)]"
              >
                {FILTER_LABELS[key as keyof SearchParams]}:{" "}
                {key === "managed"
                  ? "Yes"
                  : key === "furnished"
                    ? "Yes"
                    : value}{" "}
                ×
              </Link>
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
            body="Try broadening the area, removing one filter at a time, or switching from a precise phrase to the property type you want HenryCo to surface."
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
