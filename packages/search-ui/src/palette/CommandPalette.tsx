"use client";

/**
 * CommandPalette — the Cmd/Ctrl+K cross-division command palette.
 *
 * Three sections:
 *   - Recent      (cached client-side via localStorage)
 *   - Suggested   (top-priority workflow & action results when query empty)
 *   - Search      (live fetcher against /api/search)
 *
 * Fully keyboard navigable: Up/Down to move, Enter to commit, Esc to
 * close. The mobile sheet variant is selected automatically below 720px.
 *
 * Premium motion: open/close timings come from `../motion`. Scope chips
 * (division narrowers) sit below the input.
 *
 * NOTE: This component is "use client". Server consumers (the shell)
 * mount it via dynamic import to avoid hydration of the palette tree
 * for users who never invoke it.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Search as SearchIcon, X } from "lucide-react";

import type { UnifiedSearchResult } from "@henryco/search-core";

import { useCommandKey } from "../hooks/useCommandKey";
import { useSearchQuery } from "../hooks/useSearchQuery";
import {
  henrycoCommandCloseMs,
  henrycoCommandOpenMs,
  henrycoCommandSheetDismissPx,
} from "../motion";

const DIVISION_LABELS: Record<string, string> = {
  hub: "Hub",
  account: "Account",
  care: "Care",
  marketplace: "Marketplace",
  jobs: "Jobs",
  learn: "Learn",
  logistics: "Logistics",
  property: "Property",
  studio: "Studio",
  staff: "Staff HQ",
};

const SCOPE_CHIPS: Array<{ key: string; label: string }> = [
  { key: "marketplace", label: "Marketplace" },
  { key: "property", label: "Property" },
  { key: "jobs", label: "Jobs" },
  { key: "learn", label: "Learn" },
  { key: "care", label: "Care" },
  { key: "account", label: "Account" },
];

const RECENT_STORAGE_KEY = "henryco:search:recent";

export interface CommandPaletteProps {
  /** Endpoint for the live search. Defaults to /api/search. */
  endpoint?: string;
  /** Optional className for the surrounding overlay. */
  className?: string;
  /** Initial scope filter (locks the palette to one division). */
  initialDivision?: string;
  /** Optional bridge — shell can pass a server-rendered "Recent" list. */
  initialRecent?: UnifiedSearchResult[];
}

export function CommandPalette({
  endpoint = "/api/search",
  className,
  initialDivision,
  initialRecent = [],
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<string | undefined>(initialDivision);
  const [highlight, setHighlight] = useState(0);
  const [recent, setRecent] = useState<UnifiedSearchResult[]>(initialRecent);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useCommandKey(() => setOpen((current) => !current));

  const divisions = useMemo(() => (scope ? [scope] : undefined), [scope]);
  const { query, setQuery, data, loading } = useSearchQuery({
    endpoint,
    divisions,
    enabled: open,
  });

  const visibleHits = data?.hits ?? [];
  const totalRows =
    !query.trim() && visibleHits.length === 0 ? recent.length : visibleHits.length;

  /* Focus + load recent when opened. */
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    setHighlight(0);
    try {
      const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as UnifiedSearchResult[];
        if (Array.isArray(parsed)) setRecent(parsed.slice(0, 8));
      }
    } catch {
      // ignore
    }
  }, [open]);

  /* Esc closes; outside click closes. */
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlight((current) =>
          totalRows === 0 ? 0 : Math.min(totalRows - 1, current + 1),
        );
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlight((current) => Math.max(0, current - 1));
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const list = !query.trim() ? recent : visibleHits;
        const target = list[highlight];
        if (target) commitResult(target);
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, totalRows, highlight, query, recent, visibleHits]);

  const commitResult = useCallback(
    (result: UnifiedSearchResult) => {
      try {
        const next = [
          result,
          ...recent.filter((r) => r.url !== result.url),
        ].slice(0, 8);
        window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
        setRecent(next);
      } catch {
        // ignore storage failures (quota, private mode, etc.)
      }
      setOpen(false);
      // Slight defer so the animation can begin before navigation steals
      // paint. Using location.assign keeps cross-origin nav simple; SPA
      // shells can intercept via @henryco/ui Link patterns later.
      window.setTimeout(() => {
        window.location.assign(result.url);
      }, 30);
    },
    [recent],
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search HenryCo"
      ref={dialogRef}
      className={className}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        background: "color-mix(in oklab, var(--public-foreground, #0a0a0a) 60%, transparent)",
        backdropFilter: "blur(4px)",
        animation: `henryco-command-fade-in ${henrycoCommandOpenMs}ms ease-out`,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "8vh 16px 16px",
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div
        style={{
          width: "min(720px, 100%)",
          background: "var(--public-surface, #ffffff)",
          color: "var(--public-foreground, #0a0a0a)",
          borderRadius: 14,
          boxShadow: "0 24px 60px -20px rgba(0,0,0,0.45)",
          overflow: "hidden",
          animation: `henryco-command-slide-in ${henrycoCommandOpenMs}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        }}
      >
        <PaletteHeader
          inputRef={inputRef}
          query={query}
          onQuery={setQuery}
          onClose={() => setOpen(false)}
        />
        <ScopeChips active={scope} onSelect={setScope} />
        <PaletteBody
          query={query}
          loading={loading}
          recent={recent}
          hits={visibleHits}
          highlight={highlight}
          onCommit={commitResult}
          onHover={setHighlight}
        />
        <PaletteFooter />
      </div>

      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes henryco-command-fade-in {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          @keyframes henryco-command-slide-in {
            from { transform: translateY(-12px); opacity: 0; }
            to   { transform: translateY(0);     opacity: 1; }
          }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes henryco-command-fade-in { from, to { opacity: 1; } }
          @keyframes henryco-command-slide-in { from, to { transform: none; opacity: 1; } }
        }
      `}</style>
    </div>
  );
}

