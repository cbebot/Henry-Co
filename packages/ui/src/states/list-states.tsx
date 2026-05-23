"use client";

/**
 * V3-05 (S4) — Four-state distinction for list / collection surfaces.
 *
 * Owner anti-pattern: lists that conflate "loading", "you have nothing
 * yet", "no matches for your filter", and "the fetch errored" into a
 * single ambiguous empty surface. The cure is FOUR explicit branches
 * with semantically distinct copy + CTA + a11y posture.
 *
 *   1. Loading        — fetch in flight. Render shaped skeleton, no
 *                       warmup copy. Component prefers StructuredSkeleton
 *                       (`@henryco/ui/loading`) but the caller may pass
 *                       a custom skeleton via `loadingSlot`.
 *   2. EmptyYet       — fetch succeeded with zero results AND the user
 *                       has nothing in the collection yet. Render
 *                       "Nothing here yet" + a "create / add first item"
 *                       CTA. This is the FIRST-TIME state.
 *   3. EmptyNoMatch   — fetch succeeded with zero results but the user
 *                       has filters / a search query applied. Render
 *                       "No matches" + a "reset filters" CTA.
 *   4. Error          — fetch failed. Render "Something went wrong" +
 *                       a "try again" CTA wired to the onRetry callback.
 *
 * The component is render-prop friendly — caller passes the data /
 * filter / fetch-error states and the matching CTA labels; the
 * primitive picks the correct branch and announces the state to
 * assistive tech via `aria-live="polite"`.
 *
 * No "Loading X" / "Preparing X" / "Warming up" / "Just a moment"
 * copy is rendered. Loading is signified by SHAPE, not by language.
 */

import type { ReactNode } from "react";
import { StructuredSkeleton, type StructuredSkeletonVariant } from "../loading/structured-skeleton";
import { cn } from "../lib/cn";

export type ListStateKind =
  | "loading"
  | "empty-yet"
  | "empty-no-match"
  | "error";

export interface ListStatesProps {
  /** Which branch to render. Compute from your data/error/filter state in the caller. */
  state: ListStateKind;
  /**
   * When `state` is anything other than "loading", these children render
   * as the loaded content. Allows the primitive to wrap the list directly:
   *   <ListStates state={kind}>{rows}</ListStates>
   */
  children?: ReactNode;
  /** Surface id for skeleton telemetry — `marketplace.product-list`, etc. */
  surface?: string;
  /** Override the skeleton variant. Defaults to "card-list". */
  loadingVariant?: StructuredSkeletonVariant;
  /** Override the default skeleton with a custom node. */
  loadingSlot?: ReactNode;
  /** Copy + CTA for the empty-yet branch. */
  emptyYet?: {
    title?: string;
    body?: string;
    ctaLabel?: string;
    onCta?: () => void;
    ctaHref?: string;
  };
  /** Copy + CTA for the empty-no-match branch. */
  emptyNoMatch?: {
    title?: string;
    body?: string;
    ctaLabel?: string;
    onCta?: () => void;
  };
  /** Copy + CTA for the error branch. */
  error?: {
    title?: string;
    body?: string;
    retryLabel?: string;
    onRetry?: () => void;
  };
  className?: string;
}

const DEFAULTS = {
  emptyYet: {
    title: "Nothing here yet",
    body: "Add your first item to get started.",
    ctaLabel: "Add the first item",
  },
  emptyNoMatch: {
    title: "No matches",
    body: "No results for the current filters. Try clearing one or two.",
    ctaLabel: "Reset filters",
  },
  error: {
    title: "Something went wrong",
    body: "We could not load this list. The retry below tries again without losing your filters.",
    retryLabel: "Try again",
  },
};

function StateShell({
  title,
  body,
  cta,
  variant,
  className,
}: {
  title: string;
  body: string;
  cta?: ReactNode;
  variant: "empty-yet" | "empty-no-match" | "error";
  className?: string;
}) {
  const surface =
    variant === "error"
      ? "border-rose-500/24 bg-rose-500/[0.06] text-rose-100"
      : variant === "empty-no-match"
        ? "border-white/12 bg-white/[0.04] text-white/80"
        : "border-white/12 bg-white/[0.06] text-white/80";
  return (
    <section
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      data-state={variant}
      className={cn(
        "rounded-2xl border px-5 py-6 sm:px-7 sm:py-7",
        surface,
        className,
      )}
    >
      <p className="text-base font-semibold tracking-tight sm:text-lg">{title}</p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed opacity-80">{body}</p>
      {cta ? <div className="mt-4">{cta}</div> : null}
    </section>
  );
}

export function ListStates({
  state,
  children,
  surface,
  loadingVariant = "card-list",
  loadingSlot,
  emptyYet,
  emptyNoMatch,
  error,
  className,
}: ListStatesProps) {
  if (state === "loading") {
    return (
      <div className={className} data-state="loading">
        {loadingSlot ?? (
          <StructuredSkeleton
            variant={loadingVariant}
            surface={surface}
            bare
          />
        )}
      </div>
    );
  }
  if (state === "empty-yet") {
    const c = { ...DEFAULTS.emptyYet, ...emptyYet };
    return (
      <StateShell
        title={c.title}
        body={c.body}
        variant="empty-yet"
        className={className}
        cta={
          c.ctaHref ? (
            <a
              href={c.ctaHref}
              className="inline-flex items-center rounded-full border border-white/16 bg-white/[0.06] px-4 py-2 text-sm font-semibold"
            >
              {c.ctaLabel}
            </a>
          ) : c.onCta ? (
            <button
              type="button"
              onClick={c.onCta}
              className="inline-flex items-center rounded-full border border-white/16 bg-white/[0.06] px-4 py-2 text-sm font-semibold"
            >
              {c.ctaLabel}
            </button>
          ) : null
        }
      />
    );
  }
  if (state === "empty-no-match") {
    const c = { ...DEFAULTS.emptyNoMatch, ...emptyNoMatch };
    return (
      <StateShell
        title={c.title}
        body={c.body}
        variant="empty-no-match"
        className={className}
        cta={
          c.onCta ? (
            <button
              type="button"
              onClick={c.onCta}
              className="inline-flex items-center rounded-full border border-white/16 bg-white/[0.06] px-4 py-2 text-sm font-semibold"
            >
              {c.ctaLabel}
            </button>
          ) : null
        }
      />
    );
  }
  if (state === "error") {
    const c = { ...DEFAULTS.error, ...error };
    return (
      <StateShell
        title={c.title}
        body={c.body}
        variant="error"
        className={className}
        cta={
          c.onRetry ? (
            <button
              type="button"
              onClick={c.onRetry}
              className="inline-flex items-center rounded-full border border-rose-200/40 bg-rose-200/[0.08] px-4 py-2 text-sm font-semibold text-rose-50"
            >
              {c.retryLabel}
            </button>
          ) : null
        }
      />
    );
  }
  return <div className={className}>{children}</div>;
}
