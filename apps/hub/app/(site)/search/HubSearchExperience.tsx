"use client";

/**
 * Hub /search — the live cross-division instrument.
 *
 * This replaces the static, cream-themed CrossDivisionSearchExperience on the
 * hub. It is genuinely live: it queries GET /api/search (Typesense + the
 * in-memory catalog) with a debounced, abortable fetcher, falls back to the
 * curated catalog whenever the index is empty or unreachable, and is fully
 * operable from the keyboard (combobox + listbox semantics, /, arrows, Enter).
 *
 * It is themed entirely in the hub's dark-navy + brass-gold language (--site-*,
 * --accent, white-alpha ladder) so it reads as the same product as the
 * homepage, and uses framer-motion for a single reduced-motion-gated entrance
 * (never per-keystroke, which jitters).
 */

import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Briefcase,
  Building2,
  ChevronRight,
  Clock,
  Command,
  Compass,
  CornerDownLeft,
  FileText,
  GraduationCap,
  Headphones,
  Layers3,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  Package,
  Palette,
  Receipt,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@henryco/ui";
import {
  buildSearchSignal,
  type CrossDivisionSearchContext,
  type CrossDivisionSearchSignalKind,
} from "@henryco/intelligence";
import {
  arrangeResults,
  curatedBrowse,
  divisionCounts,
  divisionMeta,
  displayHost,
  EXAMPLE_PROMPTS,
  humaniseError,
  type IconToken,
  PLACEHOLDER_HINTS,
  presentDivisions,
  rankCatalog,
  type SearchApiResponse,
  type SearchHit,
  type Scope,
  type SortMode,
} from "./search-shared";

const ICONS: Record<IconToken, React.ComponentType<{ className?: string }>> = {
  compass: Compass,
  building: Building2,
  sparkles: Sparkles,
  "shopping-bag": ShoppingBag,
  briefcase: Briefcase,
  "graduation-cap": GraduationCap,
  truck: Truck,
  palette: Palette,
  wallet: Wallet,
  bell: Bell,
  receipt: Receipt,
  "life-buoy": LifeBuoy,
  shield: ShieldCheck,
  settings: Settings2,
  "message-square": MessageSquare,
  "map-pin": MapPin,
  package: Package,
  search: Search,
  "layout-dashboard": LayoutDashboard,
  "file-text": FileText,
  users: Users,
  headphones: Headphones,
};

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent,#C9A227)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816]";

const RECENTS_KEY = "henryco:hub:search:recent";
const LIMIT = 24;
const DEBOUNCE_MS = 170;

type Source = "seed" | "live" | "catalog" | "browse";

type Snapshot = {
  results: SearchHit[];
  total: number;
  tookMs: number | null;
  nextCursor: string | null;
  source: Source;
  query: string;
  scope: Scope;
};

export type HubSearchExperienceProps = {
  initialQuery: string;
  initialScope: Scope;
  signedIn: boolean;
  firstName: string | null;
  catalog: SearchHit[];
  lockedPreview: SearchHit[];
  initialResults: SearchHit[];
  signInHref: string | null;
};

/**
 * Resolve an icon token to a rendered lucide element via createElement. Using
 * createElement (an element, not a JSX component local) keeps the dynamic icon
 * lookup from tripping react-hooks/static-components.
 */
function renderIcon(token: string, className: string) {
  return createElement(ICONS[token as IconToken] ?? Layers3, { className });
}

