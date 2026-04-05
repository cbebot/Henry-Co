import Link from "next/link";
import MetricCard from "@/components/owner/MetricCard";
import DivisionBadge from "@/components/owner/DivisionBadge";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getMessagingCenterData } from "@/lib/owner-data";
import { Mail, MessageSquareWarning, Siren, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MessagingCenterPage() {
  const data = await getMessagingCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Messaging & Automation"
        title="Delivery health and owner alerting"
        description="Email, WhatsApp, and automation-state visibility is now centralized so the owner can inspect queue failures and alert posture without hopping into division-specific admin tools."
        actions={
          <>
            <Link href="/owner/messaging/queues" className="acct-button-secondary">Delivery queues</Link>
            <Link href="/owner/messaging/alerts" className="acct-button-primary">Alert failures</Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Queue items" value={data.metrics.total} subtitle="Observed message rows" icon={Mail} />
        <MetricCard label="Failed" value={data.metrics.failed} subtitle="Needs retry or config repair" icon={MessageSquareWarning} />
        <MetricCard label="Skipped" value={data.metrics.skipped} subtitle="Usually missing recipient data" icon={Siren} />
        <MetricCard label="Sent" value={data.metrics.sent} subtitle="Successful delivery rows" icon={Zap} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <OwnerPanel title="Alert backlog" description="Failures and skips that affect owner visibility.">
          <div className="space-y-3">
            {data.alerts.map((alert) => (
              <div key={alert.id} className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[var(--acct-ink)]">{alert.subject}</div>
                  <DivisionBadge division={alert.division} />
                </div>
                <p className="mt-2 text-sm text-[var(--acct-muted)]">{alert.error || "Delivery was skipped because required recipient data was missing."}</p>
              </div>
            ))}
          </div>
        </OwnerPanel>

        <OwnerPanel title="Automation sweep history" description="Recent automation runs already emitting shared diagnostics.">
          <div className="space-y-3">
            {data.automationRuns.map((run) => (
              <div key={String(run.id)} className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3">
                <div className="text-sm font-semibold text-[var(--acct-ink)]">{String(run.automation_key || "automation-run")}</div>
                <p className="mt-1 text-sm text-[var(--acct-muted)]">Status: {String(run.status || "unknown")}</p>
              </div>
            ))}
          </div>
        </OwnerPanel>
      </div>
    </div>
  );
}
