"use client";

import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { ArrowRight, RefreshCcw, SlidersHorizontal } from "lucide-react";
import type { PropertyArea, PropertyListing } from "@/lib/property/types";
import {
  buildPropertySearchHref,
  DEFAULT_PROPERTY_SEARCH_STATE,
  parsePropertySearchState,
  PROPERTY_SEARCH_SORTS,
  runPropertySearch,
  type PropertySearchSort,
  type PropertySearchState,
} from "@/lib/property/search";
import { PropertyEmptyState, PropertyListingCard } from "@/components/property/ui";

const SORT_LABELS: Record<PropertySearchSort, string> = {
  recommended: "Recommended",
  latest: "Newest first",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  trust_desc: "Trust-first",
};

function activeFilterPills(state: PropertySearchState, areas: PropertyArea[]) {
  const areaLabel = areas.find((item) => item.slug === state.area)?.name || state.area;

  return [
    state.q ? { key: "q", label: `Search: ${state.q}` } : null,
    state.kind ? { key: "kind", label: `Kind: ${state.kind.replace(/[_-]+/g, " ")}` } : null,
    state.area ? { key: "area", label: `Area: ${areaLabel}` } : null,
    state.managed ? { key: "managed", label: "Managed only" } : null,
    state.furnished ? { key: "furnished", label: "Furnished" } : null,
    state.sort !== DEFAULT_PROPERTY_SEARCH_STATE.sort
      ? { key: "sort", label: `Sort: ${SORT_LABELS[state.sort]}` }
      : null,
  ].filter(Boolean) as Array<{ key: keyof PropertySearchState; label: string }>;
}

function readSearchStateFromUrl() {
  if (typeof window === "undefined") {
    return DEFAULT_PROPERTY_SEARCH_STATE;
  }

  return parsePropertySearchState(new URLSearchParams(window.location.search));
}

