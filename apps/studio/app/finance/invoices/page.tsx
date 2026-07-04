import {
  formatPaymentAmount,
  formatPaymentReference,
} from "@henryco/payment-surface/format";
import { translateSurfaceLabel } from "@henryco/i18n";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { requireStudioRoles } from "@/lib/studio/auth";
import { financeNav } from "@/lib/studio/navigation";
import { friendlyPaymentStatus } from "@/lib/studio/project-workspace-copy";
import { getStudioSnapshot } from "@/lib/studio/store";
import { StudioWorkspaceShell } from "@/components/studio/workspace/shell";

export default async function FinanceInvoicesPage() {
  await requireStudioRoles(["studio_owner", "finance"], "/finance/invoices");
  const snapshot = await getStudioSnapshot();
  const locale = await getStudioPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <StudioWorkspaceShell
      kicker="Invoice mirror"
      title="Invoice-ready references derived from Studio payment records."
      description="This keeps finance aligned even before a dedicated invoice composer is added."
      nav={financeNav("/finance/invoices")}
    >
      {/* TODO(wave1): multi-row invoice mirror (staff). payment.label is a
          Supabase-row text field — translate each via Promise.all +
          resolveLocalizedDynamicField in a follow-up wave. */}
      <section className="space-y-4">
        {snapshot.payments.map((payment) => (
          <article key={payment.id} className="studio-panel rounded-[1.75rem] p-6">
            {/* Same derived reference the customer payment surface shows, so
                finance can cross-check a transfer against the customer's Ref. */}
            <h3 className="text-xl font-semibold text-[var(--studio-ink)]">
              {formatPaymentReference(payment.id)}
            </h3>
            <p className="mt-2 text-sm text-[var(--studio-ink-soft)]">
              {payment.label} · {t(friendlyPaymentStatus(payment.status))}
            </p>
            <div className="mt-3 text-sm font-semibold text-[var(--studio-ink)]">
              {formatPaymentAmount(payment.amount, payment.currency)}
            </div>
          </article>
        ))}
      </section>
    </StudioWorkspaceShell>
  );
}
