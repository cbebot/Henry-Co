import Link from "next/link";
import {
  Activity,
  Bot,
  Building2,
  ClipboardCheck,
  DollarSign,
  MessageSquare,
  MessagesSquare,
  Shield,
  Users,
} from "lucide-react";
import { RouteLiveRefresh } from "@henryco/ui";
import { translateSurfaceLabel } from "@henryco/i18n";
import MetricCard from "@/components/owner/MetricCard";
import DivisionBadge from "@/components/owner/DivisionBadge";
import { OwnerPageHeader, OwnerPanel, OwnerNotice, OwnerQuickLink } from "@/components/owner/OwnerPrimitives";
import SessionHealthTile from "@/components/owner/SessionHealthTile";
import ObservabilityTile from "./dashboard/observability-tile";
import { getOwnerOverviewData } from "@/lib/owner-data";
import { getSessionHealthMetrics } from "@/lib/owner-session-health";
import { getObservabilityMetrics } from "@/lib/owner-observability";
import { formatCurrencyAmount, formatCompactNumber, timeAgo } from "@/lib/format";
import { getHubPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function OwnerOverviewPage() {
  const [data, sessionHealth, observability, locale] = await Promise.all([
    getOwnerOverviewData(),
    getSessionHealthMetrics(),
    getObservabilityMetrics(),
    getHubPublicLocale(),
  ]);
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <div className="space-y-6 acct-fade-in">
      <RouteLiveRefresh />
      <OwnerPageHeader
        eyebrow={t("Central Owner Command Center")}
        title={`${data.companyTitle} ${t("company brain")}`}
        description={t("Company-wide operations, finance, staffing, brand, delivery health, and owner guidance in one HenryCo HQ surface.")}
        actions={
          <>
            <Link href="/owner/staff/invite" className="acct-button-primary">
              {t("Invite staff")}
            </Link>
            <Link href="/owner/brand/settings" className="acct-button-secondary">
              {t("Update brand settings")}
            </Link>
          </>
        }
      />

      <OwnerNotice tone="info" title={t("Data freshness")} body={data.dataHealthNote} />
      <OwnerPanel title={t("Executive situation room")} description={t("Fast owner read for what matters now.")}>
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
            <p className="text-sm font-semibold text-[var(--acct-ink)]">{data.briefing.headline}</p>
            <p className="mt-2 text-sm leading-7 text-[var(--acct-muted)]">{data.briefing.focus}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-surface)] px-3 py-2 text-xs text-[var(--acct-muted)]">
                {t("Open support")}: {data.briefing.commsHealth.openSupportThreads}
              </div>
              <div className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-surface)] px-3 py-2 text-xs text-[var(--acct-muted)]">
                {t("Failed delivery")}: {data.briefing.commsHealth.failedDeliveries}
              </div>
              <div className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-surface)] px-3 py-2 text-xs text-[var(--acct-muted)]">
                {t("WhatsApp skipped")}: {data.briefing.commsHealth.skippedWhatsApp}
              </div>
              <div className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-surface)] px-3 py-2 text-xs text-[var(--acct-muted)]">
                {t("Queued notifications")}: {data.briefing.commsHealth.queuedNotifications}
              </div>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--acct-muted)]">{t("Next best owner actions")}</p>
            <div className="mt-3 space-y-2">
              {data.briefing.nextSteps.slice(0, 4).map((step) => (
                <Link key={step.title} href={step.href} className="block rounded-xl bg-[var(--acct-surface)] px-3 py-2">
                  <p className="text-sm font-semibold text-[var(--acct-ink)]">{step.title}</p>
                  <p className="mt-1 text-xs text-[var(--acct-muted)]">{step.reason}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </OwnerPanel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label={t("Live divisions")}
          value={data.metrics.divisionsLive}
          subtitle={t("Tracked by the command center")}
          icon={Building2}
          traceId="overview.divisions-live"
        />
        <MetricCard
          label={t("Recognized revenue")}
          value={formatCurrencyAmount(data.metrics.totalRevenueNaira)}
          subtitle={t("Care, marketplace, and paid shared invoices")}
          icon={DollarSign}
          traceId="overview.recognized-revenue"
        />
        <MetricCard
          label={t("Open support pressure")}
          value={formatCompactNumber(data.metrics.openSupport)}
          subtitle={t("Cross-division support threads awaiting movement")}
          icon={MessageSquare}
          traceId="overview.open-support"
        />
        <MetricCard
          label={t("Active staff")}
          value={data.metrics.activeStaff}
          subtitle={t("Auth-backed workforce members seen recently")}
          icon={Users}
          traceId="overview.active-staff"
        />
        <MetricCard
          label={t("Critical signals")}
          value={data.metrics.criticalSignals}
          subtitle={t("Items needing owner attention now")}
          icon={Shield}
          traceId="overview.critical-signals"
        />
        <MetricCard
          label={t("Outbound notifications")}
          value={formatCompactNumber(data.metrics.queuedNotifications)}
          subtitle={t("Queued email and WhatsApp delivery")}
          icon={Activity}
          traceId="overview.outbound-notifications"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <OwnerPanel title={t("Executive digest")} description={t("What needs attention now.")}>
          <p className="rounded-[1.5rem] bg-[var(--acct-surface)] px-4 py-4 text-sm leading-7 text-[var(--acct-ink)]">
            {data.executiveDigest}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <OwnerQuickLink href="/owner/operations/alerts" label={t("Review operational alerts")} icon={Activity} />
            <OwnerQuickLink href="/owner/finance" label={t("Check finance pressure")} icon={DollarSign} />
            <OwnerQuickLink href="/owner/staff" label={t("Manage workforce")} icon={Users} />
            <OwnerQuickLink href="/owner/ai" label={t("Open helper layer")} icon={Bot} />
            <OwnerQuickLink href="/owner/messaging/team" label={t("Team internal chat")} icon={MessagesSquare} />
            <OwnerQuickLink href="/owner/operations/approvals" label={t("Approval center")} icon={ClipboardCheck} />
          </div>
        </OwnerPanel>

        <OwnerPanel title={t("Urgent signals")} description={t("Evidence-backed risk and anomaly detection from live tables.")}>
          <div className="space-y-3">
            {data.signals.slice(0, 5).map((signal) => (
              <div key={signal.id} className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[var(--acct-ink)]">{signal.title}</div>
                  {signal.division ? <DivisionBadge division={signal.division} /> : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{signal.body}</p>
                <Link href={signal.href} className="mt-3 inline-flex text-xs font-semibold text-[var(--owner-accent)]">
                  {t("Open module")}
                </Link>
              </div>
            ))}
          </div>
        </OwnerPanel>
      </div>

      <OwnerPanel title={t("Division control center")} description={t("One health map for every live or future HenryCo division.")} action={<Link href="/owner/divisions" className="acct-button-ghost">{t("View all divisions")}</Link>}>
        <div className="grid gap-4 lg:grid-cols-2">
          {data.divisions.map((division) => (
            <Link key={division.slug} href={`/owner/divisions/${division.slug}`} className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4 transition-all hover:border-[var(--owner-accent)]/30 hover:shadow-[var(--acct-shadow)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--acct-ink)]">{division.displayName}</div>
                  <p className="mt-1 text-xs text-[var(--acct-muted)]">{division.healthLabel} {t("health")} · {division.alertCount} {t("alerts")} · {division.workOpen} {t("open items")}</p>
                </div>
                <DivisionBadge division={division.slug} />
              </div>
              <div className="mt-4 grid gap-2 text-xs text-[var(--acct-muted)] sm:grid-cols-3">
                <div>{t("Revenue")}: {formatCurrencyAmount(division.revenueNaira)}</div>
                <div>{t("Staff")}: {division.staffingCount}</div>
                <div>{t("Support")}: {division.supportOpen}</div>
              </div>
            </Link>
          ))}
        </div>
      </OwnerPanel>

      <div className="grid gap-6 xl:grid-cols-2">
        <OwnerPanel title={t("Helper recommendations")} description={t("Only recommendations backed by live signals.")}>
          <div className="space-y-3">
            {data.helperInsights.map((insight) => (
              <div key={insight.id} className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
                <div className="text-sm font-semibold text-[var(--acct-ink)]">{insight.title}</div>
                <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{insight.body}</p>
                <Link href={insight.href} className="mt-3 inline-flex text-xs font-semibold text-[var(--owner-accent)]">
                  {t("Take action")}
                </Link>
              </div>
            ))}
          </div>
        </OwnerPanel>

        <OwnerPanel title={t("Sensitive activity")} description={t("Recent owner-facing audit and staff changes.")}>
          <div className="space-y-3">
            {data.recentAudit.map((entry) => (
              <div key={`${entry.id}-${entry.action}`} className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-[var(--acct-ink)]">{entry.action}</div>
                  <span className="text-xs text-[var(--acct-muted)]">{entry.createdAt ? timeAgo(entry.createdAt) : t("Unknown time")}</span>
                </div>
                <div className="mt-1 text-xs uppercase tracking-wide text-[var(--acct-muted)]">{entry.actor}</div>
              </div>
            ))}
          </div>
        </OwnerPanel>
      </div>

      <SessionHealthTile metrics={sessionHealth} locale={locale} />

      <ObservabilityTile metrics={observability} locale={locale} />
    </div>
  );
}
