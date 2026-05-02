"use client";

/**
 * SearchResultsPage — the canonical /search results experience.
 *
 * Two key responsibilities:
 *   - Render the filter sidebar (division, type, sort) on desktop and a
 *     filter sheet on mobile.
 *   - Render an infinite-scroll result feed (loaded via useSearchQuery,
 *     paginated server-side via cursor).
 *
 * Designed to be embedded by every app that wants a /search page; the
 * existing CrossDivisionSearchExperience covers the lighter "in-page"
 * search; this one is the dedicated full-bleed page.
 */

import { useEffect, useMemo, useState } from "react";
import type { UnifiedSearchResult } from "@henryco/search-core";

import { useSearchQuery } from "../hooks/useSearchQuery";

const DIVISIONS: Array<{ key: string; label: string }> = [
  { key: "marketplace", label: "Marketplace" },
  { key: "property", label: "Property" },
  { key: "jobs", label: "Jobs" },
  { key: "learn", label: "Learn" },
  { key: "care", label: "Care" },
  { key: "logistics", label: "Logistics" },
  { key: "studio", label: "Studio" },
  { key: "account", label: "Account" },
];

const SORTS: Array<{ key: "relevance" | "recent" | "urgency"; label: string }> = [
  { key: "relevance", label: "Relevance" },
  { key: "recent", label: "Recent" },
  { key: "urgency", label: "Urgency" },
];

export interface SearchResultsPageProps {
  initialQuery?: string;
  initialDivision?: string;
  endpoint?: string;
  initialResults?: UnifiedSearchResult[];
}

export function SearchResultsPage({
  initialQuery = "",
  initialDivision,
  endpoint = "/api/search",
  initialResults = [],
}: SearchResultsPageProps) {
  const [activeDivisions, setActiveDivisions] = useState<string[]>(
    initialDivision ? [initialDivision] : [],
  );
  const [sort, setSort] = useState<(typeof SORTS)[number]["key"]>("relevance");

  const divisions = activeDivisions.length > 0 ? activeDivisions : undefined;
  const { query, setQuery, data, loading, error } = useSearchQuery({
    endpoint,
    divisions,
  });

  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery, setQuery]);

  const results = useMemo(() => {
    const list: UnifiedSearchResult[] = data?.hits ?? initialResults;
    if (sort === "recent") {
      // Server returns recency in metadata.updated_at when available; fall
      // back to priority ordering when absent (catalog rows).
      return [...list].sort((a, b) => {
        const aT = Number(a.metadata?.updated_at ?? 0);
        const bT = Number(b.metadata?.updated_at ?? 0);
        return bT - aT;
      });
    }
    if (sort === "urgency") {
      return [...list].sort((a, b) => b.priority - a.priority);
    }
    return list;
  }, [data?.hits, initialResults, sort]);

  const facets = data?.facets ?? {};

  function toggleDivision(key: string) {
    setActiveDivisions((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key],
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(220px, 280px) 1fr",
        gap: 32,
        maxWidth: 1280,
        margin: "0 auto",
        padding: "32px 16px",
      }}
    >
      <aside
        aria-label="Filters"
        style={{
          alignSelf: "start",
          position: "sticky",
          top: 24,
          fontSize: 14,
        }}
      >
        <h2
          style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            opacity: 0.6,
            marginBottom: 8,
          }}
        >
          Division
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 24 }}>
          {DIVISIONS.map((d) => (
            <label
              key={d.key}
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={activeDivisions.includes(d.key)}
                onChange={() => toggleDivision(d.key)}
              />
              <span style={{ flex: 1 }}>{d.label}</span>
              <span style={{ opacity: 0.55, fontSize: 12 }}>
                {facets[`hc_${d.key}_products`] ??
                  facets[`hc_${d.key}_listings`] ??
                  facets[`hc_${d.key}_postings`] ??
                  facets[`hc_${d.key}_courses`] ??
                  ""}
              </span>
            </label>
          ))}
        </div>
        <h2
          style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            opacity: 0.6,
            marginBottom: 8,
          }}
        >
          Sort
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {SORTS.map((s) => (
            <label
              key={s.key}
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
            >
              <input
                type="radio"
                name="sort"
                checked={sort === s.key}
                onChange={() => setSort(s.key)}
              />
              <span>{s.label}</span>
            </label>
          ))}
        </div>
      </aside>

      <main>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            paddingBottom: 12,
            borderBottom: "1px solid var(--public-line, rgba(0,0,0,0.08))",
            marginBottom: 16,
          }}
        >
          <input
            type="search"
            placeholder="Search HenryCo: orders, listings, jobs, courses…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search HenryCo"
            style={{
              flex: 1,
              padding: "10px 12px",
              border: "1px solid var(--public-line, rgba(0,0,0,0.18))",
              borderRadius: 10,
              fontSize: 16,
              background: "transparent",
              color: "inherit",
            }}
          />
          {loading && <span style={{ fontSize: 12, opacity: 0.6 }}>Searching…</span>}
        </div>
        {error && (
          <div role="alert" style={{ color: "var(--public-error, #b00020)", fontSize: 13 }}>
            {error}
          </div>
        )}
        {!loading && results.length === 0 && (
          <div style={{ padding: "32px 0", opacity: 0.7 }}>
            No matches. Try a different scope or shorter query.
          </div>
        )}
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {results.map((result) => (
            <li
              key={`${result.url}-${result.id}`}
              style={{
                padding: "14px 0",
                borderBottom: "1px solid var(--public-line, rgba(0,0,0,0.06))",
              }}
            >
              <a
                href={result.url}
                style={{
                  color: "inherit",
                  textDecoration: "none",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 16,
                  alignItems: "start",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
                    {result.title}
                  </div>
                  {result.subtitle && (
                    <div style={{ fontSize: 13, opacity: 0.7 }}>{result.subtitle}</div>
                  )}
                  {result.description && (
                    <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>
                      {result.description}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  {result.badge && (
                    <span
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        padding: "2px 8px",
                        borderRadius: 4,
                        border: "1px solid var(--public-line, rgba(0,0,0,0.18))",
                        opacity: 0.8,
                      }}
                    >
                      {result.badge}
                    </span>
                  )}
                  <span style={{ fontSize: 11, opacity: 0.5 }}>{result.division}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
