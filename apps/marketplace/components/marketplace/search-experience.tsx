"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Filter, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { ProductCard } from "@/components/marketplace/shell";
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
  const router = useRouter();
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
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const hasHydratedRef = useRef(false);
  const searchInputId = useId();
  const searchLabelId = useId();
  const suggestionsId = useId();
  const categoryId = useId();
  const brandId = useId();
  const verifiedId = useId();
  const codId = useId();
  const filterDialogTitleId = useId();

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
          }
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
        setActiveSuggestionIndex(-1);
      }
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  useEffect(() => {
    if (!mobileFiltersOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileFiltersOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileFiltersOpen]);

  useEffect(() => {
    if (!suggestions.length) {
      setActiveSuggestionIndex(-1);
      return;
    }

    setActiveSuggestionIndex((current) =>
      current >= suggestions.length ? suggestions.length - 1 : current
    );
  }, [suggestions]);

  function openSuggestion(slug: string) {
    if (!slug) return;
    setSuggestOpen(false);
    setActiveSuggestionIndex(-1);
    router.push(`/product/${slug}`);
  }

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

  const activeChips = [
    category ? { label: categories.find((item) => item.slug === category)?.name || category, clear: () => setCategory("") } : null,
    brand ? { label: brands.find((item) => item.slug === brand)?.name || brand, clear: () => setBrand("") } : null,
    verified ? { label: "Verified sellers", clear: () => setVerified(false) } : null,
    cod ? { label: "COD eligible", clear: () => setCod(false) } : null,
  ].filter(Boolean) as Array<{ label: string; clear: () => void }>;

  const filters = (
    <div className="space-y-5">
      <div className="market-paper rounded-[1.8rem] p-5">
        <label
          id={searchLabelId}
          htmlFor={searchInputId}
          className="text-sm font-semibold text-[var(--market-paper-white)]"
        >
          Search intent
        </label>
        <div ref={searchWrapRef} className="relative mt-3">
          <div className="flex items-center gap-3 rounded-[1.3rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-[var(--market-muted)]" />
            <input
              id={searchInputId}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSuggestOpen(true);
                setActiveSuggestionIndex(-1);
              }}
              onFocus={() => setSuggestOpen(true)}
              onKeyDown={(event) => {
                if (!suggestions.length) {
                  if (event.key === "Escape") {
                    setSuggestOpen(false);
                  }
                  return;
                }

                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setSuggestOpen(true);
                  setActiveSuggestionIndex((current) =>
                    current < suggestions.length - 1 ? current + 1 : 0
                  );
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setSuggestOpen(true);
                  setActiveSuggestionIndex((current) =>
                    current > 0 ? current - 1 : suggestions.length - 1
                  );
                } else if (event.key === "Enter" && activeSuggestionIndex >= 0) {
                  event.preventDefault();
                  const activeSlug = suggestions[activeSuggestionIndex]?.slug;
                  if (activeSlug) {
                    openSuggestion(activeSlug);
                  }
                } else if (event.key === "Escape") {
                  setSuggestOpen(false);
                  setActiveSuggestionIndex(-1);
                }
              }}
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-labelledby={searchLabelId}
              aria-controls={suggestions.length ? suggestionsId : undefined}
              aria-expanded={suggestOpen && suggestions.length > 0}
              aria-activedescendant={
                suggestOpen && activeSuggestionIndex >= 0
                  ? `${suggestionsId}-option-${activeSuggestionIndex}`
                  : undefined
              }
              placeholder="Desk lamp, cashmere throw, executive chair"
              className="w-full bg-transparent text-sm text-[var(--market-paper-white)] outline-none placeholder:text-[rgba(213,224,245,0.42)]"
            />
            {suggestBusy ? (
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--market-muted)]">
                …
              </span>
            ) : null}
          </div>
          {suggestOpen && suggestions.length > 0 ? (
            <ul
              id={suggestionsId}
              role="listbox"
              aria-label="Suggested products"
              className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-auto rounded-[1.2rem] border border-[var(--market-line)] bg-[rgba(6,10,20,0.98)] py-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl"
            >
              {suggestions.map((item, index) => (
                <li
                  key={item.slug}
                  id={`${suggestionsId}-option-${index}`}
                  role="option"
                  aria-selected={activeSuggestionIndex === index}
                >
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={() => {
                      setSuggestOpen(false);
                      setActiveSuggestionIndex(-1);
                    }}
                    onMouseEnter={() => setActiveSuggestionIndex(index)}
                    className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-[var(--market-paper-white)] transition hover:bg-[rgba(255,255,255,0.06)] ${
                      activeSuggestionIndex === index ? "bg-[rgba(255,255,255,0.06)]" : ""
                    }`}
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

      <div className="market-paper rounded-[1.8rem] p-5">
        <label
          htmlFor={categoryId}
          className="text-sm font-semibold text-[var(--market-paper-white)]"
        >
          Category
        </label>
        <select
          id={categoryId}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="market-select mt-3 rounded-[1.2rem] px-4 py-3"
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="market-paper rounded-[1.8rem] p-5">
        <label
          htmlFor={brandId}
          className="text-sm font-semibold text-[var(--market-paper-white)]"
        >
          Brand
        </label>
        <select
          id={brandId}
          value={brand}
          onChange={(event) => setBrand(event.target.value)}
          className="market-select mt-3 rounded-[1.2rem] px-4 py-3"
        >
          <option value="">All brands</option>
          {brands.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="market-paper rounded-[1.8rem] p-5">
        <p className="text-sm font-semibold text-[var(--market-paper-white)]">Trust filters</p>
        <div className="mt-4 space-y-3">
          <label
            htmlFor={verifiedId}
            className="flex items-center gap-3 rounded-[1.15rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-[var(--market-paper-white)]"
          >
            <input
              id={verifiedId}
              checked={verified}
              onChange={(event) => setVerified(event.target.checked)}
              type="checkbox"
            />
            Verified sellers only
          </label>
          <label
            htmlFor={codId}
            className="flex items-center gap-3 rounded-[1.15rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-[var(--market-paper-white)]"
          >
            <input
              id={codId}
              checked={cod}
              onChange={(event) => setCod(event.target.checked)}
              type="checkbox"
            />
            Cash on delivery eligible
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <section className="relative grid gap-6 xl:grid-cols-[320px,1fr]">
        <aside className="sticky top-28 z-10 hidden self-start xl:block">{filters}</aside>

        <div className="relative z-20 space-y-5">
          <div className="market-panel rounded-[1.9rem] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--market-brass)]" />
                  Reactive marketplace search
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-[var(--market-paper-white)]">
                    {loading ? "Refreshing results..." : `${sortedItems.length} refined result${sortedItems.length === 1 ? "" : "s"}`}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">
                    Search reacts quickly, filters stay visible, and trust context stays readable instead of being buried.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="market-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold xl:hidden"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </button>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-[var(--market-muted)]">
                  <SlidersHorizontal className="h-4 w-4" />
                  Premium filtering
                </div>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortMode)}
                  className="market-select min-w-[180px] rounded-full px-4 py-3 text-sm"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="price_low">Price: Low to high</option>
                  <option value="price_high">Price: High to low</option>
                  <option value="rating">Rating first</option>
                </select>
              </div>
            </div>

            {activeChips.length ? (
              <div className="mt-5 flex flex-wrap gap-3">
                {activeChips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={chip.clear}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.05)] px-4 py-2 text-sm font-semibold text-[var(--market-paper-white)]"
                  >
                    {chip.label}
                    <X className="h-3.5 w-3.5 text-[var(--market-muted)]" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {sortedItems.length ? (
            <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {sortedItems.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          ) : (
            <div className="market-soft rounded-[2rem] px-6 py-12 text-center">
              <p className="text-2xl font-semibold tracking-tight text-[var(--market-paper-white)]">
                Nothing matched that exact combination.
              </p>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--market-muted)]">
                Ease one trust filter or widen the keyword. HenryCo search is meant to keep buyers moving, not trap them in dead-end clutter.
              </p>
              <Link
                href="/search"
                className="market-button-primary mt-5 inline-flex rounded-full px-5 py-3 text-sm font-semibold"
              >
                Reset search
              </Link>
            </div>
          )}
        </div>
      </section>

      {mobileFiltersOpen ? (
        <div
          className="fixed inset-0 z-[65] bg-[rgba(2,4,10,0.58)] backdrop-blur-md xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby={filterDialogTitleId}
        >
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[2rem] border-t border-[var(--market-line)] bg-[rgba(5,7,13,0.96)] p-4 shadow-[0_-24px_80px_rgba(0,0,0,0.36)]">
            <div className="mb-4 flex items-center justify-between">
              <p id={filterDialogTitleId} className="text-lg font-semibold text-[var(--market-paper-white)]">
                Filters
              </p>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close marketplace filters"
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