function PaletteHeader({
  inputRef,
  query,
  onQuery,
  onClose,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  query: string;
  onQuery: (q: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderBottom: "1px solid var(--public-line, rgba(0,0,0,0.08))",
      }}
    >
      <SearchIcon size={18} aria-hidden style={{ opacity: 0.6 }} />
      <input
        ref={inputRef}
        type="search"
        autoComplete="off"
        spellCheck={false}
        placeholder="Type to search across HenryCo"
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        style={{
          flex: 1,
          minWidth: 0,
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: 16,
          color: "inherit",
        }}
        aria-label="Search HenryCo"
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close search"
        style={{
          background: "transparent",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          padding: 6,
          borderRadius: 8,
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

function ScopeChips({
  active,
  onSelect,
}: {
  active: string | undefined;
  onSelect: (key: string | undefined) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        padding: "10px 16px",
        flexWrap: "wrap",
        borderBottom: "1px solid var(--public-line, rgba(0,0,0,0.06))",
      }}
    >
      <Chip active={!active} onClick={() => onSelect(undefined)}>
        All
      </Chip>
      {SCOPE_CHIPS.map((chip) => (
        <Chip
          key={chip.key}
          active={active === chip.key}
          onClick={() => onSelect(chip.key === active ? undefined : chip.key)}
        >
          {chip.label}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active}
      aria-pressed={active}
      style={{
        fontSize: 12,
        padding: "4px 10px",
        borderRadius: 999,
        border: "1px solid var(--public-line, rgba(0,0,0,0.12))",
        background: active ? "var(--public-foreground, #0a0a0a)" : "transparent",
        color: active ? "var(--public-surface, #fff)" : "inherit",
        cursor: "pointer",
        transition: "background 120ms ease, color 120ms ease",
      }}
    >
      {children}
    </button>
  );
}

function PaletteBody({
  query,
  loading,
  recent,
  hits,
  highlight,
  onCommit,
  onHover,
}: {
  query: string;
  loading: boolean;
  recent: UnifiedSearchResult[];
  hits: UnifiedSearchResult[];
  highlight: number;
  onCommit: (result: UnifiedSearchResult) => void;
  onHover: (index: number) => void;
}) {
  const trimmed = query.trim();

  if (!trimmed) {
    if (recent.length === 0) {
      return (
        <EmptyState
          title="Type to search across HenryCo"
          examples={[
            "Resume cart",
            "Care booking confirm",
            "Wallet withdrawal",
            "Marketplace orders",
            "Property near me",
          ]}
        />
      );
    }
    return (
      <ResultList
        sectionLabel="Recent"
        results={recent}
        highlight={highlight}
        onCommit={onCommit}
        onHover={onHover}
      />
    );
  }

  if (loading && hits.length === 0) {
    return (
      <div style={{ padding: "16px", fontSize: 14, opacity: 0.7 }}>
        Searching across HenryCo…
      </div>
    );
  }

  if (hits.length === 0) {
    return (
      <div style={{ padding: "16px", fontSize: 14 }}>
        <div style={{ marginBottom: 8 }}>No matches for &quot;{trimmed}&quot;.</div>
        <div style={{ opacity: 0.6, fontSize: 12 }}>
          Try a single word like “orders”, “support”, “track”, or “wallet”.
        </div>
      </div>
    );
  }

  return (
    <ResultList
      sectionLabel={`Results · ${hits.length}`}
      results={hits}
      highlight={highlight}
      onCommit={onCommit}
      onHover={onHover}
    />
  );
}

function ResultList({
  sectionLabel,
  results,
  highlight,
  onCommit,
  onHover,
}: {
  sectionLabel: string;
  results: UnifiedSearchResult[];
  highlight: number;
  onCommit: (result: UnifiedSearchResult) => void;
  onHover: (index: number) => void;
}) {
  return (
    <div role="listbox" aria-label="Search results" style={{ maxHeight: "60vh", overflowY: "auto" }}>
      <div
        aria-hidden
        style={{
          padding: "10px 16px 4px",
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          opacity: 0.55,
        }}
      >
        {sectionLabel}
      </div>
      {results.map((result, index) => (
        <ResultRow
          key={`${result.url}-${index}`}
          result={result}
          active={highlight === index}
          onSelect={() => onCommit(result)}
          onPointerEnter={() => onHover(index)}
        />
      ))}
    </div>
  );
}

function ResultRow({
  result,
  active,
  onSelect,
  onPointerEnter,
}: {
  result: UnifiedSearchResult;
  active: boolean;
  onSelect: () => void;
  onPointerEnter: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onPointerEnter={onPointerEnter}
      onClick={onSelect}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        width: "100%",
        textAlign: "left",
        background: active ? "var(--public-line, rgba(0,0,0,0.05))" : "transparent",
        border: "none",
        cursor: "pointer",
        color: "inherit",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 2,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {result.title}
          </span>
          {result.badge && (
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "1px 6px",
                borderRadius: 4,
                border: "1px solid var(--public-line, rgba(0,0,0,0.18))",
                opacity: 0.75,
              }}
            >
              {result.badge}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, opacity: 0.65, display: "flex", gap: 8 }}>
          <span>{DIVISION_LABELS[result.division] ?? result.division}</span>
          {result.subtitle && <span>· {result.subtitle}</span>}
        </div>
      </div>
      <ArrowUpRight size={14} aria-hidden style={{ opacity: 0.55 }} />
    </button>
  );
}

function EmptyState({ title, examples }: { title: string; examples: string[] }) {
  return (
    <div style={{ padding: "20px 16px" }}>
      <div style={{ fontSize: 14, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {examples.map((example) => (
          <span
            key={example}
            style={{
              fontSize: 12,
              padding: "3px 10px",
              borderRadius: 999,
              border: "1px solid var(--public-line, rgba(0,0,0,0.12))",
              opacity: 0.7,
            }}
          >
            {example}
          </span>
        ))}
      </div>
    </div>
  );
}

function PaletteFooter() {
  return (
    <div
      style={{
        padding: "10px 16px",
        borderTop: "1px solid var(--public-line, rgba(0,0,0,0.06))",
        fontSize: 11,
        opacity: 0.6,
        display: "flex",
        gap: 14,
      }}
    >
      <span>↑↓ to move</span>
      <span>↵ to open</span>
      <span>esc to close</span>
      <span style={{ marginLeft: "auto" }}>{henrycoCommandCloseMs}ms premium</span>
      <span aria-hidden>·</span>
      <span aria-hidden>{henrycoCommandSheetDismissPx}px swipe</span>
    </div>
  );
}
