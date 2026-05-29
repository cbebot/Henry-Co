import { Activity, Link2, ShieldCheck, Unlink } from "lucide-react";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";

import MetricCard from "@/components/owner/MetricCard";
import { OwnerPanel, OwnerNotice } from "@/components/owner/OwnerPrimitives";
import { timeAgo } from "@/lib/format";
import type { DeepLinkHealthMetrics } from "@/lib/owner-deeplink-health";

/**
 * V3-04 (S7) — owner deep-link health tile.
 *
 * Renders the S8 deep-link telemetry rollup on the owner command-center
 * dashboard:
 *   1. Dead links (24h)            — attributed/internal links that 404'd
 *   2. Attributed arrivals (24h)   — deep links that landed
 *   3. Top broken targets          — ranked by hit count (triage list)
 *   4. Arrivals by outcome         — resolved vs signed-in-first vs 404
 *
 * Empty state: when no deep-link events have been observed yet, the tile
 * renders an OwnerNotice explaining the data source so the owner doesn't
 * read the zeros as "all clear" before any links have been clicked.
 *
 * Strings pass through `translateSurfaceLabel` (Pattern B — runtime DeepL),
 * matching the sibling observability tile. Raw target paths + outcome codes
 * render as data (font-mono), not translatable copy.
 */
type DeepLinkHealthTileProps = {
  metrics: DeepLinkHealthMetrics;
  /** Resolved AppLocale; the tile uses runtime DeepL (Pattern B). */
  locale: AppLocale;
};

export default function DeepLinkHealthTile({
  metrics,
  locale,
}: DeepLinkHealthTileProps) {
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const outcomeLabel = (outcome: string): string => {
    switch (outcome) {
      case "ok":
        return t("Resolved");
      case "auth_gated":
        return t("Signed in first");
      case "not_found":
        return t("Not found");
      default:
        return outcome;
    }
  };

  const noBrokenLinks = !metrics.isEmptyState && metrics.deadLinks24h === 0;

  return (
    <OwnerPanel
      title={t("Deep-link health")}
      description={t(
        "V3-04 — attributed deep-link arrivals and broken links from the henry_events sink (last 24h).",
      )}
    >
      {metrics.isEmptyState ? (
        <OwnerNotice
          tone="info"
          title={t("Awaiting first deep-link events")}
          body={t(
            "No deep-link arrivals or broken links have been observed in the last 24 hours. Metrics populate once users land from notification, email, share, or SMS links.",
          )}
        />
      ) : noBrokenLinks ? (
        <OwnerNotice
          tone="info"
          title={t("No broken deep links in the last 24 hours")}
          body={t(
            "Every attributed deep link resolved to a live route. Broken targets surface here ranked by hit count so the worst offenders are fixed first.",
          )}
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard
          icon={metrics.deadLinks24h > 0 ? Unlink : ShieldCheck}
          label={t("Dead links (24h)")}
          value={metrics.deadLinks24h}
          subtitle={t("Deep links that resolved to a 404 in the last 24h")}
          color={
            metrics.deadLinks24h > 0 ? "var(--acct-red)" : "var(--owner-accent)"
          }
        />
        <MetricCard
          icon={Link2}
          label={t("Attributed arrivals (24h)")}
          value={metrics.arrivals24h}
          subtitle={t("Landings from notification, email, share, or SMS links")}
          color="var(--owner-accent)"
        />
      </div>

      {metrics.topDeadLinks.length > 0 ||
      metrics.arrivalsByOutcome.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {metrics.topDeadLinks.length > 0 ? (
            <div className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--acct-muted)]">
                <Unlink className="h-3.5 w-3.5" aria-hidden="true" />
                {t("Top broken targets")}
              </div>
              <ul className="space-y-1.5 text-sm">
                {metrics.topDeadLinks.map((row) => (
                  <li
                    key={row.target}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="truncate font-mono text-xs text-[var(--acct-ink)]">
                      {row.target}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-[var(--acct-muted)]">
                      {row.count} · {timeAgo(row.lastSeenAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {metrics.arrivalsByOutcome.length > 0 ? (
            <div className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--acct-muted)]">
                <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                {t("Arrivals by outcome")}
              </div>
              <ul className="space-y-1.5 text-sm">
                {metrics.arrivalsByOutcome.map((row) => (
                  <li
                    key={row.outcome}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="truncate text-xs text-[var(--acct-ink)]">
                      {outcomeLabel(row.outcome)}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-[var(--acct-muted)]">
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
