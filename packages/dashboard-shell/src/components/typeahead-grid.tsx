"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";
import { RADIUS, SPACING } from "../tokens/spacing";
import { focusVisibleStyle } from "../tokens/focus";

/**
 * TypeaheadGrid — searchable grid picker.
 *
 * Closes anti-pattern #1 (long-scroll picker — audit §B.care-7,
 * §B.studio-7). Replaces native long `<select>` lists and 50+ row
 * scroll-pickers with a fast typeahead + visual grid.
 *
 * Generic over `TItem` — caller passes:
 *   - `items: TItem[]`
 *   - `getKey: (item) => string`
 *   - `getLabel: (item) => string`
 *   - `getKeywords?: (item) => string[]` — extra fuzzy-match terms
 *   - `renderItem: (item) => ReactNode` — the visual representation
 *
 * Filtering is case-insensitive substring match against label +
 * keywords. For >200 items, the caller should pre-paginate or use
 * the unified search service (DASH-5).
 */
export type TypeaheadGridProps<TItem> = {
  items: ReadonlyArray<TItem>;
  getKey: (item: TItem) => string;
  getLabel: (item: TItem) => string;
  getKeywords?: (item: TItem) => ReadonlyArray<string>;
  renderItem: (item: TItem) => ReactNode;
  /** Initial search value — useful for restoring filter state. */
  initialQuery?: string;
  /** Placeholder for the search input. */
  placeholder?: string;
  /** Empty-state message when no items match. */
  emptyMessage?: string;
  /** Items per row at desktop breakpoint. Default 4. */
  columnsLg?: number;
  /** Items per row at mobile breakpoint. Default 2. */
  columnsSm?: number;
  /** Selection callback — receives the picked item. */
  onSelect?: (item: TItem) => void;
};

export function TypeaheadGrid<TItem>({
  items,
  getKey,
  getLabel,
  getKeywords,
  renderItem,
  initialQuery = "",
  placeholder = "Search…",
  emptyMessage = "Nothing matches that query.",
  columnsLg = 4,
  columnsSm = 2,
  onSelect,
}: TypeaheadGridProps<TItem>) {
  const [query, setQuery] = useState(initialQuery);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const label = getLabel(item).toLowerCase();
      if (label.includes(q)) return true;
      const keywords = getKeywords ? getKeywords(item).map((k) => k.toLowerCase()) : [];
      return keywords.some((k) => k.includes(q));
    });
  }, [items, query, getLabel, getKeywords]);

  return (
    <div>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.6rem 0.85rem",
          borderRadius: RADIUS.pill,
          border: `1px solid var(${CSS_VARS.hairline})`,
          backgroundColor: `var(${CSS_VARS.surface})`,
          marginBottom: "1rem",
        }}
      >
        <Search size={16} aria-hidden style={{ color: `var(${CSS_VARS.inkMuted})` }} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            flex: 1,
            color: `var(${CSS_VARS.ink})`,
            ...typeStyle("body"),
          }}
        />
      </label>

      {filtered.length === 0 ? (
        <p
          style={{
            ...typeStyle("body"),
            color: `var(${CSS_VARS.inkSoft})`,
            padding: SPACING.inset.lg,
            textAlign: "center",
          }}
        >
          {emptyMessage}
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columnsSm}, minmax(0, 1fr))`,
            gap: "0.75rem",
            // Bump to columnsLg at lg breakpoint via a small media query.
          }}
          className={`hc-typeahead-grid hc-cols-sm-${columnsSm} hc-cols-lg-${columnsLg}`}
        >
          {filtered.map((item) => (
            <button
              key={getKey(item)}
              type="button"
              onClick={() => onSelect?.(item)}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                textAlign: "left",
                cursor: "pointer",
                ...focusVisibleStyle(),
              }}
            >
              {renderItem(item)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
