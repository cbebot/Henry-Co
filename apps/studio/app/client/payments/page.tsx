import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Receipt } from "lucide-react";

import { requireClientPortalViewer } from "@/lib/portal/auth";
import { getClientPortalSnapshot } from "@/lib/portal/data";
import { formatKobo, shortDate } from "@/lib/portal/helpers";
import { invoiceStatusToken, paymentStatusToken } from "@/lib/portal/status";
import { PortalEmptyState } from "@/components/portal/empty-state";
import { StatusBadge } from "@/components/portal/status-badge";

export const metadata: Metadata = {
  title: "Payments",
};

export default async function ClientPaymentsPage() {
  const viewer = await requireClientPortalViewer("/client/payments");
  const snapshot = await getClientPortalSnapshot(viewer);

  const outstanding = snapshot.invoices.filter(
    (invoice) =>
      invoice.status === "sent" ||
      invoice.status === "overdue" ||
      invoice.status === "pending_verification"
  );
  const settled = snapshot.invoices.filter((invoice) => invoice.status === "paid");
  const projectsById = new Map(snapshot.projects.map((p) => [p.id, p.title]));

  const totalOutstanding = outstanding
    .filter((i) => i.status !== "pending_verification")
    .reduce((sum, i) => sum + i.amountKobo, 0);
  const totalPaid = settled.reduce((sum, i) => sum + i.amountKobo, 0);

  if (snapshot.invoices.length === 0 && snapshot.payments.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
            Billing & history
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)] sm:text-3xl">
            Payments
          </h1>
        </header>
        <PortalEmptyState
          icon={Receipt}
          title="No invoices or payment history yet"
          body="Once a project starts and we issue an invoice, this is where you will pay it and see verified payments listed alongside their reference numbers."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
          Billing & history
        </div>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)] sm:text-3xl">
          Payments
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--studio-ink-soft)]">
          Pay outstanding invoices, see what is being verified, and review every payment you&apos;ve made
          to HenryCo Studio.
        </p>
      </header>

      <section className="portal-card-elev grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
        <Stat label="Outstanding" value={formatKobo(totalOutstanding, "NGN")} accent="warn" />
        <Stat label="Paid to date" value={formatKobo(totalPaid, "NGN")} accent="success" />
        <Stat label="Verifying" value={String(outstanding.filter((i) => i.status === "pending_verification").length)} />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
          Outstanding invoices
        </h2>
        {outstanding.length === 0 ? (
          <p className="rounded-2xl border border-[var(--studio-line)] bg-[rgba(255,255,255,0.03)] px-5 py-4 text-[13px] text-[var(--studio-ink-soft)]">
            You&apos;re all caught up. Nothing to pay right now.
          </p>
        ) : (
          <div className="grid gap-3">
            {outstanding.map((invoice) => {
              const status = invoiceStatusToken(invoice.status);
              const projectTitle = projectsById.get(invoice.projectId) || null;
              const payable = invoice.status === "sent" || invoice.status === "overdue";
              return (
                <article
                  key={invoice.id}
                  className="portal-card flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:p-5"
                >
                  <div className="min-w-0">
                    <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                      {invoice.invoiceNumber}
                      {invoice.dueDate ? ` · Due ${shortDate(invoice.dueDate)}` : ""}
                    </div>
                    <div className="mt-1 truncate text-[15px] font-semibold text-[var(--studio-ink)]">
                      {invoice.description || "Studio invoice"}
                    </div>
                    {projectTitle ? (
                      <div className="mt-0.5 text-[12px] text-[var(--studio-ink-soft)]">{projectTitle}</div>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[var(--studio-ink-soft)]">
                      <StatusBadge tone={status.tone} label={status.label} size="sm" />
                      <span className="font-semibold text-[var(--studio-ink)]">
                        {formatKobo(invoice.amountKobo, invoice.currency)}
                      </span>
                    </div>
                  </div>
                  {payable ? (
                    <Link
                      href={`/client/payment/${invoice.id}`}
                      className="portal-button portal-button-primary self-start"
                    >
                      Pay now
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {snapshot.payments.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
            Payment history
          </h2>
          <div className="portal-card divide-y divide-[var(--studio-line)]">
            {snapshot.payments.map((payment) => {
              const status = paymentStatusToken(payment.status);
              const projectTitle = projectsById.get(payment.projectId) || null;
              return (
                <article
                  key={payment.id}
                  className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5"
                >
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                      {payment.paymentReference || "Bank transfer"}
                    </div>
                    <div className="mt-0.5 text-[14px] font-semibold text-[var(--studio-ink)]">
                      {formatKobo(payment.amountKobo, payment.currency)}
                    </div>
                    <div className="mt-1 text-[11.5px] text-[var(--studio-ink-soft)]">
                      {projectTitle ? `${projectTitle} · ` : ""}
                      Submitted {shortDate(payment.submittedAt) || "—"}
                      {payment.verifiedAt ? ` · Verified ${shortDate(payment.verifiedAt)}` : ""}
                    </div>
                    {payment.status === "rejected" && payment.rejectionReason ? (
                      <div className="mt-2 rounded-xl border border-[rgba(255,143,143,0.4)] bg-[rgba(255,143,143,0.08)] px-3 py-2 text-[12px] text-[#ffb8b8]">
                        Rejected: {payment.rejectionReason}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge tone={status.tone} label={status.label} size="sm" />
                    {payment.status === "rejected" && payment.invoiceId ? (
                      <Link
                        href={`/client/payment/${payment.invoiceId}`}
                        className="text-[12.5px] font-semibold text-[var(--studio-signal)] hover:underline"
                      >
                        Resubmit
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  accent = "neutral",
}: {
  label: string;
  value: string;
  accent?: "neutral" | "success" | "warn";
}) {
  const valueClass =
    accent === "success"
      ? "text-[#bdf2cf]"
      : accent === "warn"
      ? "text-[#f3d28a]"
      : "text-[var(--studio-ink)]";
  return (
    <div className="rounded-2xl border border-[var(--studio-line)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
        {label}
      </div>
      <div className={`mt-2 text-xl font-semibold tracking-[-0.01em] ${valueClass}`}>{value}</div>
    </div>
  );
}
