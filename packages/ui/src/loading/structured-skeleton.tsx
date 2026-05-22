"use client";

/**
 * V3-05 (S3 + S7) — StructuredSkeleton primitive.
 *
 * The owner-named anti-pattern is "Loading X" / "Preparing X" theater copy
 * that fakes activity while real content is fetched. The cure is a
 * STRUCTURED placeholder that mirrors the layout the real data will fill
 * (rectangles where text goes, soft cards where cards go), so the user
 * sees the page's shape instantly and never reads warmup language.
 *
 * Variants:
 *   - "card-list"  — vertical stack of card-shaped rows (lists, search results)
 *   - "form"       — label + input rows (forms, settings panels)
 *   - "detail"     — hero stack + body lines (detail pages, articles)
 *   - "kpi-tile"   — small KPI tile (dashboard tiles, status bars)
 *
 * Behaviour:
 *   - Pure CSS shimmer; respects `prefers-reduced-motion` (collapses to a
 *     static muted surface — no animation).
 *   - After `thresholdMs` (default 3000) the skeleton announces "Still
 *     loading — this is unusual" via an ARIA live region and renders an
 *     optional retry slot. Strings flow through `translateSurfaceLabel`
 *     under the `surface:loading` namespace.
 *   - When telemetry hooks are wired, emits `henry.ui.skeleton.shown`
 *     on mount + `henry.ui.skeleton.exceeded_threshold` after threshold.
 *     The emitter is lazy-imported so the UI package keeps zero hard
 *     dep on `@henryco/observability` at build time.
 *
 * Inheritance:
 *   - Extends — does not replace — PERF-01's `PublicRouteLoader` (thin
 *     route progress bar). PublicRouteLoader stays the canonical full-
 *     route loader. StructuredSkeleton is the in-page in-flight primitive
 *     for Suspense fallbacks, list-fetch wrappers, and any surface where
 *     a content-shape skeleton beats a thin top bar.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";

export type StructuredSkeletonVariant =
  | "card-list"
  | "form"
  | "detail"
  | "kpi-tile";

export type StructuredSkeletonTone = "onDark" | "onLight";

export interface StructuredSkeletonProps {
  variant?: StructuredSkeletonVariant;
  /** Surface id for telemetry — `marketplace.product-list`, `care.bookings`, etc. */
  surface?: string;
  /** Override count of repeated rows / tiles (variant-dependent). */
  count?: number;
  /** Lock to a tone; defaults to "onDark" to match the platform dark surfaces. */
  tone?: StructuredSkeletonTone;
  /** Override the slow-threshold prompt at which we surface "still loading". */
  thresholdMs?: number;
  /** Render in the slot when the threshold trips (e.g. retry button). */
  thresholdSlot?: ReactNode;
  /** Optional className for the outer wrapper. */
  className?: string;
  /**
   * When emitted by a top-level <Suspense> boundary the skeleton sits
   * INSIDE the host shell and should not paint its own outer paddings.
   * Set `bare` to true to disable the outer container padding.
   */
  bare?: boolean;
}

const DEFAULT_THRESHOLD_MS = 3000;

/**
 * Lazy telemetry shim. Avoids a hard dep on `@henryco/observability` from
 * the UI package — when the host app has it installed, the import
 * resolves and the event flows; when not, we silently no-op.
 */
async function emitSkeletonEvent(
  name: "henry.ui.skeleton.shown" | "henry.ui.skeleton.exceeded_threshold",
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const mod = (await import(
      /* webpackIgnore: true */ "@henryco/observability"
    )) as
      | {
          emitEvent?: (params: {
            name: string;
            classification: string;
            outcome: string;
            payload?: Record<string, unknown>;
          }) => void;
        }
      | undefined;
    if (mod && typeof mod.emitEvent === "function") {
      // Names are registered in `packages/observability/src/events.ts`
      // (HenryEventName union); the local emitter type here is loose
      // because we lazy-import to avoid a hard observability dep.
      mod.emitEvent({
        name,
        classification: "system_state",
        outcome: name.endsWith("exceeded_threshold") ? "blocked" : "started",
        payload,
      });
    }
  } catch {
    // Observability not installed in this surface — silent fallback.
  }
}

/**
 * Resolve loading strings via the global `translateSurfaceLabel` when
 * the host app has the i18n package installed. We don't make it a hard
 * dep — UI package consumers without i18n still get English copy.
 */
function useThresholdCopy(): {
  stillLoading: string;
  unusualHelper: string;
} {
  const [copy, setCopy] = useState({
    stillLoading: "Still loading",
    unusualHelper: "This is taking longer than usual.",
  });
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const i18n = (await import(
          /* webpackIgnore: true */ "@henryco/i18n"
        )) as
          | {
              translateSurfaceLabel?: (
                locale: string,
                label: string,
              ) => string;
            }
          | undefined;
        if (cancelled || !i18n?.translateSurfaceLabel) return;
        const locale =
          (typeof document !== "undefined"
            && document.documentElement.lang)
          || "en";
        setCopy({
          stillLoading: i18n.translateSurfaceLabel(locale, "Still loading"),
          unusualHelper: i18n.translateSurfaceLabel(
            locale,
            "This is taking longer than usual.",
          ),
        });
      } catch {
        // i18n not installed — keep English fallback.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return copy;
}

