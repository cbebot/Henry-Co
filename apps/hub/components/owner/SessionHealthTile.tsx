import {
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TimerReset,
} from "lucide-react";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";

import MetricCard from "./MetricCard";
import { OwnerPanel, OwnerNotice } from "./OwnerPrimitives";
import type { SessionHealthMetrics } from "@/lib/owner-session-health";

/**
 * V3-01 Session Health tile (Slice 5) — owner-workspace surface for
 * the session-persistence pass.
 *
 * Reads the 4 V3-01 telemetry counts via `getSessionHealthMetrics()`
 * and surfaces them as MetricCards in an OwnerPanel. The 7-day
 * refresh success rate is the headline metric — Addendum A4 sets
 * 1% refresh failure as the rollback gate (i.e., 99% success is the
 * floor). When success rate drops below the gate, the tile renders
 * an OwnerNotice in warning tone.
 *
 * Empty state: when no V3-01 events have been observed yet (the
 * common case before slice 5b wires emit→customer_activity), the
 * tile renders an explanatory notice so the owner doesn't read the
 * zeros as a regression.
 */
type SessionHealthTileProps = {
  metrics: SessionHealthMetrics;
  /** Resolved AppLocale; the tile uses runtime DeepL (Pattern B) for translations. */
  locale: AppLocale;
};

export default function SessionHealthTile({
  metrics,
  locale,
}: SessionHealthTileProps) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const successRate = `${metrics.refreshSuccessRate7d}%`;
  const gateBreached = metrics.isAboveRollbackGate;

  return (
    <OwnerPanel
      title={t("Session health")}
      description={t(
        "V3-01 session-persistence telemetry — reauth round-trips, silent token refreshes, draft restorations.",
      )}
    >
      {metrics.isEmptyState ? (
        <OwnerNotice
          tone="info"
          title={t("Awaiting first events")}
          body={t(
            "No V3-01 session events have been observed yet. Metrics populate once silent refreshes and reauth completions land in customer_activity.",
          )}
        />
      ) : gateBreached ? (
        <OwnerNotice
          tone="warning"
          title={t("Refresh success rate below 99% baseline")}
          body={t(
            "Rolling 7-day refresh failure rate is above the Addendum A4 rollback gate. Investigate session expiry handling before merging V3-01 to production.",
          )}
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Sparkles}
          label={t("Reauths today")}
          value={metrics.reauthsToday}
          subtitle={t("Successful reauth round-trips in the last 24h")}
          color="var(--owner-accent)"
        />
        <MetricCard
          icon={gateBreached ? AlertTriangle : ShieldCheck}
          label={t("Refresh success (7d)")}
          value={successRate}
          subtitle={
            gateBreached
              ? t("Below 99% baseline — investigate")
              : t("Above 99% baseline (A4 rollback gate)")
          }
          color={gateBreached ? "var(--acct-red)" : "var(--owner-accent)"}
        />
        <MetricCard
          icon={TimerReset}
          label={t("Silent refreshes today")}
          value={metrics.refreshedToday}
          subtitle={t("Token auto-refresh succeeded; user never saw a screen")}
          color="var(--owner-accent)"
        />
        <MetricCard
          icon={RotateCcw}
          label={t("Drafts restored today")}
          value={metrics.draftsRestoredToday}
          subtitle={t("In-flight forms re-populated after refresh or reauth")}
          color="var(--owner-accent)"
        />
      </div>

      {metrics.refreshFailedToday > 0 ? (
        <div className="mt-3 flex items-center gap-2 rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-2 text-xs text-[var(--acct-muted)]">
          <AlertTriangle
            className="h-4 w-4 text-[var(--acct-orange-text)]"
            aria-hidden="true"
          />
          <span>
            {t("Refresh failures today")}:{" "}
            <span className="font-semibold text-[var(--acct-ink)]">
              {metrics.refreshFailedToday}
            </span>
            {" — "}
            {t("each landed the user on /auth/reauth and preserved their draft.")}
          </span>
        </div>
      ) : null}
    </OwnerPanel>
  );
}
