import { Activity, Hourglass, TimerReset, Timer } from "lucide-react";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";

import MetricCard from "@/components/owner/MetricCard";
import { OwnerPanel, OwnerNotice } from "@/components/owner/OwnerPrimitives";
import type { SlowSurfaceMetrics } from "@/lib/owner-slow-surfaces";

/**
 * V3-05 (Priority-2 scaffold) — Slow-surface tile for the owner workspace.
 *
 * Surfaces V3-05's two skeleton telemetry events:
 *   - `henry.ui.skeleton.shown`               — every StructuredSkeleton mount
 *   - `henry.ui.skeleton.exceeded_threshold`  — skeleton held > 3s
 *
 * The 24h `thresholdExceededToday` is the headline metric. Below it,
 * a ranked top-5 of the worst offenders over the last 7 days
 * (surface id + count + avg held duration) so the owner can see
 * which page is consistently slow.
 *
 * Empty-state: when no V3-05 events have been observed (the common
 * case before the emit→henry_events pipe is fully wired, mirroring
 * the V3-01 slice 5b gap), the tile renders an explanatory notice
 * so the owner doesn't read the zeros as a regression.
 */
type SlowSurfaceTileProps = {
  metrics: SlowSurfaceMetrics;
  locale: AppLocale;
};

export default function SlowSurfaceTile({ metrics, locale }: SlowSurfaceTileProps) {
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <OwnerPanel
      title={t("Slow surfaces")}
      description={t(
        "V3-05 skeleton telemetry — surfaces whose loading skeleton stayed longer than 3 seconds. Find the slow page; fix the query.",
      )}
    >
      {metrics.isEmptyState ? (
        <OwnerNotice
          tone="info"
          title={t("Awaiting first skeleton events")}
          body={t(
            "No StructuredSkeleton telemetry yet. Metrics populate once `henry.ui.skeleton.shown` and `henry.ui.skeleton.exceeded_threshold` rows land in henry_events.",
          )}
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          icon={Activity}
          label={t("Skeletons shown today")}
          value={metrics.skeletonsShownToday}
          subtitle={t("Loading-skeleton mounts in the last 24h")}
          color="var(--owner-accent)"
        />
        <MetricCard
          icon={Hourglass}
          label={t("Exceeded 3s today")}
          value={metrics.thresholdExceededToday}
          subtitle={t("Skeletons held above the V3-05 slow threshold")}
          color={
            metrics.thresholdExceededToday > 0
              ? "var(--acct-amber)"
              : "var(--owner-accent)"
          }
        />
        <MetricCard
          icon={Timer}
          label={t("Distinct slow surfaces (7d)")}
          value={metrics.topSlowSurfaces7d.length}
          subtitle={t("Unique surfaces tripping the slow threshold")}
          color="var(--owner-accent)"
        />
      </div>

      {metrics.topSlowSurfaces7d.length > 0 ? (
        <div className="mt-4 rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--acct-muted)]">
            {t("Top slow surfaces (7d)")}
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {metrics.topSlowSurfaces7d.map((row) => (
              <li
                key={row.surface}
                className="flex items-center justify-between gap-3 rounded-[1rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-3 py-2"
              >
                <span className="truncate font-medium text-[var(--acct-ink)]">
                  {row.surface}
                </span>
                <span className="shrink-0 text-xs text-[var(--acct-muted)]">
                  {row.exceededCount} {t("trips")}
                  {row.avgDurationMs > 0 ? (
                    <>
                      {" "}— {Math.round(row.avgDurationMs / 1000)}s {t("avg")}
                    </>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-3 flex items-center gap-2 rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-2 text-xs text-[var(--acct-muted)]">
        <TimerReset className="h-4 w-4 text-[var(--owner-accent)]" aria-hidden="true" />
        <span>
          {t(
            "Last computed",
          )}: {new Date(metrics.lastUpdatedAt).toISOString().slice(11, 19)} UTC
        </span>
      </div>
    </OwnerPanel>
  );
}
