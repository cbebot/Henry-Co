import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

import { resolveLocalizedDynamicField } from "@henryco/i18n/server";
import { requireClientPortalViewer } from "@/lib/portal/auth";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { getClientPortalSnapshot, getInvoiceByIdForViewer } from "@/lib/portal/data";
import { formatKobo } from "@/lib/portal/helpers";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { BankDetails } from "@/components/portal/bank-details";
import { InvoiceSummary } from "@/components/portal/invoice-summary";
import { PaymentForm } from "@/components/portal/payment-form";

export const metadata: Metadata = {
  title: "Pay invoice",
};

export default async function ClientPaymentByIdPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  const viewer = await requireClientPortalViewer(`/client/payment/${invoiceId}`);
  const invoice = await getInvoiceByIdForViewer(viewer, invoiceId);
  if (!invoice) notFound();

  const snapshot = await getClientPortalSnapshot(viewer);
  const project = snapshot.projects.find((p) => p.id === invoice.projectId) || null;
  const milestone =
    invoice.milestoneId
      ? snapshot.milestones.find((m) => m.id === invoice.milestoneId) || null
      : null;

  const catalog = await getStudioCatalog();
  const platform = catalog.platform;
  const amountLabel = formatKobo(invoice.amountKobo, invoice.currency);
  const isPaid = invoice.status === "paid";
  const isPending = invoice.status === "pending_verification";

  // WAVE1 — wrap Supabase-row text fields through resolveLocalizedDynamicField
  // so non-EN locales hit the cached DeepL pipeline. Single-row payment
  // surface, so the DeepL cost is acceptable.
  const locale = await getStudioPublicLocale();
  const [localizedInvoiceDescription, localizedProjectTitle, localizedMilestoneTitle] =
    await Promise.all([
      resolveLocalizedDynamicField({
        record: invoice as unknown as Record<string, unknown>,
        field: "description",
        locale,
        fallback: invoice.description ?? "",
        machineTranslate: locale !== "en",
      }),
      project
        ? resolveLocalizedDynamicField({
            record: project as unknown as Record<string, unknown>,
            field: "title",
            locale,
            fallback: project.title ?? "",
            machineTranslate: locale !== "en",
          })
        : Promise.resolve(""),
      milestone
        ? resolveLocalizedDynamicField({
            record: milestone as unknown as Record<string, unknown>,
            field: "title",
            locale,
            fallback: milestone.title ?? "",
            machineTranslate: locale !== "en",
          })
        : Promise.resolve(""),
    ]);
  const localizedInvoice = { ...invoice, description: localizedInvoiceDescription };

  return (
    <div className="space-y-5">
      <Link
        href="/client/payments"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--studio-ink-soft)] transition hover:text-[var(--studio-ink)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All payments
      </Link>

      <InvoiceSummary
        invoice={localizedInvoice}
        projectTitle={project ? localizedProjectTitle : null}
        milestoneTitle={milestone ? localizedMilestoneTitle : null}
      />

      {isPaid ? (
        <div className="portal-card-elev p-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[rgba(141,232,179,0.45)] bg-[rgba(141,232,179,0.12)] text-[#8de8b3]">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)]">
            This invoice is fully paid
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--studio-ink-soft)]">
            Thank you. The next milestone is unlocked. The team will keep you posted as we progress.
          </p>
          {project ? (
            <Link
              href={`/client/projects/${project.id}`}
              className="portal-button portal-button-primary mt-5"
            >
              Open project
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      ) : isPending ? (
        <div className="portal-card-elev p-5 sm:p-6">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
            Verification in progress
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--studio-ink-soft)]">
            We have your payment proof. Finance is verifying — usually within one business day. You
            do not need to do anything else.
          </p>
        </div>
      ) : (
        <>
          <BankDetails
            bankName={platform.paymentBankName}
            accountName={platform.paymentAccountName}
            accountNumber={platform.paymentAccountNumber}
            amountLabel={amountLabel}
          />
          <PaymentForm
            invoiceId={localizedInvoice.id}
            invoiceToken={null}
            invoiceNumber={localizedInvoice.invoiceNumber}
            amountLabel={amountLabel}
          />
        </>
      )}
    </div>
  );
}
