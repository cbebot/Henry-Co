"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  type CrossDivisionSearchContext,
  type CrossDivisionSearchIcon,
  type CrossDivisionSearchResult,
  type CrossDivisionSearchSignal,
  buildSearchSignal,
  groupSearchResultsByDivision,
  searchCrossDivisionResults,
} from "@henryco/intelligence";
import {
  ArrowUpRight,
  Bell,
  Briefcase,
  Building2,
  Compass,
  FileText,
  GraduationCap,
  Headphones,
  Layers3,
  LayoutDashboard,
  LifeBuoy,
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
} from "lucide-react";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ComponentType,
} from "react";
import { cn } from "../cn";

/**
 * Cross-division search — premium editorial rewrite.
 *
 * Design language:
 *   - No glass tiles, no panel-on-panel. Editorial typography drives hierarchy.
 *   - Search input lives as a magazine-style line (thick hairline rule, ghosted
 *     placeholder), not inside a heavy card.
 *   - Results render as divided rows under a typographic division header
 *     (kicker + count + hairline rule), not uniform card grids.
 *   - Auth-required hint is a left-rule editorial ribbon, not an amber alert.
 *   - Division navigator pills sit between the input and the results when no
 *     query is active so visitors can jump directly to a section.
 *   - Tokens follow the public-shell convention (`--public-foreground`,
 *     `--public-line`, `--public-accent`) so the same component lands cleanly
 *     across hub, account, staff, and any future caller.
 */

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

const DIVISION_ORDER: ReadonlyArray<string> = [
  "hub",
  "account",
  "marketplace",
  "property",
  "jobs",
  "learn",
  "care",
  "logistics",
  "studio",
  "staff",
];

const DIVISION_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  hub: Compass,
  account: Wallet,
  care: LifeBuoy,
  marketplace: ShoppingBag,
  jobs: Briefcase,
  learn: GraduationCap,
  logistics: Truck,
  property: Building2,
  studio: Palette,
  staff: Users,
};

