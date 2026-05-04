"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { MarketplaceFaqCategory } from "@/lib/marketplace/help-faqs";

type FaqMatch = {
  category: MarketplaceFaqCategory;
  item: MarketplaceFaqCategory["items"][number];
};

/**
 * MarketplaceHelpCentre — search + category-chip + expand pattern.
 * Replaces the previous taxonomy-only routing form with a real help
 * surface (CHROME-01B FIX 9). Search is client-side over the static
 * FAQ array, scoped to question + answer text.
 */
export default function MarketplaceHelpCentre({
  categories,
}: {
  categories: MarketplaceFaqCategory[];
}) {
  const [query, setQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    categories[0]?.id ?? ""
  );
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const trimmedQuery = query.trim().toLowerCase();

  const searchMatches: FaqMatch[] = useMemo(() => {
    if (!trimmedQuery) return [];
    const results: FaqMatch[] = [];
    for (const category of categories) {
      for (const item of category.items) {
        if (
          item.question.toLowerCase().includes(trimmedQuery) ||
          item.answer.toLowerCase().includes(trimmedQuery)
        ) {
          results.push({ category, item });
        }
      }
    }
    return results.slice(0, 12);
  }, [trimmedQuery, categories]);

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === activeCategoryId) ?? categories[0],
    [activeCategoryId, categories]
  );

  return (
    <div className="space-y-8">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--market-muted)]"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search help — e.g. refund, missing item, payout"
          className="h-14 w-full rounded-2xl border border-[var(--market-line)] bg-black/30 pl-11 pr-4 text-base text-[var(--market-paper-white)] outline-none placeholder:text-[var(--market-muted)]/70 focus:border-[var(--market-brass)]"
          aria-label="Search the help centre"
        />
      </div>

      {trimmedQuery ? (
        <section>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--market-muted)]">
            {searchMatches.length} match{searchMatches.length === 1 ? "" : "es"} for
            <span className="ml-1.5 text-[var(--market-paper-white)]">{query}</span>
          </p>
          {searchMatches.length ? (
            <ul className="mt-4 divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
              {searchMatches.map(({ category, item }) => (
                <li key={`${category.id}-${item.id}`} className="py-4">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-brass)]">
                    {category.label}
                  </p>
                  <p className="mt-2 text-base font-semibold tracking-tight text-[var(--market-paper-white)]">
                    {item.question}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">
                    {item.answer}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--market-muted)]">
              No FAQ matches yet. Try fewer words, or open a support ticket below
              and a person will read it.
            </p>
          )}
        </section>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isActive = activeCategory?.id === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setActiveCategoryId(category.id);
                    setExpandedItemId(null);
                  }}
                  className={
                    isActive
                      ? "rounded-full border border-[var(--market-brass)] bg-[var(--market-brass)] px-4 py-2 text-sm font-semibold text-black"
                      : "rounded-full border border-[var(--market-line)] bg-white/[0.04] px-4 py-2 text-sm font-medium text-[var(--market-paper-white)]/82 transition hover:bg-white/[0.08]"
                  }
                >
                  {category.label}
                </button>
              );
            })}
          </div>

          {activeCategory ? (
            <section>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--market-muted)]">
                {activeCategory.label}
              </p>
              <h2 className="mt-2 text-balance text-[1.4rem] font-semibold leading-[1.2] tracking-[-0.012em] text-[var(--market-paper-white)] sm:text-[1.6rem]">
                {activeCategory.description}
              </h2>
              <ul className="mt-6 divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
                {activeCategory.items.map((item) => {
                  const isOpen = expandedItemId === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedItemId(isOpen ? null : item.id)
                        }
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between gap-4 py-4 text-left"
                      >
                        <span className="text-base font-semibold tracking-tight text-[var(--market-paper-white)]">
                          {item.question}
                        </span>
                        <ChevronDown
                          className={
                            isOpen
                              ? "h-4 w-4 shrink-0 rotate-180 text-[var(--market-brass)] transition"
                              : "h-4 w-4 shrink-0 text-[var(--market-muted)] transition"
                          }
                          aria-hidden
                        />
                      </button>
                      {isOpen ? (
                        <p className="pb-5 pr-8 text-sm leading-7 text-[var(--market-muted)]">
                          {item.answer}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
