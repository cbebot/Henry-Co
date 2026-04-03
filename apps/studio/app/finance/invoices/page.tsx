import { requireStudioRoles } from "@/lib/studio/auth";
import { financeNav } from "@/lib/studio/navigation";
import { getStudioSnapshot } from "@/lib/studio/store";
import { StudioWorkspaceShell } from "@/components/studio/workspace/shell";

export default async function FinanceInvoicesPage() {
  await requireStudioRoles(["studio_owner", "finance"], "/finance/invoices");
  const snapshot = await getStudioSnapshot();

  return (
    <StudioWorkspaceShell
      kicker="Invoice mirror"
      title="Invoice-ready references derived from Studio payment records."
      description="This keeps finance aligned even before a dedicated invoice composer is added."
      nav={financeNav("/finance/invoices")}
    >
      <section className="space-y-4">
        {snapshot.payments.map((payment) => (
          <article key={payment.id} className="studio-panel rounded-[1.75rem] p-6">
            <h3 className="text-xl font-semibold text-[var(--studio-ink)]">
              STUDIO-{payment.id.slice(0, 8).toUpperCase()}
            </h3>
            <p className="mt-2 text-sm text-[var(--studio-ink-soft)]">
              {payment.label} · {payment.status}
            </p>
          </article>
        ))}
      </section>
    </StudioWorkspaceShell>
  );
}
