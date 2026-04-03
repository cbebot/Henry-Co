import { formatCurrency } from "@/lib/env";
import { requireStudioRoles } from "@/lib/studio/auth";
import { financeNav } from "@/lib/studio/navigation";
import { getStudioSnapshot } from "@/lib/studio/store";
import {
  StudioMetricCard,
  StudioWorkspaceShell,
} from "@/components/studio/workspace/shell";

export default async function FinanceDashboardPage() {
  await requireStudioRoles(["studio_owner", "finance"], "/finance");
  const snapshot = await getStudioSnapshot();
  const totalRequested = snapshot.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalPaid = snapshot.payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <StudioWorkspaceShell
      kicker="Finance console"
      title="Verify proof, track milestone cash flow, and keep invoice records clean."
      description="Finance owns deposit confirmation, milestone collection, and the integrity of Studio payment evidence."
      nav={financeNav("/finance")}
    >
      <section className="grid gap-4 md:grid-cols-4">
        <StudioMetricCard label="Requested" value={formatCurrency(totalRequested)} hint="Total value currently raised across every Studio payment record." />
        <StudioMetricCard label="Paid" value={formatCurrency(totalPaid)} hint="Confirmed transfers already converted into project progress." />
        <StudioMetricCard label="Processing" value={String(snapshot.payments.filter((payment) => payment.status === "processing").length)} hint="Proofs uploaded and waiting on finance verification." />
        <StudioMetricCard label="Overdue" value={String(snapshot.payments.filter((payment) => payment.status === "overdue").length)} hint="Milestone payments that have passed the due lane." />
      </section>

      <section className="studio-panel rounded-[1.75rem] p-6">
        <div className="studio-kicker">Payment ledger</div>
        <div className="mt-5 space-y-4">
          {snapshot.payments.map((payment) => (
            <article key={payment.id} className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-[var(--studio-ink)]">{payment.label}</h3>
                  <p className="mt-2 text-sm text-[var(--studio-ink-soft)]">
                    {payment.projectId} · {payment.method.replaceAll("_", " ")}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-[var(--studio-ink)]">
                    {formatCurrency(payment.amount, payment.currency)}
                  </div>
                  <div className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                    {payment.status.replaceAll("_", " ")}
                  </div>
                </div>
              </div>
              {payment.proofUrl ? (
                <p className="mt-4 text-sm text-[var(--studio-ink-soft)]">
                  Proof received: {payment.proofName || payment.proofUrl}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </StudioWorkspaceShell>
  );
}
