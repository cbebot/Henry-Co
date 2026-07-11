import { AlertOctagon, CloudOff, ShieldCheck, TrendingDown } from "lucide-react";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";

import MetricCard from "@/components/owner/MetricCard";
import { OwnerPanel, OwnerNotice } from "@/components/owner/OwnerPrimitives";
import type { ObservabilityMetrics } from "@/lib/owner-observability";

/**
 * V3-10 S9 + A10 — owner observability tile.
 *
 * Renders the V3-10 baseline observability rollup on the owner
 * command-center dashboard.
 *
 * Two headline metrics + two ranked lists:
 *   1. Error events (24h)            — count of `*.failed` outcomes
 *   2. Degraded side effects (24h)   — count of `*_fallback` events
 *   3. Top failing event names       — ranked top 5
 *   4. Top degraded services         — ranked top 5
 *
 * Empty state: when no events have been observed yet, the tile renders
 * an OwnerNotice explaining the data source so the owner doesn't read
 * the zeros as "all clear" or "broken" — the panel is intentionally
 * non-alarming until the first event arrives.
 *
 * V3-89 (observability depth) extends this tile with:
 *   - p95/p99 latency per route (requires APM trace data — not in
 *     henry_events today)
 *   - Error rate per division (requires the breakdown query)
 *   - SLO-bucketed gauges
 *
 * Strings: per A10, all copy passes through `translateSurfaceLabel`
 * (Pattern B — runtime DeepL fallback). Surface namespace label
 * targeted: `surface:owner-observability`.
 */
type ObservabilityTileProps = {
  metrics: ObservabilityMetrics;
  /** Resolved AppLocale; the tile uses runtime DeepL (Pattern B) for translations. */
  locale: AppLocale;
};

export default function ObservabilityTile({
  metrics,
  locale,
}: ObservabilityTileProps) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const allClear =
    !metrics.isEmptyState &&
    metrics.errorEvents24h === 0 &&
    metrics.degradedSideEffects24h === 0;

  return (
    <OwnerPanel
      title={t("Platform observability")}
      description={t(
        "V3-10 baseline — error events and degraded side effects from the henry_events sink (last 24h).",
      )}
    >
      {metrics.isEmptyState ? (
        <OwnerNotice
          tone="info"
          title={t("Awaiting first events")}
          body={t(
            "No error or degraded-side-effect events have been observed in the last 24 hours. Metrics populate once routes emit typed events via @henryco/observability/events.",
          )}
        />
      ) : allClear ? (
        <OwnerNotice
          tone="info"
          title={t("No errors in the last 24 hours")}
          body={t(
            "Routes emitting typed events report zero failures and zero degraded side effects. Sentry remains the source of truth for unhandled exceptions; this panel tracks intentional emissions.",
          )}
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard
          icon={metrics.errorEvents24h > 0 ? AlertOctagon : ShieldCheck}
          label={t("Error events (24h)")}
          value={metrics.errorEvents24h}
          subtitle={t("Events with outcome=failed in the last 24h")}
          color={
            metrics.errorEvents24h > 0
              ? "var(--acct-red)"
              : "var(--owner-accent)"
          }
        />
        <MetricCard
          icon={metrics.degradedSideEffects24h > 0 ? CloudOff : ShieldCheck}
          label={t("Degraded side effects (24h)")}
          value={metrics.degradedSideEffects24h}
          subtitle={t("Fallback events: external service unavailable, retried, or skipped")}
          color={
            metrics.degradedSideEffects24h > 0
              ? "var(--acct-orange)"
              : "var(--owner-accent)"
          }
        />
      </div>

      {metrics.topErrorEvents.length > 0 || metrics.topDegradedServices.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {metrics.topErrorEvents.length > 0 ? (
            <div className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--acct-muted)]">
                <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                {t("Top failing events")}
              </div>
              <ul className="space-y-1.5 text-sm">
                {metrics.topErrorEvents.map((row) => (
                  <li key={row.name} className="flex items-center justify-between gap-3">
                    <span className="truncate font-mono text-xs text-[var(--acct-ink)]">
                      {row.name}
                    </span>
                    <span className="text-xs font-semibold text-[var(--acct-muted)]">
                      {row.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {metrics.topDegradedServices.length > 0 ? (
            <div className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--acct-muted)]">
                <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />
                {t("Top degraded services")}
              </div>
              <ul className="space-y-1.5 text-sm">
                {metrics.topDegradedServices.map((row) => (
                  <li key={row.service} className="flex items-center justify-between gap-3">
                    <span className="truncate font-mono text-xs text-[var(--acct-ink)]">
                      {row.service}
                    </span>
                    <span className="text-xs font-semibold text-[var(--acct-muted)]">
                      {row.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </OwnerPanel>
  );
}