const ICONS: Record<CrossDivisionSearchIcon, ComponentType<{ className?: string }>> = {
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

type CrossDivisionSearchExperienceProps = {
  context: CrossDivisionSearchContext;
  title: string;
  description: string;
  placeholder: string;
  initialQuery?: string;
  results: CrossDivisionSearchResult[];
  lockedResults?: CrossDivisionSearchResult[];
  signInHref?: string;
  signInLabel?: string;
  onSignal?: (signal: CrossDivisionSearchSignal) => void;
};

function emitSearchSignal(
  signal: CrossDivisionSearchSignal,
  onSignal?: (signal: CrossDivisionSearchSignal) => void,
) {
  onSignal?.(signal);

  if (typeof window !== "undefined") {
    const { query: _query, ...publicDetail } = signal;
    window.dispatchEvent(
      new CustomEvent("henryco:search-signal", {
        detail: publicDetail,
      }),
    );
  }
}

function divisionHeading(result: CrossDivisionSearchResult) {
  return DIVISION_LABELS[result.division] || result.division;
}

function orderedDivisionEntries(grouped: Map<string, CrossDivisionSearchResult[]>) {
  const entries = [...grouped.entries()];
  return entries.sort((left, right) => {
    const li = DIVISION_ORDER.indexOf(left[0]);
    const ri = DIVISION_ORDER.indexOf(right[0]);
    if (li === -1 && ri === -1) return left[0].localeCompare(right[0]);
    if (li === -1) return 1;
    if (ri === -1) return -1;
    return li - ri;
  });
}

function ResultRow({
  result,
  query,
  resultCount,
  context,
  onSignal,
}: {
  result: CrossDivisionSearchResult;
  query: string;
  resultCount: number;
  context: CrossDivisionSearchContext;
  onSignal?: (signal: CrossDivisionSearchSignal) => void;
}) {
  const Icon = ICONS[result.icon] ?? Layers3;
  const signalKind = result.type === "division" ? "division_selected" : "result_clicked";
  const cleanUrl = result.url.replace(/^https?:\/\//i, "");

  return (
    <a
      href={result.url}
      onClick={() =>
        emitSearchSignal(
          buildSearchSignal({
            kind: signalKind,
            query,
            context,
            resultCount,
            result,
          }),
          onSignal,
        )
      }
      className="group grid grid-cols-[auto,1fr,auto] items-start gap-4 py-5 transition hover:bg-[var(--public-foreground,#1c1612)]/[0.025] sm:gap-6 sm:py-6 dark:hover:bg-white/[0.025]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--public-line,rgba(28,22,18,0.12))] bg-transparent text-[var(--public-foreground,#1c1612)]/72 transition group-hover:border-[var(--public-foreground,#1c1612)]/30 dark:border-white/12 dark:text-white/75 dark:group-hover:border-white/35">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--public-foreground,#1c1612)]/55 dark:text-white/50">
            {divisionHeading(result)}
            {result.subtitle ? (
              <>
                <span className="mx-1.5 opacity-40">·</span>
                <span className="font-medium tracking-[0.18em]">{result.subtitle}</span>
              </>
            ) : null}
          </span>
          {result.authRequirement !== "none" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--public-foreground,#1c1612)]/22 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.22em] text-[var(--public-foreground,#1c1612)]/72 dark:border-white/22 dark:text-white/72">
              <Lock className="h-2.5 w-2.5" aria-hidden /> Sign in
            </span>
          ) : null}
          {result.badge ? (
            <span className="rounded-full bg-[var(--public-foreground,#1c1612)]/[0.06] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.22em] text-[var(--public-foreground,#1c1612)]/72 dark:bg-white/[0.07] dark:text-white/72">
              {result.badge}
            </span>
          ) : null}
        </div>
        <h3 className="mt-1.5 text-[1.06rem] font-semibold leading-snug tracking-[-0.005em] text-[var(--public-foreground,#1c1612)] sm:text-[1.16rem] dark:text-white">
          {result.title}
        </h3>
        {result.description ? (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--public-foreground,#1c1612)]/68 dark:text-white/68">
            {result.description}
          </p>
        ) : null}
        <p className="mt-2 truncate font-mono text-[11px] tracking-tight text-[var(--public-foreground,#1c1612)]/45 dark:text-white/45">
          {cleanUrl}
        </p>
      </div>
      <ArrowUpRight
        className="mt-2 h-4 w-4 shrink-0 text-[var(--public-foreground,#1c1612)]/35 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--public-foreground,#1c1612)]/85 dark:text-white/35 dark:group-hover:text-white/85"
        aria-hidden
      />
    </a>
  );
}

function DivisionSection({
  id,
  title,
  count,
  children,
}: {
  id?: string;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <header className="mb-3 flex items-baseline gap-4">
        <h2 className="text-[1.18rem] font-semibold tracking-tight text-[var(--public-foreground,#1c1612)] dark:text-white">
          {title}
        </h2>
        <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--public-foreground,#1c1612)]/55 dark:text-white/50">
          {count} {count === 1 ? "route" : "routes"}
        </span>
        <span className="h-px flex-1 bg-[var(--public-foreground,#1c1612)]/12 dark:bg-white/12" />
      </header>
      <ol className="divide-y divide-[var(--public-foreground,#1c1612)]/10 border-y border-[var(--public-foreground,#1c1612)]/10 dark:divide-white/10 dark:border-white/10">
        {children}
      </ol>
    </section>
  );
}

export function CrossDivisionSearchExperience({
  context,
  title,
  description,
  placeholder,
  initialQuery = "",
  results,
  lockedResults = [],
  signInHref,
  signInLabel = "Sign in to search your HenryCo workflows",
  onSignal,
}: CrossDivisionSearchExperienceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setQuery(initialQuery);
    setSubmittedQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const target = event.target as HTMLElement | null;
        const isTyping =
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable);

        if (!isTyping) {
          event.preventDefault();
          inputRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const rankedVisible = useMemo(
    () => searchCrossDivisionResults(results, deferredQuery, { limit: 18 }),
    [deferredQuery, results],
  );
  const rankedLocked = useMemo(
    () => searchCrossDivisionResults(lockedResults, deferredQuery, { limit: 8 }),
    [deferredQuery, lockedResults],
  );

  const visibleResults = rankedVisible.map((entry) => entry.result);
  const protectedPreviewResults = rankedLocked.map((entry) => entry.result).slice(0, 3);
  const groupedResults = groupSearchResultsByDivision(visibleResults);
  const orderedGroups = orderedDivisionEntries(groupedResults);
  const queryMode = Boolean(deferredQuery.trim());
  const fallbackResults = useMemo(
    () =>
      results
        .filter((result) => result.type.includes("help") || result.division === "hub")
        .sort((left, right) => right.priority - left.priority)
        .slice(0, 5),
    [results],
  );

  const resultCount = visibleResults.length;
  const hiddenProtectedCount = rankedLocked.length;
  const showProtectedHint = Boolean(submittedQuery && hiddenProtectedCount > 0 && signInHref);
  const protectedHintTitle =
    resultCount === 0
      ? "Sign in to search private HenryCo workflows"
      : "More HenryCo routes are available after sign in";
  const protectedHintDescription =
    resultCount === 0
      ? "This query matches account-only routes such as orders, notifications, subscriptions, or support."
      : "This query also matches private account routes — orders, notifications, subscriptions, support. Sign in to land on the exact destination.";

  const statusLabel = queryMode
    ? `${resultCount} ${resultCount === 1 ? "match" : "matches"}`
    : "Top routes across the ecosystem";

  const handleDivisionPill = useCallback((division: string) => {
    if (typeof document === "undefined") return;
    const target = document.getElementById(`division-${division}`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="relative isolate min-h-[calc(100vh-4rem)] bg-[var(--public-background,#fbf8f2)] text-[var(--public-foreground,#1c1612)] dark:bg-[#0a0807] dark:text-[#f5f1eb]">
      {/* Atmospheric brass + ink gradient that stays subtle on light + dark. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(900px_420px_at_18%_-10%,rgba(122,90,35,0.10),transparent_60%),radial-gradient(720px_360px_at_82%_-12%,rgba(45,28,12,0.08),transparent_60%)] dark:bg-[radial-gradient(900px_420px_at_18%_-10%,rgba(214,168,81,0.12),transparent_60%),radial-gradient(720px_360px_at_82%_-12%,rgba(120,70,28,0.12),transparent_60%)]"
      />

      <div className="mx-auto max-w-[88rem] px-5 pb-24 pt-12 sm:px-8 sm:pt-16 lg:px-12">
        {/* Editorial hero — eyebrow + display + restrained body */}
        <header className="max-w-4xl">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--public-foreground,#1c1612)]/55 dark:text-white/45">
            HenryCo Search
          </p>
          <h1 className="mt-4 text-balance text-[2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--public-foreground,#1c1612)] sm:text-[2.55rem] md:text-[3rem] dark:text-white">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-[15px] leading-[1.7] text-[var(--public-foreground,#1c1612)]/72 sm:text-base dark:text-white/72">
            {description}
          </p>
        </header>

        {/* Magazine-style search line — no surrounding card */}
        <form
          className="mt-10"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = query.trim();
            const params = new URLSearchParams();
            if (trimmed) {
              params.set("q", trimmed);
            }
            const nextHref = params.size ? `${pathname}?${params.toString()}` : pathname;

            startTransition(() => {
              router.replace(nextHref, { scroll: false });
            });
            setSubmittedQuery(trimmed);

            emitSearchSignal(
              buildSearchSignal({
                kind: "query_submitted",
                query: trimmed,
                context,
                resultCount,
              }),
              onSignal,
            );

            if (trimmed && resultCount === 0 && hiddenProtectedCount === 0) {
              emitSearchSignal(
                buildSearchSignal({
                  kind: "zero_results",
                  query: trimmed,
                  context,
                  resultCount,
                }),
                onSignal,
              );
            }
          }}
        >
          <label className="sr-only" htmlFor="henryco-cross-search">
            Search HenryCo
          </label>
          <div className="flex items-center gap-3 border-b border-[var(--public-foreground,#1c1612)]/18 pb-4 pt-3 transition focus-within:border-[var(--public-foreground,#1c1612)]/55 sm:gap-4 dark:border-white/18 dark:focus-within:border-white/55">
            <Search
              className="h-5 w-5 shrink-0 text-[var(--public-foreground,#1c1612)]/45 dark:text-white/45 sm:h-6 sm:w-6"
              aria-hidden
            />
            <input
              id="henryco-cross-search"
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              autoComplete="off"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent text-[1.05rem] text-[var(--public-foreground,#1c1612)] outline-none placeholder:text-[var(--public-foreground,#1c1612)]/35 sm:text-[1.2rem] dark:text-white dark:placeholder:text-white/30"
            />
            <kbd
              aria-hidden
              className="hidden shrink-0 items-center gap-1 rounded-md border border-[var(--public-foreground,#1c1612)]/15 bg-[var(--public-foreground,#1c1612)]/[0.04] px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-tight text-[var(--public-foreground,#1c1612)]/55 sm:inline-flex dark:border-white/15 dark:bg-white/[0.06] dark:text-white/55"
            >
              /
            </kbd>
            <button
              type="submit"
              disabled={pending}
              className="ml-1 inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[var(--public-accent,#7a5a23)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--public-accent-strong,#5d4118)] disabled:cursor-wait disabled:opacity-70 dark:bg-[#d6a851] dark:text-zinc-950 dark:hover:bg-[#e3b966]"
            >
              {pending ? "Searching" : "Search"}
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--public-foreground,#1c1612)]/50 dark:text-white/45">
            <span>{statusLabel}</span>
            <span className="hidden sm:inline">
              {queryMode ? (
                <>
                  Query <span className="font-mono normal-case tracking-tight">"{deferredQuery}"</span>
                </>
              ) : (
                <>Press / to focus · Enter to search</>
              )}
            </span>
          </div>
        </form>

        {/* Auth-required hint — editorial left-rule, no amber tile */}
        {showProtectedHint ? (
          <aside className="mt-12 border-l-2 border-[var(--public-accent,#7a5a23)]/55 pl-5 dark:border-[#d6a851]/55">
            <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--public-foreground,#1c1612)]/65 dark:text-white/65">
              <Lock className="h-3.5 w-3.5" aria-hidden /> {protectedHintTitle}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--public-foreground,#1c1612)]/72 dark:text-white/72">
              {protectedHintDescription}
            </p>
            {protectedPreviewResults.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {protectedPreviewResults.map((result) => (
                  <span
                    key={`protected-preview:${result.id}`}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--public-foreground,#1c1612)]/15 px-2.5 py-1 text-[11px] font-medium tracking-tight text-[var(--public-foreground,#1c1612)]/72 dark:border-white/15 dark:text-white/72"
                  >
                    <Lock className="h-3 w-3 opacity-60" aria-hidden />
                    {result.title}
                  </span>
                ))}
              </div>
            ) : null}
            {signInHref ? (
              <a
                href={signInHref}
                onClick={() =>
                  emitSearchSignal(
                    buildSearchSignal({
                      kind: "auth_redirect",
                      query: submittedQuery,
                      context,
                      resultCount,
                    }),
                    onSignal,
                  )
                }
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--public-foreground,#1c1612)] underline-offset-[6px] transition hover:underline dark:text-white"
              >
                {signInLabel}
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </a>
            ) : null}
          </aside>
        ) : null}

        {/* Division navigator — pill row of available divisions, jumps to anchor */}
        {!queryMode && orderedGroups.length > 1 ? (
          <nav aria-label="Browse the HenryCo ecosystem" className="mt-14">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--public-foreground,#1c1612)]/55 dark:text-white/45">
              Browse the ecosystem
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {orderedGroups.map(([division, divisionResults]) => {
                const Icon = DIVISION_ICONS[division] ?? Layers3;
                return (
                  <li key={`pill-${division}`}>
                    <button
                      type="button"
                      onClick={() => handleDivisionPill(division)}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--public-foreground,#1c1612)]/15 bg-transparent px-3.5 py-1.5 text-[12.5px] font-semibold tracking-tight text-[var(--public-foreground,#1c1612)]/82 transition hover:-translate-y-0.5 hover:border-[var(--public-foreground,#1c1612)]/35 hover:bg-[var(--public-foreground,#1c1612)]/[0.03] dark:border-white/15 dark:text-white/82 dark:hover:border-white/40 dark:hover:bg-white/[0.04]"
                    >
                      <Icon className="h-3.5 w-3.5 opacity-70" aria-hidden />
                      <span>{DIVISION_LABELS[division] || division}</span>
                      <span className="font-mono text-[10.5px] tracking-tight opacity-55">
                        {divisionResults.length}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}

        {/* Results — editorial divided rows */}
        {resultCount > 0 ? (
          <div className="mt-12 space-y-12">
            {queryMode ? (
              <DivisionSection title="Top matches" count={resultCount}>
                {visibleResults.map((result) => (
                  <li key={result.id}>
                    <ResultRow
                      result={result}
                      query={deferredQuery}
                      resultCount={resultCount}
                      context={context}
                      onSignal={onSignal}
                    />
                  </li>
                ))}
              </DivisionSection>
            ) : (
              orderedGroups.map(([division, divisionResults]) => (
                <DivisionSection
                  key={division}
                  id={`division-${division}`}
                  title={DIVISION_LABELS[division] || division}
                  count={divisionResults.length}
                >
                  {divisionResults.map((result) => (
                    <li key={result.id}>
                      <ResultRow
                        result={result}
                        query={deferredQuery}
                        resultCount={resultCount}
                        context={context}
                        onSignal={onSignal}
                      />
                    </li>
                  ))}
                </DivisionSection>
              ))
            )}
          </div>
        ) : (
          <section className="mt-16 grid gap-12 lg:grid-cols-[1.05fr,0.95fr]">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--public-foreground,#1c1612)]/55 dark:text-white/45">
                {deferredQuery.trim() ? "Nothing exact yet" : "Start here"}
              </p>
              <p className="mt-4 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--public-foreground,#1c1612)] sm:text-[1.95rem] dark:text-white">
                {deferredQuery.trim()
                  ? "We didn't find an exact route — try a division name, workflow, or support intent."
                  : "Browse the strongest entry points across HenryCo."}
              </p>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--public-foreground,#1c1612)]/72 dark:text-white/72">
                Notifications, wallet, marketplace orders, jobs help, logistics tracking, property
                viewings — every one is one route away. These are the most-used entry points right
                now.
              </p>
            </div>
            <ol className="divide-y divide-[var(--public-foreground,#1c1612)]/10 border-y border-[var(--public-foreground,#1c1612)]/10 dark:divide-white/10 dark:border-white/10">
              {fallbackResults.map((result) => {
                const Icon = ICONS[result.icon] ?? Layers3;
                return (
                  <li key={result.id}>
                    <a
                      href={result.url}
                      onClick={() =>
                        emitSearchSignal(
                          buildSearchSignal({
                            kind: "fallback_clicked",
                            query: deferredQuery,
                            context,
                            resultCount,
                            result,
                          }),
                          onSignal,
                        )
                      }
                      className="group grid grid-cols-[auto,1fr,auto] items-start gap-4 py-5 transition hover:bg-[var(--public-foreground,#1c1612)]/[0.025] sm:py-6 dark:hover:bg-white/[0.025]"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--public-foreground,#1c1612)]/12 text-[var(--public-foreground,#1c1612)]/72 transition group-hover:border-[var(--public-foreground,#1c1612)]/30 dark:border-white/12 dark:text-white/75 dark:group-hover:border-white/35">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--public-foreground,#1c1612)]/55 dark:text-white/50">
                          {DIVISION_LABELS[result.division] || result.division}
                        </p>
                        <h3 className="mt-1.5 text-[1rem] font-semibold leading-snug tracking-[-0.005em] text-[var(--public-foreground,#1c1612)] dark:text-white">
                          {result.title}
                        </h3>
                        {result.description ? (
                          <p className="mt-1.5 text-sm leading-relaxed text-[var(--public-foreground,#1c1612)]/68 dark:text-white/68">
                            {result.description}
                          </p>
                        ) : null}
                      </div>
                      <ArrowUpRight
                        className="mt-2 h-4 w-4 shrink-0 text-[var(--public-foreground,#1c1612)]/35 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--public-foreground,#1c1612)]/85 dark:text-white/35 dark:group-hover:text-white/85"
                        aria-hidden
                      />
                    </a>
                  </li>
                );
              })}
            </ol>
          </section>
        )}
      </div>
    </div>
  );
}

export function HenryCoSearchBreadcrumb({
  href,
  label = "Search HenryCo",
  className,
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[var(--public-foreground,#1c1612)]/15 bg-transparent px-3.5 py-1.5 text-xs font-semibold tracking-tight text-[var(--public-foreground,#1c1612)]/82 transition hover:border-[var(--public-foreground,#1c1612)]/35 hover:bg-[var(--public-foreground,#1c1612)]/[0.03] dark:border-white/15 dark:text-white/82 dark:hover:border-white/40 dark:hover:bg-white/[0.04]",
        className,
      )}
    >
      <Search className="h-3.5 w-3.5 opacity-70" aria-hidden />
      <span>{label}</span>
      <kbd
        aria-hidden
        className="ml-0.5 rounded border border-[var(--public-foreground,#1c1612)]/15 bg-[var(--public-foreground,#1c1612)]/[0.03] px-1 py-0 font-mono text-[10px] tracking-tight text-[var(--public-foreground,#1c1612)]/55 dark:border-white/15 dark:bg-white/[0.05] dark:text-white/55"
      >
        /
      </kbd>
    </Link>
  );
}
