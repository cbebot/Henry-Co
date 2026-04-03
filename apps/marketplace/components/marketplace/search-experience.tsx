"use client";

import Link from "next/link";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";
import { ProductCard } from "@/components/marketplace/shell";
import type { MarketplaceBrand, MarketplaceCategory, MarketplaceProduct } from "@/lib/marketplace/types";

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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
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

  const filters = (
    <div className="space-y-5">
      <div className="rounded-[1.7rem] border border-[var(--market-line-strong)] bg-[var(--market-paper-white)] p-5 shadow-[0_20px_52px_rgba(28,24,18,0.06)]">
        <p className="text-sm font-semibold text-[var(--market-ink)]">Keyword</p>
        <div className="mt-3 flex items-center gap-3 rounded-full border border-[var(--market-line)] bg-[var(--market-bg-elevated)] px-4 py-3">
          <Search className="h-4 w-4 text-[var(--market-muted)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Desk lamp, cashmere throw, executive chair"
            className="w-full bg-transparent text-sm text-[var(--market-ink)] outline-none placeholder:text-[color:rgba(34,29,24,0.42)]"
          />
        </div>
      </div>

      <div className="rounded-[1.7rem] border border-[var(--market-line-strong)] bg-[var(--market-paper-white)] p-5 shadow-[0_20px_52px_rgba(28,24,18,0.06)]">
        <p className="text-sm font-semibold text-[var(--market-ink)]">Category</p>
        <select
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

      <div className="rounded-[1.7rem] border border-[var(--market-line-strong)] bg-[var(--market-paper-white)] p-5 shadow-[0_20px_52px_rgba(28,24,18,0.06)]">
        <p className="text-sm font-semibold text-[var(--market-ink)]">Brand</p>
        <select
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

      <div className="rounded-[1.7rem] border border-[var(--market-line-strong)] bg-[var(--market-paper-white)] p-5 shadow-[0_20px_52px_rgba(28,24,18,0.06)]">
        <p className="text-sm font-semibold text-[var(--market-ink)]">Trust filters</p>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-3 rounded-[1.15rem] border border-[var(--market-line)] bg-[var(--market-bg-elevated)] px-4 py-3 text-sm text-[var(--market-ink)]">
            <input checked={verified} onChange={(event) => setVerified(event.target.checked)} type="checkbox" />
            Verified sellers only
          </label>
          <label className="flex items-center gap-3 rounded-[1.15rem] border border-[var(--market-line)] bg-[var(--market-bg-elevated)] px-4 py-3 text-sm text-[var(--market-ink)]">
            <input checked={cod} onChange={(event) => setCod(event.target.checked)} type="checkbox" />
            Cash on delivery eligible
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <section className="grid gap-6 xl:grid-cols-[320px,1fr]">
        <aside className="sticky top-28 hidden self-start xl:block">{filters}</aside>

        <div className="space-y-5">
          <div className="flex flex-col gap-4 rounded-[1.7rem] border border-[var(--market-line-strong)] bg-[var(--market-paper-white)] p-5 shadow-[0_20px_52px_rgba(28,24,18,0.06)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--market-brass)]">
                Reactive search
              </p>
              <p className="mt-2 text-sm text-[var(--market-muted)]">
                {loading ? "Refreshing results..." : `${items.length} refined result${items.length === 1 ? "" : "s"}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--market-line)] bg-[var(--market-bg-elevated)] px-4 py-3 text-sm font-semibold text-[var(--market-ink)] xl:hidden"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--market-line)] bg-[var(--market-bg-elevated)] px-4 py-3 text-sm text-[var(--market-muted)]">
                <SlidersHorizontal className="h-4 w-4" />
                Premium filtering
              </div>
            </div>
          </div>

          {items.length ? (
            <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {items.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-[var(--market-line-strong)] bg-[var(--market-paper-white)] px-6 py-12 text-center shadow-[0_20px_52px_rgba(28,24,18,0.05)]">
              <p className="text-2xl font-semibold tracking-tight text-[var(--market-ink)]">
                Nothing matched that exact combination.
              </p>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--market-muted)]">
                Try easing one trust filter or widening the keyword. HenryCo Marketplace keeps the search calm instead of sending you into a dead-end state.
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
        <div className="fixed inset-0 z-[65] bg-[rgba(10,8,6,0.42)] backdrop-blur-sm xl:hidden">
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[2rem] bg-[var(--market-bg)] p-4 shadow-[0_-24px_80px_rgba(17,13,9,0.18)]">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-semibold text-[var(--market-ink)]">Filters</p>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-full border border-[var(--market-line)] bg-[var(--market-paper-white)] px-4 py-2 text-sm font-semibold text-[var(--market-ink)]"
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
