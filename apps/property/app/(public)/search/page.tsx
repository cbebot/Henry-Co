import Link from "next/link";
import type { Metadata } from "next";
import { Bell, BellOff } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { PropertyEmptyState, PropertyListingCard, PropertySearchBar, PropertySectionIntro } from "@/components/property/ui";
import { PropertyMapView } from "@/components/property/property-map-view";
import { PropertyPendingButton } from "@/components/property/form-status";
import { getPropertyViewer } from "@/lib/property/auth";
import { getPropertySnapshot, searchProperties } from "@/lib/property/data";
import { getPropertyPublicLocale } from "@/lib/locale-server";
import { getSharedAccountLoginUrl } from "@/lib/property/links";

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
  const [snapshot, results, viewer, locale] = await Promise.all([
    getPropertySnapshot(),
    searchProperties(params),
    getPropertyViewer(),
    getPropertyPublicLocale(),
  ]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const view: "list" | "map" = params.view === "map" ? "map" : "list";
  const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || null;
  const hasAnyCriteria = Boolean(
    params.q || params.kind || params.area || params.managed || params.furnished
  );
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
        kicker={t("Search")}
        title={t("Find the right place. Keep your filters.")}
        description={t(
          "Filter state stays shareable in the URL, results update without a blunt refresh, and every listing carries trust context before you invest time in it.",
        )}
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

      {/* V3 PASS 21 — save this search. Visible whenever a filter is
          active and the visitor is signed in. The form posts to the
          shared /api/property endpoint with intent=saved_search_create. */}
      {hasAnyCriteria ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-l-2 border-[var(--property-line)] pl-4">
          <p className="max-w-md text-[13px] leading-6 text-[var(--property-ink-soft)]">
            {t(
              "Save this search and HenryCo Property will notify you when a new listing matches. Cadence is daily by default — change it later in your account.",
            )}
          </p>
          {viewer.user ? (
            <form action="/api/property" method="POST" className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="intent" value="saved_search_create" />
              <input type="hidden" name="return_to" value={`/search?${new URLSearchParams(Object.entries(params).filter(([, v]) => Boolean(v)) as Array<[string, string]>).toString()}`} />
              <input type="hidden" name="q" value={params.q || ""} />
              <input type="hidden" name="kind" value={params.kind || ""} />
              <input type="hidden" name="area" value={params.area || ""} />
              <input type="hidden" name="managed" value={params.managed || ""} />
              <input type="hidden" name="furnished" value={params.furnished || ""} />
              <input type="hidden" name="alert_cadence" value="daily" />
              <PropertyPendingButton
                idleLabel={t("Save this search")}
                pendingLabel={t("Saving search")}
                variant="secondary"
                idleIcon={<Bell className="h-4 w-4" />}
                className="px-4 py-2 text-[12.5px]"
              />
            </form>
          ) : (
            <Link
              href={getSharedAccountLoginUrl({
                nextPath: "/search",
                propertyOrigin: process.env.NEXT_PUBLIC_PROPERTY_ORIGIN || "https://property.henrycogroup.com",
              })}
              className="property-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold"
            >
              <BellOff className="h-4 w-4" />
              {t("Sign in to save this search")}
            </Link>
          )}
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div
          className="text-sm text-[var(--property-ink-soft)]"
          role="status"
          aria-live="polite"
        >
          {totalResults} {t("live")} {totalResults === 1 ? t("listing") : t("listings")} {t("found")}
          {active.length ? ` ${t("across")} ${active.length} ${active.length === 1 ? t("active filter") : t("active filters")}` : ""}
          {totalPages > 1 ? ` · ${t("page")} ${currentPage} ${t("of")} ${totalPages}` : ""}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* V3 PASS 21 — list / map toggle. Map view clusters by area
              with a bottom-sheet for the selected pin. */}
          <div
            role="tablist"
            aria-label={t("View mode")}
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
              {t("List")}
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
              {t("Map")}
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
                  {t(FILTER_LABELS[key as Exclude<keyof SearchParams, "page" | "view">])}:{" "}
                  {key === "managed"
                    ? t("Yes")
                    : key === "furnished"
                      ? t("Yes")
                      : value}{" "}
                  ×
                </Link>
              ))}
              <Link href="/search" className="text-xs font-semibold text-[var(--property-accent-strong)]">
                {t("Clear filters")}
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
            {t(
              "Pins cluster by area. Tap a pin to open the area sheet with the top listings and a deep link into the filtered list. Switch back to",
            )}{" "}
            <Link href={buildViewHref(params, "list")} className="font-semibold text-[var(--property-accent-strong)] underline-offset-4 hover:underline">
              {t("list view")}
            </Link>{" "}
            {t("for full-card detail.")}
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
              aria-label={t("Search results pagination")}
              className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--property-line)] pt-6 text-sm"
            >
              {currentPage > 1 ? (
                <Link
                  href={buildPageHref(params, currentPage - 1)}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--property-line)] px-4 py-2 font-semibold text-[var(--property-ink)] transition hover:border-[var(--property-accent-strong)]/40"
                >
                  ← {t("Previous")}
                </Link>
              ) : (
                <span aria-hidden />
              )}
              <span className="text-[var(--property-ink-soft)]">
                {t("Page")} {currentPage} {t("of")} {totalPages}
              </span>
              {currentPage < totalPages ? (
                <Link
                  href={buildPageHref(params, currentPage + 1)}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--property-line)] px-4 py-2 font-semibold text-[var(--property-ink)] transition hover:border-[var(--property-accent-strong)]/40"
                >
                  {t("Next")} →
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
            title={t("No listings match this combination yet.")}
            body={t(
              "Try broadening the area, removing one filter at a time, or switching from a precise phrase to the property type you want HenryCo to surface.",
            )}
            action={
              <Link
                href="/search"
                className="property-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
              >
                {t("Reset search")}
              </Link>
            }
          />
        </div>
      )}
    </main>
  );
}
