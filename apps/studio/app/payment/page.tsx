import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FileQuestion, Sparkles } from "lucide-react";

import { PaymentSurface, buildPaymentSurfaceContext } from "@henryco/payment-surface";
import { translateSurfaceLabel } from "@henryco/i18n";
import { resolveLocalizedDynamicField, type AppLocale } from "@henryco/i18n/server";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { getStudioAccountUrl, getStudioLoginUrl } from "@/lib/studio/links";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { getClientPortalViewer } from "@/lib/portal/auth";
import {
  getInvoiceByToken,
  getLatestPaymentSubmissionForInvoice,
  getOutstandingInvoicesForViewer,
} from "@/lib/portal/data";
import { formatKobo, shortDate } from "@/lib/portal/helpers";
import { invoiceStatusToken } from "@/lib/portal/status";
import { isPortalPaymentSurfaceEnabled } from "@/lib/studio/portal-payment-flag";
import {
  invoiceProofOnFile,
  portalInvoiceToPaymentRecordView,
} from "@/lib/studio/portal-payment-mapping";
import { STUDIO_PAYMENT_THEME } from "@/lib/studio/payment-surface-theme";
import { BankDetails } from "@/components/portal/bank-details";
import { InvoiceSummary } from "@/components/portal/invoice-summary";
import { PaymentForm } from "@/components/portal/payment-form";
import { PortalEmptyState } from "@/components/portal/empty-state";
import { StatusBadge } from "@/components/portal/status-badge";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Pay invoice · Henry Onyx Studio",
  description: "Securely pay your Henry Onyx Studio invoice and submit proof of payment.",
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
      );
    }
    return renderInvoiceNotFound();
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
          title="You're all paid up"
          body="There are no outstanding invoices on your account. As soon as a new milestone invoice is issued, it will show up here and inside your client portal."
          action={
            <Link href="/client/dashboard" className="portal-button portal-button-secondary">
              Open client portal
            </Link>
          }
        />
      </main>
    );
  }

  if (invoices.length === 1) {
    return renderInvoicePay(invoices[0], null, catalog, /* token */ null, locale);
  }

  return (
    <main className="portal-shell mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <header className="space-y-2">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
          Outstanding invoices
        </div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)] sm:text-3xl">
          Choose an invoice to pay
        </h1>
        <p className="max-w-xl text-sm leading-6 text-[var(--studio-ink-soft)]">
          You have {invoices.length} outstanding invoices. Pick one to view bank details and submit
          proof of payment.
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
                  {invoice.dueDate ? <span>· Due {shortDate(invoice.dueDate)}</span> : null}
                </div>
                <div className="mt-1 truncate text-base font-semibold text-[var(--studio-ink)]">
                  {invoice.description || "Studio invoice"}
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