export function PropertySearchExperience({
  areas,
  listings,
  initialState,
}: {
  areas: PropertyArea[];
  listings: PropertyListing[];
  initialState: PropertySearchState;
}) {
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState(initialState);
  const [draftQuery, setDraftQuery] = useState(initialState.q);
  const deferredQuery = useDeferredValue(filters.q);
  const results = runPropertySearch(listings, {
    ...filters,
    q: deferredQuery,
  });
  const pills = activeFilterPills(filters, areas);

  useEffect(() => {
    setFilters(initialState);
    setDraftQuery(initialState.q);
  }, [initialState]);

  useEffect(() => {
    function handlePopState() {
      const next = readSearchStateFromUrl();
      startTransition(() => {
        setFilters(next);
        setDraftQuery(next.q);
      });
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function commit(next: PropertySearchState) {
    const href = buildPropertySearchHref(next);
    window.history.pushState(null, "", href);
    startTransition(() => {
      setFilters(next);
    });
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    commit({
      ...filters,
      q: draftQuery.trim(),
    });
  }

  function clearAll() {
    setDraftQuery("");
    commit(DEFAULT_PROPERTY_SEARCH_STATE);
  }

  function updateFilters(partial: Partial<PropertySearchState>) {
    const next = {
      ...filters,
      ...partial,
    };

    if (partial.q !== undefined) {
      setDraftQuery(partial.q);
    }

    commit(next);
  }

  function removeFilter(key: keyof PropertySearchState) {
    switch (key) {
      case "q":
        setDraftQuery("");
        updateFilters({ q: "" });
        return;
      case "kind":
        updateFilters({ kind: "" });
        return;
      case "area":
        updateFilters({ area: "" });
        return;
      case "managed":
        updateFilters({ managed: false });
        return;
      case "furnished":
        updateFilters({ furnished: false });
        return;
      case "sort":
        updateFilters({ sort: DEFAULT_PROPERTY_SEARCH_STATE.sort });
        return;
      default:
        return;
    }
  }

  return (
    <>
      <form
        className="property-paper grid gap-4 rounded-[1.9rem] p-5 lg:grid-cols-[1.3fr,0.85fr,0.85fr,0.85fr]"
        onSubmit={submitSearch}
        aria-busy={isPending}
      >
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">
            Search
          </span>
          <input
            name="q"
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            placeholder="Ikoyi penthouse, serviced residence, office suite..."
            className="property-input mt-2 rounded-2xl px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">
            Category
          </span>
          <select
            name="kind"
            value={filters.kind}
            onChange={(event) => updateFilters({ kind: event.target.value })}
            className="property-select mt-2 rounded-2xl px-4 py-3"
          >
            <option value="">All categories</option>
            <option value="rent">Residential rent</option>
            <option value="sale">Residential sale</option>
            <option value="commercial">Commercial</option>
            <option value="managed">Managed</option>
            <option value="shortlet">Short-let</option>
            <option value="land">Land</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">
            Area
          </span>
          <select
            name="area"
            value={filters.area}
            onChange={(event) => updateFilters({ area: event.target.value })}
            className="property-select mt-2 rounded-2xl px-4 py-3"
          >
            <option value="">All areas</option>
            {areas.map((area) => (
              <option key={area.id} value={area.slug}>
                {area.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">
            Sort
          </span>
          <select
            name="sort"
            value={filters.sort}
            onChange={(event) =>
              updateFilters({
                sort: event.target.value as (typeof PROPERTY_SEARCH_SORTS)[number],
              })
            }
            className="property-select mt-2 rounded-2xl px-4 py-3"
          >
            {PROPERTY_SEARCH_SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {SORT_LABELS[sort]}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-4 lg:col-span-4 lg:flex-row lg:items-center lg:justify-between">
          <fieldset className="flex flex-wrap items-center gap-3 text-xs text-[var(--property-ink-soft)]">
            <legend className="sr-only">Additional filters</legend>
            <label className="inline-flex items-center gap-2 rounded-full border border-[var(--property-line)] px-3 py-2">
              <input
                type="checkbox"
                name="managed"
                value="1"
                checked={filters.managed}
                onChange={(event) => updateFilters({ managed: event.target.checked })}
              />
              Managed only
            </label>
            <label className="inline-flex items-center gap-2 rounded-full border border-[var(--property-line)] px-3 py-2">
              <input
                type="checkbox"
                name="furnished"
                value="1"
                checked={filters.furnished}
                onChange={(event) => updateFilters({ furnished: event.target.checked })}
              />
              Furnished
            </label>
          </fieldset>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="property-button-primary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              {isPending ? "Updating results" : "Apply search"}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={isPending || pills.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--property-line)] px-4 py-2 text-xs font-semibold text-[var(--property-ink-soft)] transition hover:border-[var(--property-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Reset filters
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-wrap items-center gap-2 text-xs text-[var(--property-ink-muted)]">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span aria-live="polite">
            {isPending
              ? "Refreshing results without hard-reloading the page."
              : "Filters stay shareable in the URL, and the browser back button restores the last search state."}
          </span>
        </div>
      </form>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-[var(--property-ink-soft)]" role="status" aria-live="polite">
          {results.length} live {results.length === 1 ? "listing" : "listings"} found
        </div>
        {pills.length ? (
          <div className="flex flex-wrap gap-2">
            {pills.map((pill) => (
              <button
                key={pill.key}
                type="button"
                onClick={() => removeFilter(pill.key)}
                className="rounded-full border border-[var(--property-line)] px-3 py-1 text-xs text-[var(--property-ink-soft)] transition hover:border-[var(--property-accent-strong)]"
              >
                {pill.label} ×
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {results.length ? (
        <div
          className="mt-8 grid gap-5 transition-opacity duration-200 xl:grid-cols-3"
          aria-busy={isPending}
        >
          {results.map((listing) => (
            <PropertyListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <PropertyEmptyState
            title="No listings match this combination yet."
            body="Try broadening the area, removing one filter at a time, or switching from a precise phrase to a category so HenryCo can surface the strongest matches."
            action={
              <button
                type="button"
                onClick={clearAll}
                className="property-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
              >
                Reset search
              </button>
            }
          />
        </div>
      )}
    </>
  );
}
