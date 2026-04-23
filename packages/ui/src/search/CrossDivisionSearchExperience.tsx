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
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ComponentType,
} from "react";
import { cn } from "../cn";

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
  onSignal?: (signal: CrossDivisionSearchSignal) => void
) {
  onSignal?.(signal);

  if (typeof window !== "undefined") {
    const { query: _query, ...publicDetail } = signal;
    window.dispatchEvent(
      new CustomEvent("henryco:search-signal", {
        detail: publicDetail,
      })
    );
  }
}

function divisionHeading(result: CrossDivisionSearchResult) {
  return DIVISION_LABELS[result.division] || result.division;
}

function ResultCard({
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
          onSignal
        )
      }
      className="group flex rounded-[1.6rem] border border-black/8 bg-white/92 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-black/12 hover:shadow-[0_22px_60px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/16"
    >
      <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black/[0.04] text-zinc-700 dark:bg-white/[0.06] dark:text-white/88">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-zinc-950 dark:text-white">{result.title}</p>
          {result.badge ? (
            <span className="rounded-full border border-black/10 bg-black/[0.035] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-zinc-600 dark:border-white/12 dark:bg-white/[0.05] dark:text-white/70">
              {result.badge}
            </span>
          ) : null}
          {result.authRequirement !== "none" ? (
            <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-200">
              Sign in
            </span>
          ) : null}
        </div>
        {result.subtitle ? (
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-white/42">
            {result.subtitle}
          </p>
        ) : null}
        {result.description ? (
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-white/68">
            {result.description}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-white/42">
          <span>{divisionHeading(result)}</span>
          <span className="h-1 w-1 rounded-full bg-current/40" />
          <span className="truncate">{result.url.replace(/^https?:\/\//i, "")}</span>
        </div>
      </div>
    </a>
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
          (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

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
    [deferredQuery, results]
  );
  const rankedLocked = useMemo(
    () => searchCrossDivisionResults(lockedResults, deferredQuery, { limit: 8 }),
    [deferredQuery, lockedResults]
  );

  const visibleResults = rankedVisible.map((entry) => entry.result);
  const groupedResults = groupSearchResultsByDivision(visibleResults);
  const fallbackResults = useMemo(
    () =>
      results
        .filter((result) => result.type.includes("help") || result.division === "hub")
        .sort((left, right) => right.priority - left.priority)
        .slice(0, 4),
    [results]
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
      : "This query also matches private account routes such as orders, notifications, subscriptions, or support. Sign in to continue on the exact destination.";

  const statusLabel = query.trim()
    ? `${resultCount} ${resultCount === 1 ? "result" : "results"}`
    : "Top routes and workflows";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] px-4 py-6 dark:bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.14),transparent_26%),linear-gradient(180deg,#071019,#04070d)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-black/8 bg-white/88 p-5 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-white/42">
                HenryCo Search
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
                {title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-white/68">
                {description}
              </p>
            </div>
            <div className="rounded-full border border-black/8 bg-black/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600 dark:border-white/12 dark:bg-white/[0.05] dark:text-white/60">
              {statusLabel}
            </div>
          </div>

          <form
            className="mt-6"
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
                onSignal
              );

              if (trimmed && resultCount === 0 && hiddenProtectedCount === 0) {
                emitSearchSignal(
                  buildSearchSignal({
                    kind: "zero_results",
                    query: trimmed,
                    context,
                    resultCount,
                  }),
                  onSignal
                );
              }
            }}
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400 dark:text-white/38" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={placeholder}
                  className="h-14 w-full rounded-[1.4rem] border border-black/10 bg-white pl-12 pr-4 text-sm text-zinc-950 outline-none transition focus:border-amber-500/55 focus:ring-2 focus:ring-amber-500/15 dark:border-white/10 dark:bg-black/20 dark:text-white dark:placeholder:text-white/28"
                />
              </label>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-14 shrink-0 items-center justify-center rounded-[1.4rem] bg-amber-500 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:cursor-wait disabled:opacity-70"
              >
                {pending ? "Updating..." : "Search HenryCo"}
              </button>
            </div>
          </form>

          {showProtectedHint ? (
            <div className="mt-5 rounded-[1.6rem] border border-amber-500/20 bg-amber-500/8 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                    {protectedHintTitle}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-white/66">
                    {protectedHintDescription}
                  </p>
                </div>
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
                      onSignal
                    )
                  }
                  className="inline-flex shrink-0 items-center justify-center rounded-full border border-amber-500/20 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-50 dark:border-amber-400/20 dark:bg-black/20 dark:text-white dark:hover:bg-black/30"
                >
                  {signInLabel}
                </a>
              </div>
            </div>
          ) : null}
        </div>

        {resultCount > 0 ? (
          <div className="mt-6 space-y-6">
            {[...groupedResults.entries()].map(([division, divisionResults]) => (
              <section key={division}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-white/40">
                    {DIVISION_LABELS[division] || division}
                  </span>
                  <span className="h-px flex-1 bg-black/8 dark:bg-white/10" />
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {divisionResults.map((result) => (
                    <ResultCard
                      key={result.id}
                      result={result}
                      query={deferredQuery}
                      resultCount={resultCount}
                      context={context}
                      onSignal={onSignal}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[2rem] border border-black/8 bg-white/88 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-lg font-semibold text-zinc-950 dark:text-white">
              {deferredQuery.trim() ? "No exact route found yet." : "Start with the highest-value routes."}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-white/66">
              {deferredQuery.trim()
                ? "Try a division name, workflow, or support intent like notifications, wallet, logistics tracking, support, jobs applications, or property viewings."
                : "These are the strongest current entry points across HenryCo. Use search to jump directly to a route or help surface."}
            </p>
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {fallbackResults.map((result) => (
                <a
                  key={result.id}
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
                      onSignal
                    )
                  }
                  className="rounded-[1.4rem] border border-black/8 bg-black/[0.02] px-4 py-3 text-left transition hover:border-black/12 hover:bg-black/[0.035] dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
                >
                  <p className="text-sm font-semibold text-zinc-950 dark:text-white">{result.title}</p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-white/66">{result.description}</p>
                </a>
              ))}
            </div>
          </div>
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
        "inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/90 px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/82 dark:hover:bg-white/[0.1]",
        className
      )}
    >
      <Search className="h-4 w-4" />
      {label}
    </Link>
  );
}