function renderInvoiceNotFound() {
  return (
    <main className="portal-shell mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <PortalEmptyState
        icon={FileQuestion}
        title="We couldn't find that invoice"
        body="The link may have expired or been mistyped. If you received the link by email, try opening it directly. Otherwise, log in to your client portal to see your live invoices."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/client/dashboard" className="portal-button portal-button-primary">
              Open client portal
            </Link>
            <Link href="/contact" className="portal-button portal-button-secondary">
              Contact support
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
) {
  // ——— Shared data-load: identical for the legacy and flag-on renders. ———
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

  // ——— Flag on: shared @henryco/payment-surface rendering. Token/access
  // semantics are untouched — the same PaymentForm posts the same fields
  // (invoiceId, invoiceToken, bank reference, proof, notes) to the same
  // submitPaymentProofAction. ———
  if (isPortalPaymentSurfaceEnabled()) {
    const t = (text: string) => translateSurfaceLabel(locale, text);
    // Real proof-on-file details for the verifying state only; read-only.
    const submission = isPending
      ? await getLatestPaymentSubmissionForInvoice(invoice.id)
      : null;
    const view = portalInvoiceToPaymentRecordView(localizedInvoice, {
      label: localizedInvoiceDescription.trim() || t("Studio invoice"),
      statusLabel: invoiceStatusToken(invoice.status, locale).label,
      proof: invoiceProofOnFile(invoice, submission),
    });
    const ctx = buildPaymentSurfaceContext({
      payment: view,
      record: {
        title: project ? localizedProjectTitle : t("Henry Onyx Studio"),
        back: { href: "/client/dashboard", label: t("Back to client portal") },
        account: { href: getStudioAccountUrl(), label: t("Henry Onyx account home") },
        primaryCta: { href: "/client/dashboard", label: t("Open client portal") },
      },
      platform: {
        bankName: platform.paymentBankName,
        accountName: platform.paymentAccountName,
        accountNumber: platform.paymentAccountNumber,
        supportEmail: platform.paymentSupportEmail,
        supportWhatsApp: platform.paymentSupportWhatsApp,
      },
      copy: {
        bodyByStatus: {
          pending: t(
            "Send your transfer using the verified company details below, then attach your proof so finance can confirm and keep your project moving.",
          ),
          processing: t(
            "We have your payment proof. Finance is verifying — usually within one business day. You do not need to do anything else.",
          ),
          paid: t(
            "This invoice is fully paid. Thank you — your client portal shows the milestone unlock and what the team is working on next.",
          ),
        },
        guideTitle: t("Pay by bank transfer into the verified Henry Onyx account"),
        instructions: t(
          "Use your invoice number as the transfer reference. Proof can be a bank receipt, debit alert screenshot, or PDF — anything showing amount, date, and destination.",
        ),
        proofHint: t(
          "After the transfer, attach your proof in the form below — finance verifies within one business day.",
        ),
        receiptText: t(
          "Confirmed on {date}.{proof} Your client portal shows the milestone unlock and what the team is working on next.",
        ),
      },
      theme: STUDIO_PAYMENT_THEME,
    });

    return (
      <>
        <PaymentSurface ctx={ctx} />
        {view.status === "pending" ? (
          <div className="mx-auto w-full max-w-[64rem] px-5 pb-12 sm:px-8 lg:px-10">
            <PaymentForm
              invoiceId={localizedInvoice.id}
              invoiceToken={token}
              invoiceNumber={localizedInvoice.invoiceNumber}
              amountLabel={amountLabel}
            />
          </div>
        ) : null}
      </>
    );
  }

  // ——— Flag off (default): the existing portal rendering, unchanged. ———
  return (
    <main className="portal-shell mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <h1 className="sr-only">
        Pay invoice {localizedInvoice.invoiceNumber} · {amountLabel}
      </h1>

      <div className="space-y-5">
        <InvoiceSummary invoice={localizedInvoice} projectTitle={project ? localizedProjectTitle : null} />

        {isPaid ? (
          <div className="portal-card-elev p-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[rgba(141,232,179,0.45)] bg-[rgba(141,232,179,0.12)] text-[#8de8b3]">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)]">
              This invoice is fully paid
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--studio-ink-soft)]">
              Thank you. Your client portal shows the milestone unlock and what the team is working on
              next.
            </p>
            <Link
              href="/client/dashboard"
              className="portal-button portal-button-primary mt-5"
            >
              Open client portal
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : isPending ? (
          <div className="portal-card-elev p-5 sm:p-6">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
              Verification in progress
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--studio-ink-soft)]">
              We have your payment proof. Finance is verifying — usually within one business day. You
              do not need to do anything else. We will email you and update this page as soon as the
              transfer is confirmed.
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
              Card payments are coming soon. For now, bank transfer is the fastest way to confirm and
              keep your project moving.
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[12.5px] text-[var(--studio-ink-soft)]">
          <Link
            href="/client/dashboard"
            className="inline-flex items-center gap-1.5 font-semibold transition hover:text-[var(--studio-ink)]"
          >
            Back to client portal
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {platform.paymentSupportEmail ? (
            <a
              href={`mailto:${platform.paymentSupportEmail}`}
              className="inline-flex items-center gap-1.5 font-semibold transition hover:text-[var(--studio-ink)]"
            >
              Contact finance
            </a>
          ) : null}
        </div>
      </div>
    </main>
  );
}
