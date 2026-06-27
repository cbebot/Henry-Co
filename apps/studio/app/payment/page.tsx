import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FileQuestion, Sparkles } from "lucide-react";

import { resolveLocalizedDynamicField, type AppLocale } from "@henryco/i18n/server";
import { getStudioClientPagesCopy } from "@henryco/i18n";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { getStudioLoginUrl } from "@/lib/studio/links";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { getClientPortalViewer } from "@/lib/portal/auth";
import {
  getInvoiceByToken,
  getOutstandingInvoicesForViewer,
} from "@/lib/portal/data";
import { formatKobo, shortDate } from "@/lib/portal/helpers";
import { invoiceStatusToken } from "@/lib/portal/status";
import { BankDetails } from "@/components/portal/bank-details";
import { InvoiceSummary } from "@/components/portal/invoice-summary";
import { PaymentForm } from "@/components/portal/payment-form";
import { PortalEmptyState } from "@/components/portal/empty-state";
import { StatusBadge } from "@/components/portal/status-badge";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Pay invoice · HenryCo Studio",
  description: "Securely pay your HenryCo Studio invoice and submit proof of payment.",
  robots: { index: false, follow: false },
};

export default async function StudioPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ invoice?: string; verified?: string }>;
}) {
  const { invoice: invoiceTokenParam } = await searchParams;
  const token = (invoiceTokenParam ?? "").trim();
  const viewer = await getClientPortalViewer();
  const catalog = await getStudioCatalog();
  const locale = await getStudioPublicLocale();
  const copy = getStudioClientPagesCopy(locale);

  // Scenario A — token-based access (unauthenticated or otherwise).
  if (token) {
    const lookup = await getInvoiceByToken(token);
    if (lookup) {
      return renderInvoicePay(
        lookup.invoice,
        lookup.project ?? null,
        catalog,
        /* token */ token,
        locale,
        copy,
      );
    }
    return renderInvoiceNotFound(copy);
  }

  // Scenarios B & C — authenticated portal user, or direct nav.
  if (!viewer) {
    redirect(getStudioLoginUrl("/payment"));
  }

  const invoices = await getOutstandingInvoicesForViewer(viewer);

  if (invoices.length === 0) {
    return (
      <main className="portal-shell mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <PortalEmptyState
          icon={Sparkles}
          title={copy.payment.allPaidTitle}
          body={copy.payment.allPaidBody}
          action={
            <Link href="/client/dashboard" className="portal-button portal-button-secondary">
              {copy.payment.openClientPortal}
            </Link>
          }
        />
      </main>
    );
  }

  if (invoices.length === 1) {
    return renderInvoicePay(invoices[0], null, catalog, /* token */ null, locale, copy);
  }

  return (
    <main className="portal-shell mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <header className="space-y-2">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
          {copy.payment.outstandingInvoices}
        </div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)] sm:text-3xl">
          {copy.payment.chooseInvoice}
        </h1>
        <p className="max-w-xl text-sm leading-6 text-[var(--studio-ink-soft)]">
          {copy.payment.chooseInvoiceBody.replace("{count}", String(invoices.length))}
        </p>
      </header>

      {/* TODO(wave1): multi-row invoice picker — each invoice.description is
          a Supabase-row text field. Wrap with Promise.all +
          resolveLocalizedDynamicField in a follow-up wave (cost vs. value
          deferred for list view; the per-invoice surface at
          /client/payment/[invoiceId] is already wrapped). */}
      <div className="mt-6 space-y-3">
        {invoices.map((invoice) => {
          const status = invoiceStatusToken(invoice.status);
          return (
            <Link
              key={invoice.id}
              href={`/client/payment/${invoice.id}`}
              className="portal-card group flex items-center justify-between gap-4 px-5 py-4 transition hover:border-[rgba(151,244,243,0.4)]"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                  <span>{invoice.invoiceNumber}</span>
                  {invoice.dueDate ? (
                    <span>· {copy.payment.duePrefix} {shortDate(invoice.dueDate)}</span>
                  ) : null}
                </div>
                <div className="mt-1 truncate text-base font-semibold text-[var(--studio-ink)]">
                  {invoice.description || copy.payment.studioInvoice}
                </div>
                <div className="mt-2">
                  <StatusBadge tone={status.tone} label={status.label} size="sm" />
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                <span className="text-base font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
                  {formatKobo(invoice.amountKobo, invoice.currency)}
                </span>
                <ArrowRight className="h-4 w-4 text-[var(--studio-ink-soft)] transition group-hover:text-[var(--studio-ink)]" />
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

function renderInvoiceNotFound(copy: ReturnType<typeof getStudioClientPagesCopy>) {
  return (
    <main className="portal-shell mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <PortalEmptyState
        icon={FileQuestion}
        title={copy.payment.notFoundTitle}
        body={copy.payment.notFoundBody}
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/client/dashboard" className="portal-button portal-button-primary">
              {copy.payment.openClientPortal}
            </Link>
            <Link href="/contact" className="portal-button portal-button-secondary">
              {copy.payment.contactSupport}
            </Link>
          </div>
        }
      />
    </main>
  );
}

async function renderInvoicePay(
  invoice: import("@/types/portal").StudioInvoice,
  project: import("@/types/portal").ClientProject | null,
  catalog: Awaited<ReturnType<typeof getStudioCatalog>>,
  token: string | null,
  locale: AppLocale,
  copy: ReturnType<typeof getStudioClientPagesCopy>,
) {
  const platform = catalog.platform;
  const amountLabel = formatKobo(invoice.amountKobo, invoice.currency);
  const isPaid = invoice.status === "paid";
  const isPending = invoice.status === "pending_verification";

  // WAVE1 — wrap Supabase-row text fields through resolveLocalizedDynamicField
  // so non-EN locales hit the cached DeepL pipeline. Single-row invoice
  // surface so the DeepL cost is acceptable.
  const [localizedInvoiceDescription, localizedProjectTitle] = await Promise.all([
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
  ]);
  const localizedInvoice = { ...invoice, description: localizedInvoiceDescription };

  return (
    <main className="portal-shell mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <h1 className="sr-only">
        {copy.payment.payInvoiceSr} {localizedInvoice.invoiceNumber} · {amountLabel}
      </h1>

      <div className="space-y-5">
        <InvoiceSummary invoice={localizedInvoice} projectTitle={project ? localizedProjectTitle : null} />

        {isPaid ? (
          <div className="portal-card-elev p-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[rgba(141,232,179,0.45)] bg-[rgba(141,232,179,0.12)] text-[#8de8b3]">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)]">
              {copy.payment.fullyPaidTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--studio-ink-soft)]">
              {copy.payment.fullyPaidBody}
            </p>
            <Link
              href="/client/dashboard"
              className="portal-button portal-button-primary mt-5"
            >
              {copy.payment.openClientPortal}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : isPending ? (
          <div className="portal-card-elev p-5 sm:p-6">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
              {copy.payment.verificationTitle}
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--studio-ink-soft)]">
              {copy.payment.verificationBody}
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
              invoiceToken={token}
              invoiceNumber={localizedInvoice.invoiceNumber}
              amountLabel={amountLabel}
            />
            <div className="rounded-2xl border border-dashed border-[var(--studio-line)] bg-[rgba(255,255,255,0.02)] px-5 py-4 text-[12.5px] leading-5 text-[var(--studio-ink-soft)]">
              {copy.payment.cardComingSoon}
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[12.5px] text-[var(--studio-ink-soft)]">
          <Link
            href="/client/dashboard"
            className="inline-flex items-center gap-1.5 font-semibold transition hover:text-[var(--studio-ink)]"
          >
            {copy.payment.backToPortal}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {platform.paymentSupportEmail ? (
            <a
              href={`mailto:${platform.paymentSupportEmail}`}
              className="inline-flex items-center gap-1.5 font-semibold transition hover:text-[var(--studio-ink)]"
            >
              {copy.payment.contactFinance}
            </a>
          ) : null}
        </div>
      </div>
    </main>
  );
}
