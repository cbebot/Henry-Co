import { CalendarClock, FileSignature, Receipt } from "lucide-react";
import { StatusBadge } from "@/components/portal/status-badge";
import { invoiceStatusToken } from "@/lib/portal/status";
import { formatKobo, shortDate } from "@/lib/portal/helpers";
import type { StudioInvoice } from "@/types/portal";

export function InvoiceSummary({
  invoice,
  projectTitle,
  milestoneTitle,
}: {
  invoice: StudioInvoice;
  projectTitle?: string | null;
  milestoneTitle?: string | null;
}) {
  const status = invoiceStatusToken(invoice.status);
  const dueLabel = shortDate(invoice.dueDate);

  return (
    <section className="portal-card-elev relative overflow-hidden p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
            Invoice {invoice.invoiceNumber}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[var(--studio-ink)] sm:text-3xl">
            {formatKobo(invoice.amountKobo, invoice.currency)}
          </h1>
        </div>
        <StatusBadge label={status.label} tone={status.tone} />
      </div>

      <div className="portal-divider mt-5" />

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <FileSignature className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--studio-ink-soft)]" />
          <div className="min-w-0">
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
              For
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--studio-ink)]">
              {invoice.description || milestoneTitle || projectTitle || "Studio engagement"}
            </dd>
            {projectTitle ? (
              <dd className="mt-1 text-[12.5px] text-[var(--studio-ink-soft)]">{projectTitle}</dd>
            ) : null}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CalendarClock className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--studio-ink-soft)]" />
          <div className="min-w-0">
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
              Due
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--studio-ink)]">
              {dueLabel || "On confirmation"}
            </dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Receipt className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--studio-ink-soft)]" />
          <div className="min-w-0">
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
              Reference on transfer
            </dt>
            <dd className="mt-1 break-all text-sm font-semibold text-[var(--studio-ink)]">
              {invoice.invoiceNumber}
            </dd>
          </div>
        </div>

        {milestoneTitle ? (
          <div className="flex items-start gap-3">
            <FileSignature className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--studio-ink-soft)]" />
            <div className="min-w-0">
              <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                Milestone
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[var(--studio-ink)]">{milestoneTitle}</dd>
            </div>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
