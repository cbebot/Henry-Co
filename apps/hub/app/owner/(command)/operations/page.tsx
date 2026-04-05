import Link from "next/link";
import { AlertTriangle, Layers3, ListTodo, Workflow } from "lucide-react";
import MetricCard from "@/components/owner/MetricCard";
import DivisionBadge from "@/components/owner/DivisionBadge";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getOperationsCenterData } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

export default async function OperationsCenterPage() {
  const data = await getOperationsCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Operations Center"
        title="Queues, bottlenecks, and stale workflows"
        description="Bookings, disputes, inquiries, applications, support, and shared workflow pressure are centralized here so the owner can jump straight into the right operational surface."
        actions={
          <>
            <Link href="/owner/operations/queues" className="acct-button-secondary">
              Task queues
            </Link>
            <Link href="/owner/operations/alerts" className="acct-button-primary">
              Alert board
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Open support" value={data.metrics.openSupport} subtitle="All divisions" icon={Workflow} />
        <MetricCard label="Stale support" value={data.metrics.staleSupport} subtitle="Threads aging beyond 12h" icon={AlertTriangle} />
        <MetricCard label="Care booking queue" value={data.metrics.openCareBookings} subtitle="Operational load" icon={Layers3} />
        <MetricCard label="Marketplace queue" value={data.metrics.marketplaceQueues} subtitle="Applications + disputes" icon={ListTodo} />
        <MetricCard label="Pending invoices" value={data.metrics.pendingInvoices} subtitle="Shared finance follow-up" icon={AlertTriangle} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <OwnerPanel title="Operational alerts" description="Owner-visible issues requiring action.">
          <div className="space-y-3">
            {data.alerts.map((signal) => (
              <div key={signal.id} className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[var(--acct-ink)]">{signal.title}</div>
                  {signal.division ? <DivisionBadge division={signal.division} /> : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{signal.body}</p>
              </div>
            ))}
          </div>
        </OwnerPanel>

        <OwnerPanel title="Recent shared activity" description="Cross-division activity rows flowing into the central graph.">
          <div className="space-y-3">
            {data.recentActivity.map((item) => (
              <div key={String(item.id)} className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[var(--acct-ink)]">{String(item.title || item.activity_type || "Activity")}</div>
                  {item.division ? <DivisionBadge division={String(item.division)} /> : null}
                </div>
                <p className="mt-1 text-sm text-[var(--acct-muted)]">{String(item.description || "")}</p>
              </div>
            ))}
          </div>
        </OwnerPanel>
      </div>
    </div>
  );
}
