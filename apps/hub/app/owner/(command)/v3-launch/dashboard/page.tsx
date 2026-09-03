import { Eye, Flag, Megaphone, Route } from "lucide-react";
import { RouteLiveRefresh } from "@henryco/ui";
import { translateSurfaceLabel } from "@henryco/i18n";
import MetricCard from "@/components/owner/MetricCard";
import { OwnerNotice, OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getV3LaunchMetrics } from "@/lib/owner-v3-launch";
import { getHubPublicLocale } from "@/lib/locale-server";

/**
 * Owner V3-launch dashboard (V3-96 S5, honest v1).
 *
 * Renders the panels whose data ACTUALLY flows today — showcase views,
 * journey funnel, announcement delivery, all read live from the
 * `henry_events` sink — and lists the remaining S5 panels as an honest
 * "not wired yet" roster naming the system each one waits on (V3-08
 * empty-dashboard truth: a dashboard that pretends is worse than none).
 * Owner-gated by the (command) segment's existing auth; desktop-first.
 */

export const dynamic = "force-dynamic";

/** S5 panels whose feeding systems are not wired yet — named, not faked. */
const PENDING_PANELS: { name: string; feeder: string }[] = [
  { name: "Money", feeder: "finance ledger rollup (V3-22)" },
  { name: "Joy", feeder: "joy_state_seen interaction telemetry ingest" },
  { name: "Recovery", feeder: "recovery_triggered / recovery_resumed ingest" },
  { name: "Trust", feeder: "trust_stage_entered ingest" },
  { name: "Pricing honesty", feeder: "pricing_revealed → checkout join" },
  { name: "Concierge", feeder: "intelligence conversation metrics" },
  { name: "Earn-With-Us", feeder: "provider onboarding funnel (V3-67)" },
  { name: "Anti-clone watchdog", feeder: "rate-limit + leak-scan feeds" },
  { name: "A/B holdouts", feeder: "experiment registry (V3-91)" },
  { name: "SLO health", feeder: "traces + budgets (V3-89)" },
  { name: "Privacy + safety", feeder: "DSAR + moderation counters (V3-93)" },
];

export default async function V3LaunchDashboardPage() {
  const [locale, metrics] = await Promise.all([getHubPublicLocale(), getV3LaunchMetrics()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const j = metrics.journey;
  const a = metrics.announcement;

  return (
    <div className="space-y-6">
      <RouteLiveRefresh intervalMs={30000} />
      <OwnerPageHeader
        eyebrow={t("V3 launch")}
        title={t("Launch window")}
        description={t(
          "Live counts from the henry_events sink. Panels whose systems aren't wired yet say so — nothing here pretends.",
        )}
      />

      {!metrics.available ? (
        <OwnerNotice
          tone="warning"
          title={t("Sink not responding")}
          body={t(
            "The henry_events sink didn't respond — counts below may be stale or empty. This is a reporting gap, not necessarily a traffic gap.",
          )}
        />
      ) : null}

      <OwnerPanel
        title={t("Showcase health")}
        description={t("henry.v3.showcase.viewed by surface — 24 hours / 7 days.")}
      >
        {metrics.showcaseBySurface.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--acct-muted)]">
            {t(
              "No showcase views recorded yet. Counts start the moment the /v3 surfaces deploy with the sink reachable.",
            )}
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.showcaseBySurface.map((row) => (
              <MetricCard
                key={row.surface}
                label={row.surface}
                value={String(row.last24h)}
                subtitle={`${row.last7d} / 7d`}
                icon={Eye}
              />
            ))}
          </div>
        )}
      </OwnerPanel>

      <OwnerPanel
        title={t("Journey funnel")}
        description={t("Started → completed, with abandonments as recovery candidates.")}
      >
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <MetricCard
            label={t("Started")}
            value={String(j.started.last24h)}
            subtitle={`${j.started.last7d} / 7d`}
            icon={Route}
          />
          <MetricCard
            label={t("Completed")}
            value={String(j.completed.last24h)}
            subtitle={`${j.completed.last7d} / 7d`}
            icon={Flag}
          />
          <MetricCard
            label={t("Abandoned")}
            value={String(j.abandoned.last24h)}
            subtitle={`${j.abandoned.last7d} / 7d`}
            icon={Route}
          />
        </div>
      </OwnerPanel>

      <OwnerPanel
        title={t("Announcement")}
        description={t("Deliveries and engagements across channels.")}
      >
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <MetricCard
            label={t("Delivered")}
            value={String(a.delivered.last24h)}
            subtitle={`${a.delivered.last7d} / 7d`}
            icon={Megaphone}
          />
          <MetricCard
            label={t("Engaged")}
            value={String(a.engaged.last24h)}
            subtitle={`${a.engaged.last7d} / 7d`}
            icon={Megaphone}
          />
        </div>
      </OwnerPanel>

      <OwnerPanel
        title={t("Not wired yet")}
        description={t(
          "The remaining launch panels and the system each one waits on. A panel appears above the moment its feed is real.",
        )}
      >
        <ul className="mt-3 divide-y divide-[var(--acct-line)]">
          {PENDING_PANELS.map((panel) => (
            <li key={panel.name} className="flex items-baseline justify-between gap-4 py-2.5">
              <span className="text-sm font-medium text-[var(--acct-ink)]">{t(panel.name)}</span>
              <span className="text-xs text-[var(--acct-muted)]">{t(panel.feeder)}</span>
            </li>
          ))}
        </ul>
      </OwnerPanel>
    </div>
  );
}
