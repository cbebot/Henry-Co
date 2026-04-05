import DivisionBadge from "@/components/owner/DivisionBadge";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getHelperCenterData } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

export default async function HelperSignalsPage() {
  const data = await getHelperCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Signals"
        title="Live anomaly and pressure signals"
        description="Every item below is generated from real bookings, invoices, support threads, queue rows, or automation runs already stored in the shared Supabase project."
      />

      <OwnerPanel title="Signals" description="Raw evidence-backed signals powering the helper layer.">
        <div className="space-y-3">
          {data.signals.map((signal) => (
            <div key={signal.id} className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[var(--acct-ink)]">{signal.title}</div>
                {signal.division ? <DivisionBadge division={signal.division} /> : null}
              </div>
              <p className="mt-2 text-sm text-[var(--acct-muted)]">{signal.body}</p>
            </div>
          ))}
        </div>
      </OwnerPanel>
    </div>
  );
}
