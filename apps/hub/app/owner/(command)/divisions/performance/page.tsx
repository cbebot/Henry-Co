import { Trophy, TriangleAlert } from "lucide-react";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getDivisionCenterData } from "@/lib/owner-data";
import { formatCurrencyAmount } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DivisionPerformancePage() {
  const data = await getDivisionCenterData();
  const ranked = [...data.divisions].sort((left, right) => right.healthScore - left.healthScore);

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Division Ranking"
        title="Performance and pressure ordering"
        description="A single ranking that balances live health score, open workload, support drag, and alert count so the owner can decide where to intervene first."
      />

      <OwnerPanel title="Ranked divisions" description="Higher health means calmer execution; lower health means deeper owner attention is needed.">
        <div className="space-y-3">
          {ranked.map((division, index) => (
            <div key={division.slug} className="grid gap-3 rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--owner-accent-soft)] text-[var(--owner-accent)]">
                {index < 3 ? <Trophy size={18} /> : <TriangleAlert size={18} />}
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--acct-ink)]">{division.displayName}</div>
                <p className="mt-1 text-sm text-[var(--acct-muted)]">
                  Health score {division.healthScore} · {division.healthLabel} · {division.workOpen} open items
                </p>
              </div>
              <div className="text-sm font-semibold text-[var(--acct-ink)]">{formatCurrencyAmount(division.revenueNaira)}</div>
            </div>
          ))}
        </div>
      </OwnerPanel>
    </div>
  );
}
