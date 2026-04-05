import Link from "next/link";
import { ArrowUpRight, BarChart3 } from "lucide-react";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import DivisionBadge from "@/components/owner/DivisionBadge";
import { getDivisionCenterData } from "@/lib/owner-data";
import { formatCurrencyAmount } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DivisionCenterPage() {
  const data = await getDivisionCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Division Control Center"
        title="Every division, one map"
        description="All divisions — care, marketplace, studio, jobs, property, learn, and logistics — with health, workload, staffing, and financial visibility."
        actions={<Link href="/owner/divisions/performance" className="acct-button-secondary">Performance ranking</Link>}
      />

      <OwnerPanel title="Division roster" description={`Live divisions tracked: ${data.liveDivisions}. Company-wide recognized revenue: ${formatCurrencyAmount(data.totalRevenueNaira)}.`}>
        <div className="grid gap-4 xl:grid-cols-2">
          {data.divisions.map((division) => (
            <Link key={division.slug} href={`/owner/divisions/${division.slug}`} className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-5 transition-all hover:border-[var(--owner-accent)]/30 hover:shadow-[var(--acct-shadow)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-base font-semibold text-[var(--acct-ink)]">{division.displayName}</div>
                  <p className="mt-1 text-sm text-[var(--acct-muted)]">{division.healthLabel} · {division.workOpen} open items · {division.supportOpen} support threads</p>
                </div>
                <DivisionBadge division={division.slug} />
              </div>
              <div className="mt-4 grid gap-2 text-sm text-[var(--acct-muted)] sm:grid-cols-2">
                <div>Revenue: {formatCurrencyAmount(division.revenueNaira)}</div>
                <div>Staff: {division.staffingCount}</div>
                <div>Pending onboarding: {division.onboardingPending}</div>
                <div>Signals: {division.alertCount}</div>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--owner-accent)]">
                Open division room <ArrowUpRight size={15} />
              </div>
            </Link>
          ))}
        </div>
      </OwnerPanel>

      <OwnerPanel title="Cross-division alerts" description="Grouped owner signals with direct links into the right module.">
        <div className="space-y-3">
          {data.companySignals.map((signal) => (
            <div key={signal.id} className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[var(--acct-ink)]">{signal.title}</div>
                {signal.division ? <DivisionBadge division={signal.division} /> : <BarChart3 size={16} className="text-[var(--acct-muted)]" />}
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{signal.body}</p>
            </div>
          ))}
        </div>
      </OwnerPanel>
    </div>
  );
}