/**
 * Shared shimmer block. Uses Tailwind `animate-pulse` for the standard
 * case + `motion-reduce:animate-none` for accessibility. No spinners,
 * no text — just shape.
 */
function Block({
  className,
  tone,
}: {
  className?: string;
  tone: StructuredSkeletonTone;
}) {
  const surface =
    tone === "onLight"
      ? "bg-zinc-900/[0.07]"
      : "bg-white/[0.07]";
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-md motion-reduce:animate-none",
        surface,
        className,
      )}
    />
  );
}

function CardListVariant({
  count,
  tone,
}: {
  count: number;
  tone: StructuredSkeletonTone;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-2xl border p-4 sm:p-5",
            tone === "onLight"
              ? "border-zinc-900/10 bg-zinc-900/[0.03]"
              : "border-white/10 bg-white/[0.04]",
          )}
        >
          <div className="flex items-center gap-4">
            <Block tone={tone} className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Block tone={tone} className="h-4 w-1/2" />
              <Block tone={tone} className="h-3 w-2/3" />
            </div>
            <Block tone={tone} className="hidden h-8 w-24 sm:block" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FormVariant({
  count,
  tone,
}: {
  count: number;
  tone: StructuredSkeletonTone;
}) {
  return (
    <div className="space-y-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Block tone={tone} className="h-3 w-32" />
          <Block tone={tone} className="h-10 w-full rounded-xl" />
        </div>
      ))}
      <div className="flex gap-3 pt-3">
        <Block tone={tone} className="h-10 w-32 rounded-xl" />
        <Block tone={tone} className="h-10 w-24 rounded-xl" />
      </div>
    </div>
  );
}

function DetailVariant({
  tone,
}: {
  tone: StructuredSkeletonTone;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Block tone={tone} className="h-3 w-28" />
        <Block tone={tone} className="h-10 w-3/4 max-w-2xl" />
        <Block tone={tone} className="h-6 w-2/3 max-w-xl" />
      </div>
      <div className="space-y-2">
        <Block tone={tone} className="h-3 w-full" />
        <Block tone={tone} className="h-3 w-[92%]" />
        <Block tone={tone} className="h-3 w-[80%]" />
        <Block tone={tone} className="h-3 w-[70%]" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Block tone={tone} className="h-24 rounded-xl" />
        <Block tone={tone} className="h-24 rounded-xl" />
      </div>
    </div>
  );
}

function KpiTileVariant({
  count,
  tone,
}: {
  count: number;
  tone: StructuredSkeletonTone;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-2xl border p-4",
            tone === "onLight"
              ? "border-zinc-900/10 bg-zinc-900/[0.03]"
              : "border-white/10 bg-white/[0.04]",
          )}
        >
          <Block tone={tone} className="h-3 w-20" />
          <Block tone={tone} className="mt-3 h-8 w-24" />
          <Block tone={tone} className="mt-2 h-2 w-16" />
        </div>
      ))}
    </div>
  );
}

export function StructuredSkeleton({
  variant = "card-list",
  surface,
  count,
  tone = "onDark",
  thresholdMs = DEFAULT_THRESHOLD_MS,
  thresholdSlot,
  className,
  bare = false,
}: StructuredSkeletonProps) {
  const [exceeded, setExceeded] = useState(false);
  const copy = useThresholdCopy();
  const mountedAtRef = useRef<number>(0);

  useEffect(() => {
    mountedAtRef.current = Date.now();
    void emitSkeletonEvent("henry.ui.skeleton.shown", {
      surface: surface ?? "unknown",
      variant,
    });
    const timer = window.setTimeout(() => {
      setExceeded(true);
      void emitSkeletonEvent("henry.ui.skeleton.exceeded_threshold", {
        surface: surface ?? "unknown",
        variant,
        duration: Date.now() - (mountedAtRef.current || Date.now()),
      });
    }, thresholdMs);
    return () => {
      window.clearTimeout(timer);
    };
    // Surface/variant/threshold are static for a single skeleton mount —
    // re-firing on prop change would spam telemetry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolvedCount =
    count
    ?? (variant === "card-list"
      ? 4
      : variant === "form"
        ? 4
        : variant === "kpi-tile"
          ? 4
          : 0);

  const body =
    variant === "card-list" ? (
      <CardListVariant count={resolvedCount} tone={tone} />
    ) : variant === "form" ? (
      <FormVariant count={resolvedCount} tone={tone} />
    ) : variant === "kpi-tile" ? (
      <KpiTileVariant count={resolvedCount} tone={tone} />
    ) : (
      <DetailVariant tone={tone} />
    );

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      data-surface={surface}
      data-variant={variant}
      className={cn(
        bare ? "" : "w-full",
        className,
      )}
    >
      {body}
      {exceeded ? (
        <div
          className={cn(
            "mt-4 rounded-xl border px-4 py-3 text-sm",
            tone === "onLight"
              ? "border-zinc-900/12 bg-zinc-900/[0.04] text-zinc-700"
              : "border-white/12 bg-white/[0.05] text-white/72",
          )}
        >
          <p className="font-medium">{copy.stillLoading}</p>
          <p className="mt-1 opacity-72">{copy.unusualHelper}</p>
          {thresholdSlot ? <div className="mt-3">{thresholdSlot}</div> : null}
        </div>
      ) : null}
      <span className="sr-only">Loading content.</span>
    </div>
  );
}
