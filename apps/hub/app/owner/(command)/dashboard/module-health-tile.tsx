import { LayoutDashboard, EyeOff, Activity, TimerReset } from "lucide-react";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";

import MetricCard from "@/components/owner/MetricCard";
import { OwnerPanel, OwnerNotice } from "@/components/owner/OwnerPrimitives";
import type { ModuleHealthMetrics } from "@/lib/owner-module-health";

/**
 * V3-08 (Empty Dashboard Truth) — module-health tile for the owner
 * workspace.
 *
 * Surfaces the `henry.dashboard.module.rendered` telemetry written by
 * the Smart Home composition (`apps/account/lib/smart-home/widgets.ts`).
 * Each render is tagged with a module-state taxonomy value; this tile
 * rolls them up to answer one owner question: "which dashboard modules
 * render but never actually show anything?"
 *
 * The headline list is `alwaysEmpty7d` — modules whose every render in
 * the last 7 days resolved to an empty state. A module that is always
 * empty is a removal / messaging-fix candidate: it is occupying real
 * estate while teaching the customer nothing. That is exactly the
 * dashboard theatre V3-08 exists to kill.
 *
 * Empty-state: when no render telemetry has landed yet (common before
 * the emit→henry_events pipe has accumulated volume, mirroring the
 * V3-01 slice 5b / V3-05 gap), the tile renders an explanatory notice
 * so the owner doesn't read the zeros as a regression.
 */
type ModuleHealthTileProps = {
  metrics: ModuleHealthMetrics;
  locale: AppLocale;
};

export default function ModuleHealthTile({ metrics, locale }: ModuleHealthTileProps) {
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <OwnerPanel
      title={t("Dashboard module health")}
      description={t(
        "V3-08 render telemetry — which dashboard modules surface real data versus render empty. Modules empty on every render are candidates for removal or a messaging fix.",
      )}
    >
      {metrics.isEmptyState ? (
        <OwnerNotice
          tone="info"
          title={t("Awaiting first module-render events")}
          body={t(
            "No dashboard render telemetry yet. Metrics populate once `henry.dashboard.module.rendered` rows land in henry_events from Smart Home compositions.",
          )}
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          icon={LayoutDashboard}
          label={t("Modules observed (7d)")}
          value={metrics.modulesObserved7d}
          subtitle={t("Distinct dashboard modules seen rendering")}
          color="var(--owner-accent)"
        />
        <MetricCard
          icon={Activity}
          label={t("Renders today")}
          value={metrics.rendersToday}
          subtitle={t("Module render observations in the last 24h")}
          color="var(--owner-accent)"
        />
        <MetricCard
          icon={EyeOff}
          label={t("Always-empty modules (7d)")}
          value={metrics.alwaysEmpty7d.length}
          subtitle={t("Rendered but never showed data — review candidates")}
          color={
            metrics.alwaysEmpty7d.length > 0
              ? "var(--acct-amber)"
              : "var(--owner-accent)"
          }
        />
      </div>

      {metrics.alwaysEmpty7d.length > 0 ? (
        <div className="mt-4 rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--acct-muted)]">
            {t("Always empty (7d)")}
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {metrics.alwaysEmpty7d.map((row) => (
              <li
                key={row.moduleId}
                className="flex items-center justify-between gap-3 rounded-[1rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-3 py-2"
              >
                <span className="truncate font-medium text-[var(--acct-ink)]">
                  {row.moduleId}
                </span>
                <span className="shrink-0 text-xs text-[var(--acct-muted)]">
                  {row.renders} {t("renders")}
                  {row.errorRenders > 0 ? (
                    <>
                      {" "}— {row.errorRenders} {t("errors")}
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
