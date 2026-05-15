import Link from "next/link";
import type { Metadata } from "next";
import { PropertyEmptyState, PropertyListingCard, PropertySearchBar, PropertySectionIntro } from "@/components/property/ui";
import { PropertyMapView } from "@/components/property/property-map-view";
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
  page?: string;
  view?: string;
};

const FILTER_LABELS: Record<Exclude<keyof SearchParams, "page" | "view">, string> = {
  q: "Search",
  kind: "Category",
  area: "Area",
  managed: "Managed",
  furnished: "Furnished",
};

/** Server-paginated to keep render cost flat as listings grow. */
const PAGE_SIZE = 12;

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

function buildViewHref(params: SearchParams, view: "list" | "map") {
  const next = new URLSearchParams();
  (Object.entries(params) as Array<[keyof SearchParams, string | undefined]>).forEach(([key, value]) => {
    if (key === "view") return;
    if (!value) return;
    next.set(key, value);
  });
  if (view !== "list") next.set("view", view);
  const query = next.toString();
  return query ? `/search?${query}` : "/search";
}

function buildPageHref(params: SearchParams, page: number) {
  const next = new URLSearchParams();
  (Object.entries(params) as Array<[keyof SearchParams, string | undefined]>).forEach(([key, value]) => {
    if (key === "page") return;
    if (!value) return;
    next.set(key, value);
  });
  if (page > 1) next.set("page", String(page));
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
  const view: "list" | "map" = params.view === "map" ? "map" : "list";
  const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || null;
  const active = Object.entries(params)
    .filter(([key]) => key !== "page" && key !== "view")
    .filter(([, value]) => Boolean(value));

  const totalResults = results.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const requestedPage = Math.max(1, Number(params.page) || 1);
  const currentPage = Math.min(requestedPage, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageResults = results.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 lg:px-10">
      <PropertySectionIntro
        kicker="Search"
        title="Find the right place. Keep your filters."
        description="Filter state stays shareable in the URL, results update without a blunt refresh, and every listing carries trust context before you invest time in it."
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
          {totalResults} live {totalResults === 1 ? "listing" : "listings"} found
          {active.length ? ` across ${active.length} active filter${active.length === 1 ? "" : "s"}` : ""}
          {totalPages > 1 ? ` · page ${currentPage} of ${totalPages}` : ""}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* V3 PASS 21 — list / map toggle. Map view clusters by area
              with a bottom-sheet for the selected pin. */}
          <div
            role="tablist"
            aria-label="View mode"
            className="inline-flex rounded-full border border-[var(--property-line)] p-0.5 text-xs font-semibold uppercase tracking-[0.18em]"
          >
            <Link
              role="tab"
              aria-selected={view === "list"}
              href={buildViewHref(params, "list")}
              className={`rounded-full px-3 py-1.5 transition ${
                view === "list"
                  ? "bg-[var(--property-accent-strong)] text-white"
                  : "text-[var(--property-ink-soft)] hover:text-[var(--property-ink)]"
              }`}
            >
              List
            </Link>
            <Link
              role="tab"
              aria-selected={view === "map"}
              href={buildViewHref(params, "map")}
              className={`rounded-full px-3 py-1.5 transition ${
                view === "map"
                  ? "bg-[var(--property-accent-strong)] text-white"
                  : "text-[var(--property-ink-soft)] hover:text-[var(--property-ink)]"
              }`}
            >
              Map
            </Link>
          </div>

          {active.length ? (
            <div className="flex flex-wrap gap-2">
              {active.map(([key, value]) => (
                <Link
                  key={key}
                  href={buildSearchHref(params, key as keyof SearchParams)}
                  className="rounded-full border border-[var(--property-line)] px-3 py-1 text-xs text-[var(--property-ink-soft)]"
                >
                  {FILTER_LABELS[key as Exclude<keyof SearchParams, "page" | "view">]}:{" "}
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
      </div>

      {view === "map" && results.length > 0 ? (
        <div className="mt-8">
          <PropertyMapView
            listings={results}
            areas={snapshot.areas}
            mapboxAccessToken={mapboxAccessToken}
          />
          <p className="mt-3 text-[12px] leading-6 text-[var(--property-ink-muted)]">
            Pins cluster by area. Tap a pin to open the area sheet with the top
            listings and a deep link into the filtered list. Switch back to{" "}
            <Link href={buildViewHref(params, "list")} className="font-semibold text-[var(--property-accent-strong)] underline-offset-4 hover:underline">
              list view
            </Link>{" "}
            for full-card detail.
          </p>
        </div>
      ) : null}

      {pageResults.length && view === "list" ? (
        <>
          <div className="mt-8 grid gap-5 xl:grid-cols-3">
            {pageResults.map((listing, index) => (
              <PropertyListingCard
                key={listing.id}
                listing={listing}
                /* First row of cards renders eagerly so LCP doesn't wait
                 * on lazy-loaded hero images. Below-fold rows lazy-load
                 * normally, which keeps the page fast as listing volume
                 * grows past page-size 12. */
                priority={currentPage === 1 && index < 3}
              />
            ))}
          </div>

          {totalPages > 1 && view === "list" ? (
            <nav
              aria-label="Search results pagination"
              className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--property-line)] pt-6 text-sm"
            >
              {currentPage > 1 ? (
                <Link
                  href={buildPageHref(params, currentPage - 1)}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--property-line)] px-4 py-2 font-semibold text-[var(--property-ink)] transition hover:border-[var(--property-accent-strong)]/40"
                >
                  ← Previous
                </Link>
              ) : (
                <span aria-hidden />
              )}
              <span className="text-[var(--property-ink-soft)]">
                Page {currentPage} of {totalPages}
              </span>
              {currentPage < totalPages ? (
                <Link
                  href={buildPageHref(params, currentPage + 1)}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--property-line)] px-4 py-2 font-semibold text-[var(--property-ink)] transition hover:border-[var(--property-accent-strong)]/40"
                >
                  Next →
                </Link>
              ) : (
                <span aria-hidden />
              )}
            </nav>
          ) : null}
        </>
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