/** Bold the first case-insensitive occurrence of the query inside a label. */
function HighlightedText({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-[3px] bg-[color:var(--accent,#C9A227)]/22 px-0.5 text-white">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function readRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
}

export function HubSearchExperience({
  initialQuery,
  initialScope,
  signedIn,
  firstName,
  catalog,
  lockedPreview,
  initialResults,
  signInHref,
}: HubSearchExperienceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [inputValue, setInputValue] = useState(initialQuery);
  const [scope, setScope] = useState<Scope>(initialScope);
  const [sort, setSort] = useState<SortMode>("relevance");
  const [snapshot, setSnapshot] = useState<Snapshot>({
    results: initialResults,
    total: initialResults.length,
    tookMs: null,
    nextCursor: null,
    source: initialQuery ? "seed" : "browse",
    query: initialQuery,
    scope: initialScope,
  });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorNote, setErrorNote] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(-1);
  const [recents, setRecents] = useState<string[]>([]);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  const context: CrossDivisionSearchContext = signedIn ? "account" : "public";
  const queryActive = snapshot.query.trim().length > 0;

  const arranged = useMemo(
    () =>
      arrangeResults(snapshot.results, {
        queryActive,
        sort,
        perDivisionCap: queryActive ? Infinity : 6,
      }),
    [snapshot.results, queryActive, sort],
  );
  const flat = arranged.flat;
  const indexById = useMemo(() => new Map(flat.map((hit, i) => [hit.id, i])), [flat]);

  const chipDivisions = useMemo(() => presentDivisions(catalog), [catalog]);
  const counts = useMemo(() => divisionCounts(snapshot.results), [snapshot.results]);

  // ---- telemetry --------------------------------------------------------
  const emitSignal = useCallback(
    (kind: CrossDivisionSearchSignalKind, query: string, resultCount: number, result?: SearchHit) => {
      if (typeof window === "undefined") return;
      const signal = buildSearchSignal({ kind, query, context, resultCount, result });
      // Strip the raw query before broadcasting (privacy parity with the
      // shared component) — listeners only receive the hashed/length signal.
      const detail: Record<string, unknown> = { ...signal };
      delete detail.query;
      window.dispatchEvent(new CustomEvent("henryco:search-signal", { detail }));
    },
    [context],
  );

  const pushRecent = useCallback((query: string) => {
    const q = query.trim();
    if (!q) return;
    setRecents((prev) => {
      const next = [q, ...prev.filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(0, 8);
      try {
        window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
      } catch {
        /* storage may be unavailable; recents are best-effort */
      }
      return next;
    });
  }, []);

  // ---- core fetch -------------------------------------------------------
  const updateUrl = useCallback(
    (query: string, nextScope: Scope) => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (nextScope !== "all") params.set("division", nextScope);
      const href = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(href, { scroll: false });
    },
    [pathname, router],
  );

  const runSearch = useCallback(
    async (query: string, nextScope: Scope) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setErrorNote(null);
      updateUrl(query, nextScope);

      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (nextScope !== "all") params.set("division", nextScope);
        params.set("limit", String(LIMIT));
        const res = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP_${res.status}`);
        const data = (await res.json()) as SearchApiResponse;
        if (data.facets && data.facets.rate_limited) throw new Error("HTTP_429");

        const liveHits = Array.isArray(data.hits) ? data.hits : [];
        if (liveHits.length > 0) {
          setSnapshot({
            results: liveHits,
            total: typeof data.total === "number" && data.total >= 0 ? data.total : liveHits.length,
            tookMs: typeof data.took_ms === "number" ? data.took_ms : null,
            nextCursor: data.next_cursor ?? null,
            source: "live",
            query,
            scope: nextScope,
          });
          setHighlight(-1);
          if (query) {
            emitSignal("query_submitted", query, liveHits.length);
            pushRecent(query);
          }
        } else {
          const fb = query ? rankCatalog(catalog, nextScope, query) : curatedBrowse(catalog, nextScope);
          setSnapshot({
            results: fb,
            total: fb.length,
            tookMs: null,
            nextCursor: null,
            source: query ? "catalog" : "browse",
            query,
            scope: nextScope,
          });
          setHighlight(-1);
          if (query) {
            emitSignal(fb.length === 0 ? "zero_results" : "query_submitted", query, fb.length);
            if (fb.length) pushRecent(query);
          }
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        const fb = query ? rankCatalog(catalog, nextScope, query) : curatedBrowse(catalog, nextScope);
        setSnapshot({
          results: fb,
          total: fb.length,
          tookMs: null,
          nextCursor: null,
          source: "catalog",
          query,
          scope: nextScope,
        });
        setHighlight(-1);
        setErrorNote(humaniseError(err instanceof Error ? err.message : "error"));
      } finally {
        setLoading(false);
      }
    },
    [catalog, emitSignal, pushRecent, updateUrl],
  );

  const loadMore = useCallback(async () => {
    if (snapshot.source !== "live" || !snapshot.nextCursor) return;
    const controller = new AbortController();
    setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (snapshot.query) params.set("q", snapshot.query);
      if (snapshot.scope !== "all") params.set("division", snapshot.scope);
      params.set("limit", String(LIMIT));
      params.set("cursor", snapshot.nextCursor);
      const res = await fetch(`/api/search?${params.toString()}`, {
        signal: controller.signal,
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      const data = (await res.json()) as SearchApiResponse;
      const more = Array.isArray(data.hits) ? data.hits : [];
      setSnapshot((prev) => ({
        ...prev,
        results: [...prev.results, ...more],
        nextCursor: data.next_cursor ?? null,
      }));
    } catch {
      setSnapshot((prev) => ({ ...prev, nextCursor: null }));
    } finally {
      setLoadingMore(false);
    }
  }, [snapshot.nextCursor, snapshot.query, snapshot.scope, snapshot.source]);

  // Debounced search whenever the query text or scope changes.
  useEffect(() => {
    const q = inputValue.trim();
    const handle = window.setTimeout(() => {
      void runSearch(q, scope);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
    // runSearch is stable via useCallback; intentionally keyed to inputs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, scope]);

  // Mount: hydrate recents + clean up any in-flight request on unmount.
  useEffect(() => {
    setRecents(readRecents());
    return () => abortRef.current?.abort();
  }, []);

  // Global "/" to focus the field (homepage parity).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (!typing) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Rotate the placeholder hint while the field is empty.
  useEffect(() => {
    if (inputValue) return;
    const id = window.setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_HINTS.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [inputValue]);

  // Keep the highlight in range as results shrink.
  useEffect(() => {
    setHighlight((h) => (h > flat.length - 1 ? flat.length - 1 : h));
  }, [flat.length]);

  // Scroll the virtually-focused row into view.
  useEffect(() => {
    if (highlight < 0) return;
    const el = document.getElementById(`hub-search-opt-${highlight}`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  const navigate = useCallback(
    (hit: SearchHit) => {
      emitSignal("result_clicked", snapshot.query, flat.length, hit);
      if (snapshot.query) pushRecent(snapshot.query);
      window.location.assign(hit.url);
    },
    [emitSignal, flat.length, pushRecent, snapshot.query],
  );

  const onInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlight((h) => Math.min((h < 0 ? -1 : h) + 1, flat.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlight((h) => Math.max((h < 0 ? 0 : h) - 1, 0));
      } else if (event.key === "Enter") {
        const target = highlight >= 0 ? flat[highlight] : flat[0];
        if (target) {
          event.preventDefault();
          navigate(target);
        }
      } else if (event.key === "Escape") {
        if (inputValue) {
          event.preventDefault();
          setInputValue("");
        } else {
          inputRef.current?.blur();
        }
      }
    },
    [flat, highlight, inputValue, navigate],
  );

  // ---- derived display copy --------------------------------------------
  const scopeLabel = scope === "all" ? "all divisions" : divisionMeta(scope).label;
  const statusLine = (() => {
    if (loading && flat.length === 0) return "Searching across Henry Onyx…";
    if (!queryActive) return `Top routes across ${chipDivisions.length} divisions`;
    if (snapshot.source === "live") {
      const base = `${snapshot.total} ${snapshot.total === 1 ? "result" : "results"}`;
      const timing = snapshot.tookMs != null ? ` · answered in ${snapshot.tookMs} ms` : "";
      return `${base}${timing} · ${scopeLabel}`;
    }
    if (flat.length === 0) return `No results · ${scopeLabel}`;
    const tail = errorNote ? "live index unavailable" : "from the curated catalog";
    return `${flat.length} ${flat.length === 1 ? "route" : "routes"} · ${tail}`;
  })();

  const a11yStatus = (() => {
    if (loading && flat.length === 0) return "Searching.";
    if (!queryActive) return "";
    if (flat.length === 0) return `No results for ${snapshot.query}.`;
    const head = `${flat.length} ${flat.length === 1 ? "result" : "results"}.`;
    const hi = highlight >= 0 && flat[highlight] ? ` Highlighted: ${flat[highlight].title}.` : "";
    return head + hi;
  })();

  const reveal = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
        };

  return (
    <div className="relative isolate min-h-[calc(100vh-5rem)] text-white">
      {/* Local atmosphere: brass radial wash + base glow + dotted grid. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(900px_440px_at_15%_-12%,rgba(201,162,39,0.16),transparent_60%),radial-gradient(760px_380px_at_88%_-14%,rgba(201,162,39,0.07),transparent_62%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.5] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]"
      />

      <div className="mx-auto max-w-7xl px-4 pb-28 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        {/* ---- Hero ---- */}
        <header className="max-w-3xl">
          <motion.p
            {...reveal(0)}
            className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-white/55"
          >
            <Compass className="h-3.5 w-3.5 text-[color:var(--accent,#C9A227)]" aria-hidden />
            Henry Onyx · Universal search
          </motion.p>
          {firstName ? (
            <motion.p {...reveal(0.02)} className="mt-4 text-sm font-medium text-white/55">
              Signed in · {firstName}
            </motion.p>
          ) : null}
          <motion.h1
            {...reveal(0.04)}
            className="mt-3 text-balance text-[2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-white sm:text-[2.6rem] md:text-[3.1rem]"
          >
            Search everything{" "}
            <span className="text-[color:var(--accent,#C9A227)]">Henry Onyx</span> operates.
          </motion.h1>
          <motion.p {...reveal(0.06)} className="mt-5 max-w-2xl text-[15px] leading-7 text-white/68 sm:text-base">
            One entry point across marketplace, property, jobs, learning, care, logistics, and studio —
            plus your account workflows and help routes. Live, ranked, and one keystroke from the exact
            destination.
          </motion.p>
        </header>

        {/* ---- The instrument: input ---- */}
        <motion.form
          {...reveal(0.08)}
          role="search"
          className="mt-9"
          onSubmit={(event) => {
            event.preventDefault();
            const target = highlight >= 0 ? flat[highlight] : flat[0];
            if (target) navigate(target);
          }}
        >
          <label className="sr-only" htmlFor="hub-search-input">
            Search Henry Onyx
          </label>
          <div
            className={cn(
              "group relative flex items-center gap-3 rounded-2xl border border-white/12 bg-black/30 pl-4 pr-2 transition",
              "focus-within:border-[color:var(--accent,#C9A227)]/70 focus-within:bg-black/40",
            )}
          >
            <Search className="h-5 w-5 shrink-0 text-white/45" aria-hidden />
            <input
              id="hub-search-input"
              ref={inputRef}
              role="combobox"
              aria-expanded={flat.length > 0}
              aria-controls="hub-search-listbox"
              aria-activedescendant={highlight >= 0 ? `hub-search-opt-${highlight}` : undefined}
              aria-autocomplete="list"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder={PLACEHOLDER_HINTS[placeholderIdx]}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="h-14 min-w-0 flex-1 bg-transparent text-[1.05rem] text-white outline-none placeholder:text-white/35 sm:text-[1.15rem]"
            />
            {loading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/45" aria-hidden />
            ) : inputValue ? (
              <button
                type="button"
                onClick={() => {
                  setInputValue("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white/80",
                  FOCUS_RING,
                )}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            ) : (
              <kbd className="mr-1 hidden shrink-0 items-center rounded-md border border-white/15 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-white/55 sm:inline-flex">
                /
              </kbd>
            )}
          </div>

          {/* Status line — instrumentation that proves it is live */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-[11px] font-medium tracking-tight text-white/45">
            <span className="inline-flex items-center gap-2">
              <span
                className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full",
                  snapshot.source === "live" ? "bg-emerald-400" : "bg-[color:var(--accent,#C9A227)]",
                )}
                aria-hidden
              />
              {statusLine}
            </span>
            <span className="hidden items-center gap-1.5 font-mono text-[10.5px] text-white/40 sm:inline-flex">
              <CornerDownLeft className="h-3 w-3" aria-hidden /> open
              <span className="mx-1 opacity-40">·</span>
              <Command className="h-3 w-3" aria-hidden /> arrows to move
            </span>
          </div>
        </motion.form>

        {/* ---- Scope chips + sort ---- */}
        <motion.div
          {...reveal(0.1)}
          className="mt-7 flex flex-col gap-4 border-t border-white/10 pt-6 lg:flex-row lg:items-start lg:justify-between"
        >
          <div role="tablist" aria-label="Filter results by division" className="flex flex-wrap gap-2">
            <ScopeChip
              label="All"
              active={scope === "all"}
              count={queryActive ? snapshot.total : undefined}
              onClick={() => setScope("all")}
            />
            {chipDivisions.map((division) => {
              const meta = divisionMeta(division);
              return (
                <ScopeChip
                  key={division}
                  label={meta.label}
                  accent={meta.accent}
                  active={scope === division}
                  count={counts[division] || undefined}
                  onClick={() => setScope((prev) => (prev === division ? "all" : division))}
                />
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1 text-[11px] font-semibold">
            {(["relevance", "recent", "urgency"] as SortMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSort(mode)}
                aria-pressed={sort === mode}
                className={cn(
                  "rounded-full px-3 py-1.5 capitalize tracking-tight transition",
                  sort === mode ? "bg-white/90 text-zinc-950" : "text-white/55 hover:text-white/85",
                  FOCUS_RING,
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ---- Error note (calm, anchored, non-blocking) ---- */}
        {errorNote ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-amber-300/25 bg-amber-300/[0.06] px-4 py-3 text-sm text-amber-100/90"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300/80" aria-hidden />
            <span className="flex-1">{errorNote} Showing curated routes meanwhile.</span>
            <button
              type="button"
              onClick={() => void runSearch(snapshot.query, scope)}
              className={cn(
                "rounded-full border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100 transition hover:bg-amber-300/10",
                FOCUS_RING,
              )}
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* ---- Visually hidden live region ---- */}
        <div className="sr-only" role="status" aria-live="polite">
          {a11yStatus}
        </div>

        {/* ---- Results / empty states ---- */}
        <div className="mt-8">
          {flat.length > 0 ? (
            <ul id="hub-search-listbox" role="listbox" aria-label="Search results" className="space-y-12">
              {arranged.sections.map((section) => (
                <li key={section.division ?? "matches"} role="presentation" className="list-none">
                  <SectionHeader
                    label={section.label}
                    count={section.items.length}
                    accent={section.division ? divisionMeta(section.division).accent : undefined}
                  />
                  <ul role="group" aria-label={section.label} className="-mt-px divide-y divide-white/[0.07] border-y border-white/[0.07]">
                    {section.items.map((hit) => {
                      const flatIndex = indexById.get(hit.id) ?? -1;
                      return (
                        <ResultRow
                          key={hit.id}
                          hit={hit}
                          query={snapshot.query}
                          rowId={`hub-search-opt-${flatIndex}`}
                          active={flatIndex === highlight}
                          onActivate={() => navigate(hit)}
                          onHover={() => setHighlight(flatIndex)}
                        />
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          ) : queryActive ? (
            <ZeroState query={snapshot.query} catalog={catalog} onPick={(q) => setInputValue(q)} />
          ) : (
            <EmptyState
              recents={recents}
              onPick={(q) => {
                setInputValue(q);
                inputRef.current?.focus();
              }}
            />
          )}

          {/* Load more (live pages only) */}
          {snapshot.source === "live" && snapshot.nextCursor ? (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.07] disabled:cursor-wait disabled:opacity-60",
                  FOCUS_RING,
                )}
              >
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ArrowRight className="h-4 w-4" aria-hidden />}
                {loadingMore ? "Loading" : "Load more results"}
              </button>
            </div>
          ) : null}
        </div>

        {/* ---- Sign-in nudge (anon) ---- */}
        {!signedIn && signInHref ? (
          <aside className="mt-16 border-l-2 border-[color:var(--accent,#C9A227)]/55 pl-5">
            <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-white/60">
              <Lock className="h-3.5 w-3.5" aria-hidden /> More routes open after sign in
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/68">
              Orders, wallet, invoices, applications, viewings and support live behind your account.
              Sign in to search them and land on the exact destination.
            </p>
            {lockedPreview.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {lockedPreview.slice(0, 5).map((hit) => (
                  <span
                    key={hit.id}
                    className="inline-flex items-center gap-1 rounded-full border border-white/12 px-2.5 py-1 text-[11px] font-medium text-white/72"
                  >
                    <Lock className="h-3 w-3 opacity-60" aria-hidden />
                    {hit.title}
                  </span>
                ))}
              </div>
            ) : null}
            <a
              href={signInHref}
              onClick={() => emitSignal("auth_redirect", snapshot.query, flat.length)}
              className={cn(
                "mt-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--accent,#C9A227)] px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:-translate-y-0.5 hover:brightness-105",
                FOCUS_RING,
              )}
            >
              Sign in and continue search
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------

function ScopeChip({
  label,
  count,
  active,
  accent,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  accent?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold tracking-tight transition",
        FOCUS_RING,
        active
          ? "border-[color:var(--accent,#C9A227)] bg-[color:var(--accent,#C9A227)] text-zinc-950"
          : "border-white/12 bg-white/[0.05] text-white/74 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.09]",
      )}
    >
      {accent ? (
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: active ? "rgba(9,8,7,0.7)" : accent }}
        />
      ) : null}
      <span>{label}</span>
      {typeof count === "number" ? (
        <span className={cn("font-mono text-[10.5px] tracking-tight", active ? "text-zinc-900/70" : "opacity-55")}>
          {count}
        </span>
      ) : null}
    </button>
  );
}

function SectionHeader({ label, count, accent }: { label: string; count: number; accent?: string }) {
  return (
    <header className="mb-3 flex items-baseline gap-4">
      {accent ? (
        <span aria-hidden className="h-2 w-2 shrink-0 self-center rounded-full" style={{ backgroundColor: accent }} />
      ) : null}
      <h2 className="text-[1.18rem] font-semibold tracking-tight text-white">{label}</h2>
      <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
        {count} {count === 1 ? "route" : "routes"}
      </span>
      <span className="h-px flex-1 bg-white/10" />
    </header>
  );
}

function ResultRow({
  hit,
  query,
  rowId,
  active,
  onActivate,
  onHover,
}: {
  hit: SearchHit;
  query: string;
  rowId: string;
  active: boolean;
  onActivate: () => void;
  onHover: () => void;
}) {
  const meta = divisionMeta(hit.division);

  return (
    <li role="presentation" className="list-none">
      <a
        id={rowId}
        role="option"
        aria-selected={active}
        href={hit.url}
        tabIndex={-1}
        onMouseEnter={onHover}
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => {
          // Let normal navigation proceed for modified clicks / new tab; emit
          // telemetry + recents for plain activation.
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          onActivate();
        }}
        className={cn(
          "group grid grid-cols-[auto,1fr,auto] items-start gap-4 py-5 pl-4 pr-3 transition-colors sm:gap-6",
          active ? "bg-white/[0.04]" : "hover:bg-white/[0.025]",
        )}
        style={active ? { boxShadow: `inset 2px 0 0 0 ${meta.accent}` } : undefined}
      >
        <span
          className={cn(
            "mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full border transition",
            active ? "border-white/30" : "border-white/12 group-hover:border-white/25",
          )}
          style={{ color: active ? meta.accentText : undefined }}
        >
          {renderIcon(hit.icon, "h-5 w-5")}
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: meta.accentText }}
            >
              <span className="h-1 w-1 rounded-full" style={{ backgroundColor: meta.accent }} aria-hidden />
              {meta.label}
            </span>
            {hit.badge ? (
              <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-white/70">
                {hit.badge}
              </span>
            ) : null}
            {hit.authRequirement !== "none" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/18 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-white/65">
                <Lock className="h-2.5 w-2.5" aria-hidden /> Sign in
              </span>
            ) : null}
          </div>

          <h3 className="mt-1.5 text-[1.04rem] font-semibold leading-snug tracking-[-0.005em] text-white sm:text-[1.12rem]">
            <HighlightedText text={hit.title} query={query} />
          </h3>

          {hit.description ? (
            <p className="mt-1.5 line-clamp-2 max-w-3xl text-sm leading-relaxed text-white/64">
              {hit.description}
            </p>
          ) : hit.subtitle ? (
            <p className="mt-1.5 text-sm leading-relaxed text-white/64">{hit.subtitle}</p>
          ) : null}

          <p className="mt-2 truncate font-mono text-[11px] tracking-tight text-white/38">
            {displayHost(hit.url)}
          </p>
        </div>

        <ArrowUpRight
          className={cn(
            "mt-2 h-4 w-4 shrink-0 transition",
            active
              ? "-translate-y-0.5 translate-x-0.5 text-white/85"
              : "text-white/30 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white/80",
          )}
          aria-hidden
        />
      </a>
    </li>
  );
}

function EmptyState({ recents, onPick }: { recents: string[]; onPick: (q: string) => void }) {
  return (
    <section className="grid gap-10 lg:grid-cols-[1fr,1px,1fr] lg:gap-12">
      <div>
        <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-white/55">
          <Sparkles className="h-3.5 w-3.5 text-[color:var(--accent,#C9A227)]" aria-hidden /> Start here
        </p>
        <p className="mt-4 text-balance text-[1.5rem] font-semibold leading-[1.15] tracking-[-0.015em] text-white sm:text-[1.85rem]">
          Try a division, a workflow, or what you want to get done.
        </p>
        <p className="mt-4 max-w-xl text-sm leading-7 text-white/68">
          Every Henry Onyx route is one search away — orders, deliveries, viewings, bookings,
          certificates, wallet. Start typing, or pick a prompt.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onPick(prompt)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[12.5px] font-medium text-white/78 transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.09]",
                FOCUS_RING,
              )}
            >
              <Search className="h-3 w-3 opacity-50" aria-hidden />
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div aria-hidden className="hidden bg-white/10 lg:block" />

      <div>
        {recents.length > 0 ? (
          <>
            <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-white/55">
              <Clock className="h-3.5 w-3.5 text-white/45" aria-hidden /> Recent searches
            </p>
            <ul className="mt-4 divide-y divide-white/[0.07] border-y border-white/[0.07]">
              {recents.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => onPick(q)}
                    className={cn(
                      "group flex w-full items-center justify-between gap-3 py-3 text-left text-sm text-white/80 transition hover:text-white",
                      FOCUS_RING,
                    )}
                  >
                    <span className="inline-flex items-center gap-3">
                      <Clock className="h-4 w-4 text-white/35" aria-hidden />
                      {q}
                    </span>
                    <ChevronRight className="h-4 w-4 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/70" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-white/55">
              <Command className="h-3.5 w-3.5 text-white/45" aria-hidden /> Keyboard
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/68">
              <li className="flex items-center justify-between gap-4">
                <span>Focus search</span>
                <kbd className="rounded-md border border-white/15 bg-white/[0.06] px-2 py-0.5 font-mono text-[11px] text-white/70">/</kbd>
              </li>
              <li className="flex items-center justify-between gap-4">
                <span>Move between results</span>
                <kbd className="rounded-md border border-white/15 bg-white/[0.06] px-2 py-0.5 font-mono text-[11px] text-white/70">↑ ↓</kbd>
              </li>
              <li className="flex items-center justify-between gap-4">
                <span>Open the highlighted route</span>
                <kbd className="rounded-md border border-white/15 bg-white/[0.06] px-2 py-0.5 font-mono text-[11px] text-white/70">Enter</kbd>
              </li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function ZeroState({
  query,
  catalog,
  onPick,
}: {
  query: string;
  catalog: SearchHit[];
  onPick: (q: string) => void;
}) {
  const suggestions = useMemo(() => curatedBrowse(catalog, "all", 2).slice(0, 6), [catalog]);
  return (
    <section className="grid gap-10 lg:grid-cols-[1fr,1px,1fr] lg:gap-12">
      <div>
        <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-white/55">
          <Search className="h-3.5 w-3.5 text-[color:var(--accent,#C9A227)]" aria-hidden /> Nothing exact
        </p>
        <p className="mt-4 text-balance text-[1.5rem] font-semibold leading-[1.15] tracking-[-0.015em] text-white sm:text-[1.85rem]">
          No results for <span className="text-[color:var(--accent,#C9A227)]">“{query}”</span>.
        </p>
        <p className="mt-4 max-w-xl text-sm leading-7 text-white/68">
          Try a single keyword — a division name like “marketplace”, an action like “track” or
          “withdraw”, or a help topic like “support”.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.slice(0, 5).map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onPick(prompt)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[12.5px] font-medium text-white/78 transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.09]",
                FOCUS_RING,
              )}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div aria-hidden className="hidden bg-white/10 lg:block" />

      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-white/55">Or jump to a top route</p>
        <ul className="mt-4 divide-y divide-white/[0.07] border-y border-white/[0.07]">
          {suggestions.map((hit) => {
            const meta = divisionMeta(hit.division);
            return (
              <li key={hit.id}>
                <a
                  href={hit.url}
                  className={cn(
                    "group flex items-center gap-3 py-3.5 text-sm text-white/82 transition hover:text-white",
                    FOCUS_RING,
                  )}
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/12"
                    style={{ color: meta.accentText }}
                  >
                    {renderIcon(hit.icon, "h-4 w-4")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-white">{hit.title}</span>
                    <span className="text-[11px] uppercase tracking-[0.18em]" style={{ color: meta.accentText }}>
                      {meta.label}
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-white/30 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white/75" aria-hidden />
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
