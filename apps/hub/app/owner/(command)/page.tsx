import type { Metadata } from "next";
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
import { getHubOwnerCopy } from "@henryco/i18n/server";
import MetricCard from "@/components/owner/MetricCard";
import DivisionBadge from "@/components/owner/DivisionBadge";
import { OwnerPageHeader, OwnerPanel, OwnerNotice, OwnerQuickLink } from "@/components/owner/OwnerPrimitives";
import { getOwnerOverviewData } from "@/lib/owner-data";
import { formatCurrencyAmount, formatCompactNumber, timeAgo } from "@/lib/format";
import { getHubPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getHubPublicLocale();
  const copy = getHubOwnerCopy(locale);
  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
  };
}

export default async function OwnerOverviewPage() {
  const locale = await getHubPublicLocale();
  const copy = getHubOwnerCopy(locale);
  const data = await getOwnerOverviewData();

  return (
    <div className="space-y-6 acct-fade-in">
      <RouteLiveRefresh />
      <OwnerPageHeader
        eyebrow={copy.hero.eyebrow}
        title={copy.hero.titleTemplate.replace("{company}", data.companyTitle)}
        description={copy.hero.description}
        actions={
          <>
            <Link href="/owner/staff/invite" className="acct-button-primary">
              {copy.hero.inviteStaff}
            </Link>
            <Link href="/owner/brand/settings" className="acct-button-secondary">
              {copy.hero.updateBrand}
            </Link>
          </>
        }
      />

      <OwnerNotice tone="info" title={copy.dataHealth.title} body={data.dataHealthNote} />
      <OwnerPanel title={copy.situationRoom.title} description={copy.situationRoom.description}>
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
            <p className="text-sm font-semibold text-[var(--acct-ink)]">{data.briefing.headline}</p>
            <p className="mt-2 text-sm leading-7 text-[var(--acct-muted)]">{data.briefing.focus}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-surface)] px-3 py-2 text-xs text-[var(--acct-muted)]">
                {copy.situationRoom.openSupport}: {data.briefing.commsHealth.openSupportThreads}
              </div>
              <div className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-surface)] px-3 py-2 text-xs text-[var(--acct-muted)]">
                {copy.situationRoom.failedDelivery}: {data.briefing.commsHealth.failedDeliveries}
              </div>
              <div className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-surface)] px-3 py-2 text-xs text-[var(--acct-muted)]">
                {copy.situationRoom.whatsappSkipped}: {data.briefing.commsHealth.skippedWhatsApp}
              </div>
              <div className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-surface)] px-3 py-2 text-xs text-[var(--acct-muted)]">
                {copy.situationRoom.queuedNotifications}: {data.briefing.commsHealth.queuedNotifications}
              </div>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--acct-muted)]">{copy.situationRoom.nextStepsEyebrow}</p>
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
        <MetricCard label={copy.metrics.divisionsLive} value={data.metrics.divisionsLive} subtitle={copy.metrics.divisionsLiveSubtitle} icon={Building2} />
        <MetricCard label={copy.metrics.recognizedRevenue} value={formatCurrencyAmount(data.metrics.totalRevenueNaira)} subtitle={copy.metrics.recognizedRevenueSubtitle} icon={DollarSign} />
        <MetricCard label={copy.metrics.openSupport} value={formatCompactNumber(data.metrics.openSupport)} subtitle={copy.metrics.openSupportSubtitle} icon={MessageSquare} />
        <MetricCard label={copy.metrics.activeStaff} value={data.metrics.activeStaff} subtitle={copy.metrics.activeStaffSubtitle} icon={Users} />
        <MetricCard label={copy.metrics.criticalSignals} value={data.metrics.criticalSignals} subtitle={copy.metrics.criticalSignalsSubtitle} icon={Shield} />
        <MetricCard label={copy.metrics.outboundNotifications} value={formatCompactNumber(data.metrics.queuedNotifications)} subtitle={copy.metrics.outboundNotificationsSubtitle} icon={Activity} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <OwnerPanel title={copy.executiveDigest.title} description={copy.executiveDigest.description}>
          <p className="rounded-[1.5rem] bg-[var(--acct-surface)] px-4 py-4 text-sm leading-7 text-[var(--acct-ink)]">
            {data.executiveDigest}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <OwnerQuickLink href="/owner/operations/alerts" label={copy.executiveDigest.reviewAlerts} icon={Activity} />
            <OwnerQuickLink href="/owner/finance" label={copy.executiveDigest.financePressure} icon={DollarSign} />
            <OwnerQuickLink href="/owner/staff" label={copy.executiveDigest.manageWorkforce} icon={Users} />
            <OwnerQuickLink href="/owner/ai" label={copy.executiveDigest.helperLayer} icon={Bot} />
            <OwnerQuickLink href="/owner/messaging/team" label={copy.executiveDigest.teamChat} icon={MessagesSquare} />
            <OwnerQuickLink href="/owner/operations/approvals" label={copy.executiveDigest.approvalCenter} icon={ClipboardCheck} />
          </div>
        </OwnerPanel>

        <OwnerPanel title={copy.urgentSignals.title} description={copy.urgentSignals.description}>
          <div className="space-y-3">
            {data.signals.slice(0, 5).map((signal) => (
              <div key={signal.id} className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[var(--acct-ink)]">{signal.title}</div>
                  {signal.division ? <DivisionBadge division={signal.division} /> : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{signal.body}</p>
                <Link href={signal.href} className="mt-3 inline-flex text-xs font-semibold text-[var(--owner-accent)]">
                  {copy.urgentSignals.openModule}
                </Link>
              </div>
            ))}
          </div>
        </OwnerPanel>
      </div>

      <OwnerPanel title={copy.divisionsPanel.title} description={copy.divisionsPanel.description} action={<Link href="/owner/divisions" className="acct-button-ghost">{copy.divisionsPanel.viewAll}</Link>}>
        <div className="grid gap-4 lg:grid-cols-2">
          {data.divisions.map((division) => (
            <Link key={division.slug} href={`/owner/divisions/${division.slug}`} className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4 transition-all hover:border-[var(--owner-accent)]/30 hover:shadow-[var(--acct-shadow)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--acct-ink)]">{division.displayName}</div>
                  <p className="mt-1 text-xs text-[var(--acct-muted)]">
                    {copy.divisionsPanel.healthLabelTemplate
                      .replace("{label}", division.healthLabel)
                      .replace("{alerts}", String(division.alertCount))
                      .replace("{open}", String(division.workOpen))}
                  </p>
                </div>
                <DivisionBadge division={division.slug} />
              </div>
              <div className="mt-4 grid gap-2 text-xs text-[var(--acct-muted)] sm:grid-cols-3">
                <div>{copy.divisionsPanel.revenueLabel}: {formatCurrencyAmount(division.revenueNaira)}</div>
                <div>{copy.divisionsPanel.staffLabel}: {division.staffingCount}</div>
                <div>{copy.divisionsPanel.supportLabel}: {division.supportOpen}</div>
              </div>
            </Link>
          ))}
        </div>
      </OwnerPanel>

      <div className="grid gap-6 xl:grid-cols-2">
        <OwnerPanel title={copy.helperInsights.title} description={copy.helperInsights.description}>
          <div className="space-y-3">
            {data.helperInsights.map((insight) => (
              <div key={insight.id} className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
                <div className="text-sm font-semibold text-[var(--acct-ink)]">{insight.title}</div>
                <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{insight.body}</p>
                <Link href={insight.href} className="mt-3 inline-flex text-xs font-semibold text-[var(--owner-accent)]">
                  {copy.helperInsights.takeAction}
                </Link>
              </div>
            ))}
          </div>
        </OwnerPanel>

        <OwnerPanel title={copy.sensitiveActivity.title} description={copy.sensitiveActivity.description}>
          <div className="space-y-3">
            {data.recentAudit.map((entry) => (
              <div key={`${entry.id}-${entry.action}`} className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-[var(--acct-ink)]">{entry.action}</div>
                  <span className="text-xs text-[var(--acct-muted)]">{entry.createdAt ? timeAgo(entry.createdAt) : copy.sensitiveActivity.unknownTime}</span>
                </div>
                <div className="mt-1 text-xs uppercase tracking-wide text-[var(--acct-muted)]">{entry.actor}</div>
              </div>
            ))}
          </div>
        </OwnerPanel>
      </div>
    </div>
  );
}
