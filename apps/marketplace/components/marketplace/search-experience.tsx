"use client";

import Link from "next/link";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { ProductCardClient } from "@/components/marketplace/product-card-client";
import type {
  MarketplaceBrand,
  MarketplaceCategory,
  MarketplaceProduct,
} from "@/lib/marketplace/types";

type SearchExperienceProps = {
  categories: MarketplaceCategory[];
  brands: MarketplaceBrand[];
  initialItems: MarketplaceProduct[];
  initialQuery: {
    q?: string;
    category?: string;
    brand?: string;
    verified?: string;
    cod?: string;
  };
};

type SortMode = "featured" | "price_low" | "price_high" | "rating";

export function SearchExperience({
  categories,
  brands,
  initialItems,
  initialQuery,
}: SearchExperienceProps) {
  const [query, setQuery] = useState(initialQuery.q || "");
  const [category, setCategory] = useState(initialQuery.category || "");
  const [brand, setBrand] = useState(initialQuery.brand || "");
  const [verified, setVerified] = useState(initialQuery.verified === "1");
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
  }, [brand, category, cod, deferredQuery, verified]);

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
    verified ? { label: "Verified sellers", clear: () => setVerified(false) } : null,
    cod ? { label: "COD eligible", clear: () => setCod(false) } : null,
  ].filter(Boolean) as Array<{ label: string; clear: () => void }>;

  const filters = (
    <div className="space-y-8">
      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--market-brass)]">
          Search intent
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
              aria-autocomplete="list"
              aria-expanded={suggestOpen && suggestions.length > 0}
              placeholder="Desk lamp, cashmere throw, executive chair"
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
              role="listbox"
              className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-auto rounded-[1.2rem] border border-[var(--market-line)] bg-[rgba(6,10,20,0.98)] py-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl"
            >
              {suggestions.map((item) => (
                <li key={item.slug} role="option">
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
          Category
        </p>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="market-select mt-3 w-full rounded-full border border-[var(--market-line)] bg-transparent px-4 py-2.5 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--market-brass)]">
          Brand
        </p>
        <select
          value={brand}
          onChange={(event) => setBrand(event.target.value)}
          className="market-select mt-3 w-full rounded-full border border-[var(--market-line)] bg-transparent px-4 py-2.5 text-sm"
        >
          <option value="">All brands</option>
          {brands.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--market-brass)]">
          Trust filters
        </p>
        <ul className="mt-3 divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
          <li>
            <label className="flex cursor-pointer items-center gap-3 py-3 text-sm text-[var(--market-paper-white)]">
              <input
                checked={verified}
                onChange={(event) => setVerified(event.target.checked)}
                type="checkbox"
                className="h-4 w-4 rounded border-[var(--market-line)] bg-transparent accent-[var(--market-brass)]"
              />
              <span className="flex-1">Verified sellers only</span>
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
              <span className="flex-1">Cash on delivery eligible</span>
            </label>
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <>
      <section className="relative grid gap-12 xl:grid-cols-[280px,1fr]">
        <aside className="sticky top-28 z-10 hidden self-start xl:block">{filters}</aside>

        <div className="relative z-20 space-y-8">
          {/* Editorial result-count line + controls — no panel */}
          <div className="flex flex-col gap-5 border-b border-[var(--market-line)] pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--market-brass)]">
                {loading ? "Refreshing" : "Results"}
              </p>
              <p className="mt-3 text-[1.6rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--market-paper-white)] sm:text-[2rem]">
                {loading
                  ? "Refreshing results..."
                  : `${sortedItems.length} refined result${sortedItems.length === 1 ? "" : "s"}`}
              </p>
              <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--market-muted)]">
                Search reacts quickly, filters stay visible, and trust context stays readable
                instead of being buried.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="market-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold xl:hidden"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              <span className="hidden items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)] sm:inline-flex">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Premium filtering
              </span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortMode)}
                className="market-select min-w-[180px] rounded-full border border-[var(--market-line)] bg-transparent px-4 py-2.5 text-sm"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price_low">Price: Low to high</option>
                <option value="price_high">Price: High to low</option>
                <option value="rating">Rating first</option>
              </select>
            </div>
          </div>

          {activeChips.length ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                Active filters
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
              <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
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
              {hasMore ? (
                <div className="mt-10 flex flex-col items-center gap-3 border-t border-[var(--market-line)] pt-8">
                  <p className="text-sm text-[var(--market-muted)]">
                    Showing {visibleItems.length} of {sortedItems.length} products
                  </p>
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="market-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
                  >
                    Show {Math.min(PAGE_SIZE, sortedItems.length - visibleCount)} more
                  </button>
                </div>
              ) : sortedItems.length > PAGE_SIZE ? (
                <p className="mt-10 border-t border-[var(--market-line)] pt-8 text-center text-sm text-[var(--market-muted)]">
                  All {sortedItems.length} products shown.
                </p>
              ) : null}
            </>
          ) : (
            <div className="border-l-2 border-[var(--market-brass)]/55 pl-5 py-3">
              <p className="text-[1.4rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--market-paper-white)] sm:text-[1.65rem]">
                Nothing matched that exact combination.
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--market-muted)]">
                Ease one trust filter or widen the keyword. HenryCo search is meant to keep buyers
                moving, not trap them in dead-end clutter.
              </p>
              <Link
                href="/search"
                className="market-button-primary mt-5 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                Reset search
              </Link>
            </div>
          )}
        </div>
      </section>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-[65] bg-[rgba(2,4,10,0.58)] backdrop-blur-md xl:hidden">
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[2rem] border-t border-[var(--market-line)] bg-[rgba(5,7,13,0.96)] p-6 shadow-[0_-24px_80px_rgba(0,0,0,0.36)]">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-lg font-semibold text-[var(--market-paper-white)]">Filters</p>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold"
              >
                Done
              </button>
            </div>
            {filters}
          </div>
        </div>
      ) : null}
    </>
  );
}
