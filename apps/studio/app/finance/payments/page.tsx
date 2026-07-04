import {
  formatPaymentAmount,
  formatPaymentDueDate,
  formatPaymentReference,
} from "@henryco/payment-surface/format";
import { translateSurfaceLabel } from "@henryco/i18n";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { requireStudioRoles } from "@/lib/studio/auth";
import { financeNav } from "@/lib/studio/navigation";
import { friendlyPaymentStatus } from "@/lib/studio/project-workspace-copy";
import { getStudioSnapshot } from "@/lib/studio/store";
import { StudioWorkspaceShell } from "@/components/studio/workspace/shell";

export default async function FinancePaymentsPage() {
  await requireStudioRoles(["studio_owner", "finance"], "/finance/payments");
  const snapshot = await getStudioSnapshot();
  const locale = await getStudioPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <StudioWorkspaceShell
      kicker="Payment records"
      title="Every deposit and milestone checkpoint in one list."
      description="Finance can use this ledger to verify proof and cross-check the project timeline."
      nav={financeNav("/finance/payments")}
    >
      {/* TODO(wave1): multi-row payment record list (staff). payment.label
          is a Supabase-row text field — translate each via Promise.all +
          resolveLocalizedDynamicField in a follow-up wave. */}
      <section className="space-y-4">
        {snapshot.payments.map((payment) => (
          <article key={payment.id} className="studio-panel rounded-[1.75rem] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)]">
                  {formatPaymentReference(payment.id)}
                </div>
                <h3 className="mt-1 text-xl font-semibold text-[var(--studio-ink)]">
                  {payment.label}
                </h3>
                <p className="mt-2 text-sm text-[var(--studio-ink-soft)]">
                  {payment.projectId} · {t(friendlyPaymentStatus(payment.status))}
                  {payment.dueDate
                    ? ` · ${t("Due")} ${formatPaymentDueDate(payment.dueDate)}`
                    : ""}
                </p>
                {payment.proofName ? (
                  <p className="mt-1 text-[12.5px] text-[var(--studio-ink-soft)]">
                    {t("Proof on file")}: {payment.proofName}
                  </p>
                ) : null}
              </div>
              <div className="text-2xl font-semibold text-[var(--studio-ink)]">
                {formatPaymentAmount(payment.amount, payment.currency)}
              </div>
            </div>
          </article>
        ))}
      </section>
    </StudioWorkspaceShell>
  );
}
