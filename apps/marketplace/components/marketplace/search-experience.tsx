"use client";

import Link from "next/link";
import { Filter, Search, ShieldCheck, X } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { ProductCardClient } from "@/components/marketplace/product-card-client";
import type {
  MarketplaceBrand,
  MarketplaceCategory,
  MarketplaceProduct,
} from "@/lib/marketplace/types";

/**
 * Every user-facing string, localized on the server (Pattern B) and passed in
 * as plain data — this client component stays locale-dumb. Templates carry
 * {count}/{shown}/{total} placeholders substituted here with replaceAll.
 */
export type SearchExperienceLabels = {
  searchKicker: string;
  searchPlaceholder: string;
  category: string;
  allCategories: string;
  brand: string;
  allBrands: string;
  trustFilters: string;
  onyxVerified: string;
  onyxVerifiedHint: string;
  verifiedSellersOnly: string;
  verifiedSellersChip: string;
  codEligible: string;
  codChip: string;
  filters: string;
  done: string;
  resultsKicker: string;
  refreshingKicker: string;
  refreshingResults: string;
  resultCountOne: string;
  resultCountMany: string;
  sortFeatured: string;
  sortPriceLow: string;
  sortPriceHigh: string;
  sortRating: string;
  activeFilters: string;
  showingOf: string;
  showMore: string;
  allShown: string;
  moreArrivingKicker: string;
  moreArrivingTitle: string;
  moreArrivingBody: string;
  applyToSell: string;
  howTrustWorks: string;
  emptyTitle: string;
  emptyBody: string;
  resetSearch: string;
};

type SearchExperienceProps = {
  categories: MarketplaceCategory[];
  brands: MarketplaceBrand[];
  initialItems: MarketplaceProduct[];
  labels: SearchExperienceLabels;
  initialQuery: {
    q?: string;
    category?: string;
    brand?: string;
    verified?: string;
    onyxVerified?: string;
    cod?: string;
  };
};

type SortMode = "featured" | "price_low" | "price_high" | "rating";

