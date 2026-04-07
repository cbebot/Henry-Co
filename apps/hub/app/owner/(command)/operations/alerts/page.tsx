import Link from "next/link";
import { RouteLiveRefresh } from "@henryco/ui";
import DivisionBadge from "@/components/owner/DivisionBadge";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getOperationsCenterData } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

export default async function OperationsAlertsPage() {
  const data = await getOperationsCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <RouteLiveRefresh intervalMs={12000} />
      <OwnerPageHeader
        eyebrow="Alert Board"
        title="Operational alerts requiring owner action"
        description="This is the company-wide pressure map for stale workflows, support drag, queue bottlenecks, payout delays, and delivery-health failures."
      />

      <OwnerPanel title="Alerts" description="Sorted from highest owner urgency down.">
        <div className="space-y-3">
          {data.alerts.map((signal) => (
            <div key={signal.id} className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[var(--acct-ink)]">{signal.title}</div>
                {signal.division ? <DivisionBadge division={signal.division} /> : null}
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{signal.body}</p>
              <Link href={signal.href} className="mt-3 inline-flex text-xs font-semibold text-[var(--owner-accent)]">
                Open linked module
              </Link>
            </div>
          ))}
        </div>
      </OwnerPanel>
    </div>
  );
}
