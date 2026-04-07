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
import MetricCard from "@/components/owner/MetricCard";
import DivisionBadge from "@/components/owner/DivisionBadge";
import { OwnerPageHeader, OwnerPanel, OwnerNotice, OwnerQuickLink } from "@/components/owner/OwnerPrimitives";
import { getOwnerOverviewData } from "@/lib/owner-data";
import { formatCurrencyAmount, formatCompactNumber, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OwnerOverviewPage() {
  const data = await getOwnerOverviewData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Central Owner Command Center"
        title={`${data.companyTitle} company brain`}
        description="Company-wide operations, finance, staffing, brand, delivery health, and owner guidance in one HenryCo HQ surface."
        actions={
          <>
            <Link href="/owner/staff/invite" className="acct-button-primary">
              Invite staff
            </Link>
            <Link href="/owner/brand/settings" className="acct-button-secondary">
              Update brand settings
            </Link>
          </>
        }
      />

      <OwnerNotice tone="info" title="Data freshness" body={data.dataHealthNote} />
      <OwnerPanel title="Executive situation room" description="Fast owner read for what matters now.">
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
            <p className="text-sm font-semibold text-[var(--acct-ink)]">{data.briefing.headline}</p>
            <p className="mt-2 text-sm leading-7 text-[var(--acct-muted)]">{data.briefing.focus}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-surface)] px-3 py-2 text-xs text-[var(--acct-muted)]">
                Open support: {data.briefing.commsHealth.openSupportThreads}
              </div>
              <div className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-surface)] px-3 py-2 text-xs text-[var(--acct-muted)]">
                Failed delivery: {data.briefing.commsHealth.failedDeliveries}
              </div>
              <div className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-surface)] px-3 py-2 text-xs text-[var(--acct-muted)]">
                WhatsApp skipped: {data.briefing.commsHealth.skippedWhatsApp}
              </div>
              <div className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-surface)] px-3 py-2 text-xs text-[var(--acct-muted)]">
                Queued notifications: {data.briefing.commsHealth.queuedNotifications}
              </div>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--acct-muted)]">Next best owner actions</p>
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
        <MetricCard label="Live divisions" value={data.metrics.divisionsLive} subtitle="Tracked by the command center" icon={Building2} />
        <MetricCard label="Recognized revenue" value={formatCurrencyAmount(data.metrics.totalRevenueNaira)} subtitle="Care, marketplace, and paid shared invoices" icon={DollarSign} />
        <MetricCard label="Open support pressure" value={formatCompactNumber(data.metrics.openSupport)} subtitle="Cross-division support threads awaiting movement" icon={MessageSquare} />
        <MetricCard label="Active staff" value={data.metrics.activeStaff} subtitle="Auth-backed workforce members seen recently" icon={Users} />
        <MetricCard label="Critical signals" value={data.metrics.criticalSignals} subtitle="Items needing owner attention now" icon={Shield} />
        <MetricCard label="Outbound notifications" value={formatCompactNumber(data.metrics.queuedNotifications)} subtitle="Queued email and WhatsApp delivery" icon={Activity} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <OwnerPanel title="Executive digest" description="What needs attention now.">
          <p className="rounded-[1.5rem] bg-[var(--acct-surface)] px-4 py-4 text-sm leading-7 text-[var(--acct-ink)]">
            {data.executiveDigest}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <OwnerQuickLink href="/owner/operations/alerts" label="Review operational alerts" icon={Activity} />
            <OwnerQuickLink href="/owner/finance" label="Check finance pressure" icon={DollarSign} />
            <OwnerQuickLink href="/owner/staff" label="Manage workforce" icon={Users} />
            <OwnerQuickLink href="/owner/ai" label="Open helper layer" icon={Bot} />
            <OwnerQuickLink href="/owner/messaging/team" label="Team internal chat" icon={MessagesSquare} />
            <OwnerQuickLink href="/owner/operations/approvals" label="Approval center" icon={ClipboardCheck} />
          </div>
        </OwnerPanel>

        <OwnerPanel title="Urgent signals" description="Evidence-backed risk and anomaly detection from live tables.">
          <div className="space-y-3">
            {data.signals.slice(0, 5).map((signal) => (
              <div key={signal.id} className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[var(--acct-ink)]">{signal.title}</div>
                  {signal.division ? <DivisionBadge division={signal.division} /> : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{signal.body}</p>
                <Link href={signal.href} className="mt-3 inline-flex text-xs font-semibold text-[var(--owner-accent)]">
                  Open module
                </Link>
              </div>
            ))}
          </div>
        </OwnerPanel>
      </div>

      <OwnerPanel title="Division control center" description="One health map for every live or future HenryCo division." action={<Link href="/owner/divisions" className="acct-button-ghost">View all divisions</Link>}>
        <div className="grid gap-4 lg:grid-cols-2">
          {data.divisions.map((division) => (
            <Link key={division.slug} href={`/owner/divisions/${division.slug}`} className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4 transition-all hover:border-[var(--owner-accent)]/30 hover:shadow-[var(--acct-shadow)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--acct-ink)]">{division.displayName}</div>
                  <p className="mt-1 text-xs text-[var(--acct-muted)]">{division.healthLabel} health · {division.alertCount} alerts · {division.workOpen} open items</p>
                </div>
                <DivisionBadge division={division.slug} />
              </div>
              <div className="mt-4 grid gap-2 text-xs text-[var(--acct-muted)] sm:grid-cols-3">
                <div>Revenue: {formatCurrencyAmount(division.revenueNaira)}</div>
                <div>Staff: {division.staffingCount}</div>
                <div>Support: {division.supportOpen}</div>
              </div>
            </Link>
          ))}
        </div>
      </OwnerPanel>

      <div className="grid gap-6 xl:grid-cols-2">
        <OwnerPanel title="Helper recommendations" description="Only recommendations backed by live signals.">
          <div className="space-y-3">
            {data.helperInsights.map((insight) => (
              <div key={insight.id} className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
                <div className="text-sm font-semibold text-[var(--acct-ink)]">{insight.title}</div>
                <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{insight.body}</p>
                <Link href={insight.href} className="mt-3 inline-flex text-xs font-semibold text-[var(--owner-accent)]">
                  Take action
                </Link>
              </div>
            ))}
          </div>
        </OwnerPanel>

        <OwnerPanel title="Sensitive activity" description="Recent owner-facing audit and staff changes.">
          <div className="space-y-3">
            {data.recentAudit.map((entry) => (
              <div key={`${entry.id}-${entry.action}`} className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-[var(--acct-ink)]">{entry.action}</div>
                  <span className="text-xs text-[var(--acct-muted)]">{entry.createdAt ? timeAgo(entry.createdAt) : "Unknown time"}</span>
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
