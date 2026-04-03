import { formatCurrency } from "@/lib/env";
import { requireStudioRoles } from "@/lib/studio/auth";
import { financeNav } from "@/lib/studio/navigation";
import { getStudioSnapshot } from "@/lib/studio/store";
import { StudioWorkspaceShell } from "@/components/studio/workspace/shell";

export default async function FinancePaymentsPage() {
  await requireStudioRoles(["studio_owner", "finance"], "/finance/payments");
  const snapshot = await getStudioSnapshot();

  return (
    <StudioWorkspaceShell
      kicker="Payment records"
      title="Every deposit and milestone checkpoint in one list."
      description="Finance can use this ledger to verify proof and cross-check the project timeline."
      nav={financeNav("/finance/payments")}
    >
      <section className="space-y-4">
        {snapshot.payments.map((payment) => (
          <article key={payment.id} className="studio-panel rounded-[1.75rem] p-6">
            <h3 className="text-xl font-semibold text-[var(--studio-ink)]">{payment.label}</h3>
            <p className="mt-2 text-sm text-[var(--studio-ink-soft)]">
              {payment.projectId} · {payment.status}
            </p>
            <div className="mt-4 text-2xl font-semibold text-[var(--studio-ink)]">
              {formatCurrency(payment.amount, payment.currency)}
            </div>
          </article>
        ))}
      </section>
    </StudioWorkspaceShell>
  );
}