export function SearchExperience({
  categories,
  brands,
  initialItems,
  labels,
  initialQuery,
}: SearchExperienceProps) {
  const [query, setQuery] = useState(initialQuery.q || "");
  const [category, setCategory] = useState(initialQuery.category || "");
  const [brand, setBrand] = useState(initialQuery.brand || "");
  const [verified, setVerified] = useState(initialQuery.verified === "1");
  const [onyxVerified, setOnyxVerified] = useState(initialQuery.onyxVerified === "1");
  const [cod, setCod] = useState(initialQuery.cod === "1");
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<SortMode>("featured");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const deferredSuggest = useDeferredValue(query.trim());
  const [suggestions, setSuggestions] = useState<
    Array<{ slug: string; title: string; basePrice: number; currency: string }>
  >([]);
  const [suggestBusy, setSuggestBusy] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      return;
    }

    let active = true;
    const params = new URLSearchParams();
    if (deferredQuery) params.set("q", deferredQuery);
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    if (verified) params.set("verified", "1");
    if (onyxVerified) params.set("onyxverified", "1");
    if (cod) params.set("cod", "1");

    async function run() {
      setLoading(true);
      try {
        const response = await fetch(`/api/products?${params.toString()}`, { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { items: MarketplaceProduct[] };
        if (active) setItems(payload.items);
      } finally {
        if (active) setLoading(false);
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, [brand, category, cod, deferredQuery, onyxVerified, verified]);

  useEffect(() => {
    let active = true;
    const q = deferredSuggest;
    if (q.length < 2) {
      setSuggestions([]);
      setSuggestBusy(false);
      return;
    }

    setSuggestBusy(true);
    const handle = window.setTimeout(() => {
      void fetch(`/api/products/suggest?q=${encodeURIComponent(q)}`, { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : { items: [] }))
        .then(
          (payload: {
            items?: Array<{ slug: string; title: string; basePrice: number; currency: string }>;
          }) => {
            if (!active) return;
            setSuggestions(Array.isArray(payload.items) ? payload.items : []);
          },
        )
        .catch(() => {
          if (active) setSuggestions([]);
        })
        .finally(() => {
          if (active) setSuggestBusy(false);
        });
    }, 160);

    return () => {
      active = false;
      window.clearTimeout(handle);
    };
  }, [deferredSuggest]);

  useEffect(() => {
    function onDocDown(event: MouseEvent) {
      if (!searchWrapRef.current?.contains(event.target as Node)) {
        setSuggestOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const sortedItems = useMemo(() => {
    const next = [...items];
    switch (sort) {
      case "price_low":
        return next.sort((left, right) => left.basePrice - right.basePrice);
      case "price_high":
        return next.sort((left, right) => right.basePrice - left.basePrice);
      case "rating":
        return next.sort((left, right) => right.rating - left.rating);
      default:
        return next.sort((left, right) => Number(right.featured) - Number(left.featured));
    }
  }, [items, sort]);

  /**
   * Reveal cards in pages of 24 instead of rendering the entire result set
   * upfront. As the marketplace grows past a few hundred products, mounting
   * every card explodes initial JS work and causes hundreds of `<Image>`
   * intersection-observers to be wired even when the user only sees the
   * first row. Show-more keeps below-fold work amortised.
   */
  const PAGE_SIZE = 24;
  /**
   * Below this listing count in the unfiltered public view, the 3-up grid
   * looks intentionally sparse and undermines marketplace trust. Switch to
   * a 2-up curated layout + "More arriving soon" panel until inventory
   * exceeds the threshold.
   */
  const SPARSE_THRESHOLD = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [items.length, sort]);
  const visibleItems = sortedItems.slice(0, visibleCount);
  const hasMore = visibleCount < sortedItems.length;

  const activeChips = [
    category
      ? {
          label:
            categories.find((item) => item.slug === category)?.name || category,
          clear: () => setCategory(""),
        }
      : null,
    brand
      ? {
          label: brands.find((item) => item.slug === brand)?.name || brand,
          clear: () => setBrand(""),
        }
      : null,
    onyxVerified
      ? { label: labels.onyxVerified, clear: () => setOnyxVerified(false) }
      : null,
    verified ? { label: labels.verifiedSellersChip, clear: () => setVerified(false) } : null,
    cod ? { label: labels.codChip, clear: () => setCod(false) } : null,
  ].filter(Boolean) as Array<{ label: string; clear: () => void }>;

  const filters = (
    <div className="space-y-8">
      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--market-brass)]">
          {labels.searchKicker}
        </p>
        <div ref={searchWrapRef} className="relative mt-3">
          <div className="flex items-center gap-3 border-b border-[var(--market-line)] pb-3 transition focus-within:border-[var(--market-brass)]">
            <Search className="h-4 w-4 shrink-0 text-[var(--market-muted)]" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSuggestOpen(true);
              }}
              onFocus={() => setSuggestOpen(true)}
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-controls="marketplace-search-suggestions"
              aria-expanded={suggestOpen && suggestions.length > 0}
              placeholder={labels.searchPlaceholder}
              className="w-full bg-transparent text-sm text-[var(--market-paper-white)] outline-none placeholder:text-[rgba(213,224,245,0.42)]"
            />
            {suggestBusy ? (
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                …
              </span>
            ) : null}
          </div>
          {suggestOpen && suggestions.length > 0 ? (
            <ul
              id="marketplace-search-suggestions"
              role="listbox"
              className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-auto rounded-[1.2rem] border border-[var(--market-line)] bg-[rgba(6,10,20,0.98)] py-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl"
            >
              {suggestions.map((item) => (
                <li key={item.slug} role="option" aria-selected="false">
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={() => setSuggestOpen(false)}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-[var(--market-paper-white)] transition hover:bg-[rgba(255,255,255,0.06)]"
                  >
                    <span className="min-w-0 truncate font-medium">{item.title}</span>
                    <span className="shrink-0 text-xs text-[var(--market-muted)]">
                      {formatCurrency(item.basePrice, item.currency)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--market-brass)]">
          {labels.category}
        </p>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="market-select mt-3 w-full rounded-full border border-[var(--market-line)] bg-transparent px-4 py-2.5 text-sm"
        >
          <option value="">{labels.allCategories}</option>
          {categories.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--market-brass)]">
          {labels.brand}
        </p>
        <select
          value={brand}
          onChange={(event) => setBrand(event.target.value)}
          className="market-select mt-3 w-full rounded-full border border-[var(--market-line)] bg-transparent px-4 py-2.5 text-sm"
        >
          <option value="">{labels.allBrands}</option>
          {brands.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--market-brass)]">
          {labels.trustFilters}
        </p>
        <ul className="mt-3 divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
          <li>
            <label className="flex cursor-pointer items-start gap-3 py-3 text-sm text-[var(--market-paper-white)]">
              <input
                checked={onyxVerified}
                onChange={(event) => setOnyxVerified(event.target.checked)}
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-[var(--market-line)] bg-transparent accent-[var(--market-brass)]"
              />
              <span className="flex-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-[var(--market-brass)]" aria-hidden />
                  {labels.onyxVerified}
                </span>
                <span className="mt-1 block text-xs leading-5 text-[var(--market-muted)]">
                  {labels.onyxVerifiedHint}
                </span>
              </span>
            </label>
          </li>
          <li>
            <label className="flex cursor-pointer items-center gap-3 py-3 text-sm text-[var(--market-paper-white)]">
              <input
                checked={verified}
                onChange={(event) => setVerified(event.target.checked)}
                type="checkbox"
                className="h-4 w-4 rounded border-[var(--market-line)] bg-transparent accent-[var(--market-brass)]"
              />
              <span className="flex-1">{labels.verifiedSellersOnly}</span>
            </label>
          </li>
          <li>
            <label className="flex cursor-pointer items-center gap-3 py-3 text-sm text-[var(--market-paper-white)]">
              <input
                checked={cod}
                onChange={(event) => setCod(event.target.checked)}
                type="checkbox"
                className="h-4 w-4 rounded border-[var(--market-line)] bg-transparent accent-[var(--market-brass)]"
              />
              <span className="flex-1">{labels.codEligible}</span>
            </label>
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <>
      <section className="relative grid gap-12 xl:grid-cols-[280px_1fr]">
        <aside className="sticky top-28 z-10 hidden self-start xl:block">{filters}</aside>

        <div className="relative z-20 space-y-8">
          {/* Editorial result-count line + controls — no panel */}
          <div className="flex flex-col gap-5 border-b border-[var(--market-line)] pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--market-brass)]">
                {loading ? labels.refreshingKicker : labels.resultsKicker}
              </p>
              <p className="mt-3 text-[1.6rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--market-paper-white)] sm:text-[2rem]">
                {loading
                  ? labels.refreshingResults
                  : sortedItems.length === 1
                    ? labels.resultCountOne
                    : labels.resultCountMany.replaceAll("{count}", String(sortedItems.length))}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="market-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold xl:hidden"
              >
                <Filter className="h-4 w-4" />
                {labels.filters}
              </button>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortMode)}
                className="market-select min-w-[180px] rounded-full border border-[var(--market-line)] bg-transparent px-4 py-2.5 text-sm"
              >
                <option value="featured">{labels.sortFeatured}</option>
                <option value="price_low">{labels.sortPriceLow}</option>
                <option value="price_high">{labels.sortPriceHigh}</option>
                <option value="rating">{labels.sortRating}</option>
              </select>
            </div>
          </div>

          {activeChips.length ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                {labels.activeFilters}
              </span>
              {activeChips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={chip.clear}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--market-line)] bg-transparent px-3 py-1.5 text-xs font-semibold text-[var(--market-paper-white)] transition hover:border-[var(--market-brass)]/55 hover:bg-[rgba(255,255,255,0.03)]"
                >
                  {chip.label}
                  <X className="h-3 w-3 text-[var(--market-muted)]" />
                </button>
              ))}
            </div>
          ) : null}

          {sortedItems.length ? (
            <>
              {/* Sparse-grid guard: when the public default view (no filters,
               * no query) has fewer than SPARSE_THRESHOLD results, fall back
               * to a curated 2-up featured layout instead of a half-empty
               * 3-up grid. With filters/query active, a small result count is
               * informative — keep the existing layout. */}
              <div
                className={
                  activeChips.length === 0 && !deferredQuery.trim() && sortedItems.length < SPARSE_THRESHOLD
                    ? "grid gap-5 md:grid-cols-2"
                    : "grid gap-5 md:grid-cols-2 2xl:grid-cols-3"
                }
              >
                {visibleItems.map((product, index) => (
                  <ProductCardClient
                    key={product.slug}
                    product={product}
                    /* Eager-load the first row so we don't pay an intersection-
                     * observer round-trip for the LCP image. */
                    priority={index < 3}
                  />
                ))}
              </div>
              {activeChips.length === 0 && !deferredQuery.trim() && sortedItems.length < SPARSE_THRESHOLD ? (
                <div className="mt-8 rounded-[1.6rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.025)] p-6 sm:p-8">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--market-brass)]">
                    {labels.moreArrivingKicker}
                  </p>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--market-paper-white)]">
                    {labels.moreArrivingTitle}
                  </p>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--market-muted)]">
                    {labels.moreArrivingBody}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href="/sell"
                      className="market-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                    >
                      {labels.applyToSell}
                    </Link>
                    <Link
                      href="/trust"
                      className="market-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                    >
                      {labels.howTrustWorks}
                    </Link>
                  </div>
                </div>
              ) : null}
              {hasMore ? (
                <div className="mt-10 flex flex-col items-center gap-3 border-t border-[var(--market-line)] pt-8">
                  <p className="text-sm text-[var(--market-muted)]">
                    {labels.showingOf
                      .replaceAll("{shown}", String(visibleItems.length))
                      .replaceAll("{total}", String(sortedItems.length))}
                  </p>
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="market-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
                  >
                    {labels.showMore.replaceAll(
                      "{count}",
                      String(Math.min(PAGE_SIZE, sortedItems.length - visibleCount)),
                    )}
                  </button>
                </div>
              ) : sortedItems.length > PAGE_SIZE ? (
                <p className="mt-10 border-t border-[var(--market-line)] pt-8 text-center text-sm text-[var(--market-muted)]">
                  {labels.allShown.replaceAll("{count}", String(sortedItems.length))}
                </p>
              ) : null}
            </>
          ) : (
            <div className="border-l-2 border-[var(--market-brass)]/55 pl-5 py-3">
              <p className="text-[1.4rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--market-paper-white)] sm:text-[1.65rem]">
                {labels.emptyTitle}
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--market-muted)]">
                {labels.emptyBody}
              </p>
              <Link
                href="/search"
                className="market-button-primary mt-5 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                {labels.resetSearch}
              </Link>
            </div>
          )}
        </div>
      </section>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-[65] bg-[rgba(2,4,10,0.58)] backdrop-blur-md xl:hidden">
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[2rem] border-t border-[var(--market-line)] bg-[rgba(5,7,13,0.96)] p-6 shadow-[0_-24px_80px_rgba(0,0,0,0.36)]">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-lg font-semibold text-[var(--market-paper-white)]">{labels.filters}</p>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold"
              >
                {labels.done}
              </button>
            </div>
            {filters}
          </div>
        </div>
      ) : null}
    </>
  );
}
