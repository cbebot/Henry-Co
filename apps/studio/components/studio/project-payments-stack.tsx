import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, FileCheck2, UploadCloud } from "lucide-react";
import { StudioFileField } from "@/components/studio/studio-file-field";
import { StudioPaymentGuide } from "@/components/studio/payment-guide";
import { StudioSubmitButton } from "@/components/studio/submit-button";
import { setPaymentStatusAction, uploadPaymentProofAction } from "@/lib/studio/actions";
import { formatCurrency } from "@/lib/env";
import { studioPaymentCheckpointCopy } from "@/lib/studio/payment-status-copy";
import { friendlyPaymentStatus } from "@/lib/studio/project-workspace-copy";
import type { StudioPlatformSettings } from "@/lib/studio/settings-shared";
import type { StudioPayment } from "@/lib/studio/types";
import { getStudioProjectCopy, type StudioProjectCopy } from "@henryco/i18n";
import { getStudioPublicLocale } from "@/lib/locale-server";

type PaymentsStackCopy = StudioProjectCopy["paymentsStack"];

type BreakdownLine = { label: string; amount: number; detail?: string | null };

type Props = {
  payments: StudioPayment[];
  paymentOverview: {
    total: number;
    paid: number;
    processing: number;
    outstanding: number;
    nextPayment: StudioPayment | null;
    approvedMilestones: number;
    totalMilestones: number;
  };
  pricingBreakdown: BreakdownLine[];
  proposalCurrency: string;
  platform: StudioPlatformSettings;
  redirectPath: string;
  access: string;
  isFinance: boolean;
  isStaff: boolean;
  variant: "priority" | "summary";
  /** Anchor for in-page CTAs (priority variant only) */
  sectionId?: string;
};

function supportWhatsappHref(value: string | null) {
  if (!value) return null;
  const digits = value.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

function paymentWorkspaceHref(paymentId: string, access: string) {
  return `/pay/${paymentId}${access ? `?access=${encodeURIComponent(access)}` : ""}`;
}

function PaymentProofStatus({ payment, copy }: { payment: StudioPayment; copy: PaymentsStackCopy }) {
  const proofName = payment.proofName?.trim() || null;
  const proofOnFile = Boolean(proofName || payment.proofUrl);

  if (payment.status === "paid") {
    return (
      <div className="mt-4 rounded-[1.15rem] border border-[rgba(141,232,179,0.32)] bg-[rgba(141,232,179,0.08)] px-4 py-3">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#8de8b3]" aria-hidden />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--studio-ink)]">
              {proofOnFile ? copy.proofVerifiedTitle : copy.paymentVerifiedTitle}
            </div>
            <p className="mt-1 text-xs leading-5 text-[var(--studio-ink-soft)]">
              {proofName
                ? copy.proofVerifiedBody(proofName)
                : copy.paymentVerifiedBody}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (proofOnFile) {
    return (
      <div className="mt-4 rounded-[1.15rem] border border-[rgba(151,244,243,0.28)] bg-[rgba(151,244,243,0.07)] px-4 py-3">
        <div className="flex items-start gap-3">
          <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--studio-signal)]" aria-hidden />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--studio-ink)]">{copy.proofOnFileTitle}</div>
            <p className="mt-1 text-xs leading-5 text-[var(--studio-ink-soft)]">
              {proofName
                ? copy.proofOnFileBodyNamed(proofName)
                : copy.proofOnFileBody}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-[1.15rem] border border-[rgba(255,197,128,0.28)] bg-[rgba(255,197,128,0.07)] px-4 py-3">
      <div className="flex items-start gap-3">
        <UploadCloud className="mt-0.5 h-4 w-4 shrink-0 text-[#f0c89a]" aria-hidden />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--studio-ink)]">{copy.noProofTitle}</div>
          <p className="mt-1 text-xs leading-5 text-[var(--studio-ink-soft)]">
            {copy.noProofBody}
          </p>
        </div>
      </div>
    </div>
  );
}

export async function ProjectPaymentsStack({
  payments,
  paymentOverview,
  pricingBreakdown,
  proposalCurrency,
  platform,
  redirectPath,
  access,
  isFinance,
  isStaff,
  variant,
  sectionId,
}: Props) {
  const locale = await getStudioPublicLocale();
  const copy = getStudioProjectCopy(locale).paymentsStack;
  const supportWhatsapp = supportWhatsappHref(platform.paymentSupportWhatsApp);
  const isPriority = variant === "priority";

  return (
    <section
      id={isPriority && sectionId ? sectionId : undefined}
      className={`scroll-mt-28 rounded-[1.75rem] border p-6 ${
        isPriority
          ? "border-[rgba(151,244,243,0.35)] bg-[linear-gradient(180deg,rgba(12,48,58,0.55),rgba(6,18,26,0.92))] shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
          : "studio-panel border-[var(--studio-line)]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="studio-kicker">{isPriority ? copy.kickerActionRequired : copy.kickerPayments}</div>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--studio-ink)] sm:text-2xl">
            {isPriority ? copy.headingPriority : copy.headingSummary}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--studio-ink-soft)]">
            {isPriority
              ? copy.introPriority
              : copy.introSummary}
          </p>
          {isPriority ? (
            <div className="mt-4 rounded-[1.25rem] border border-[rgba(151,244,243,0.28)] bg-black/25 px-4 py-3 text-sm leading-6 text-[var(--studio-ink-soft)]">
              <span className="font-semibold text-[var(--studio-ink)]">{copy.whatHappensNextLabel}</span>
              {copy.whatHappensNextBodyPrefix}<strong className="text-[var(--studio-ink)]">{copy.uploadPaymentProofPhrase}</strong>{copy.whatHappensNextBodySuffix}
            </div>
          ) : null}
        </div>
      </div>

      {/* Stat grid: 2x2 on mobile (balanced), 4-up on desktop. The
       * earlier md:grid-cols-4 stacked one column at a time on narrow
       * widths and felt off-balance — 2x2 keeps it square and calm. */}
      <div
        className={`mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 ${
          isPriority
            ? "rounded-[1.5rem] border border-[var(--studio-line)] bg-black/15 p-4"
            : ""
        }`}
      >
        {[
          [copy.statTotal, formatCurrency(paymentOverview.total, proposalCurrency)],
          [copy.statPaid, formatCurrency(paymentOverview.paid, proposalCurrency)],
          [copy.statProcessing, formatCurrency(paymentOverview.processing, proposalCurrency)],
          [copy.statOutstanding, formatCurrency(paymentOverview.outstanding, proposalCurrency)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[1.2rem] border border-[var(--studio-line)] bg-black/10 px-3 py-3 sm:px-4 sm:py-4">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-signal)]">{label}</div>
            <div className="mt-1.5 truncate text-[15px] font-semibold tabular-nums text-[var(--studio-ink)] sm:text-lg">{value}</div>
          </div>
        ))}
      </div>

      {/* Proposal-style pricing breakdown is reference detail. For
       * clients it's the third place they see the same numbers (hero,
       * stat grid, then this). Collapse it behind a quiet disclosure so
       * the action — paying and uploading proof — stays the visible
       * surface. Finance still sees it expanded by default for audit.
       * This is the "long card good for nothing" we trimmed. */}
      {pricingBreakdown.length > 0 ? (
        <details
          className="group/breakdown mt-5 rounded-[1.35rem] border border-[var(--studio-line)] bg-black/10 px-4 py-3"
          open={isFinance || isStaff}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-signal)] outline-none [&::-webkit-details-marker]:hidden">
            <span>{copy.proposalPricingDetail}</span>
            <span className="text-[var(--studio-ink-soft)] transition group-open/breakdown:rotate-180">▾</span>
          </summary>
          <div className="mt-3 space-y-2.5">
            {pricingBreakdown.map((line) => (
              <div key={`${line.label}-${line.amount}`} className="flex items-start justify-between gap-4 border-t border-[var(--studio-line)] pt-2.5 first:border-t-0 first:pt-0">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[var(--studio-ink)]">{line.label}</div>
                  {line.detail ? (
                    <div className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-[var(--studio-ink-soft)]">{line.detail}</div>
                  ) : null}
                </div>
                <div className="shrink-0 text-sm font-semibold tabular-nums text-[var(--studio-signal)]">
                  {formatCurrency(line.amount, proposalCurrency)}
                </div>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      <div className="mt-6">
        <StudioPaymentGuide
          title={copy.guideTitle}
          amount={paymentOverview.nextPayment?.amount || paymentOverview.outstanding}
          currency={paymentOverview.nextPayment?.currency || proposalCurrency}
          statusLabel={paymentOverview.nextPayment ? friendlyPaymentStatus(paymentOverview.nextPayment.status) : copy.statusReadyToPay}
          dueLabel={
            paymentOverview.nextPayment?.dueDate
              ? `${copy.duePrefix}${new Date(paymentOverview.nextPayment.dueDate).toLocaleDateString("en-NG")}`
              : copy.payWhenReady
          }
          instructions={platform.paymentInstructions}
          bankName={platform.paymentBankName}
          accountName={platform.paymentAccountName}
          accountNumber={platform.paymentAccountNumber}
          supportEmail={platform.paymentSupportEmail}
          supportWhatsApp={platform.paymentSupportWhatsApp}
          proofHint={copy.proofHint}
        />
      </div>

      <div className="mt-6 space-y-4">
        {payments.map((payment) => {
          const phase = studioPaymentCheckpointCopy(payment);
          const proofOnFile = Boolean(payment.proofName || payment.proofUrl);
          const paymentHref = paymentWorkspaceHref(payment.id, access);
          const shouldShowUpload = payment.status !== "paid" && !proofOnFile;
          return (
            <div key={payment.id} className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[var(--studio-ink)]">{payment.label}</div>
                  <div className="mt-2 text-sm text-[var(--studio-ink-soft)]">
                    {formatCurrency(payment.amount, payment.currency)} · {friendlyPaymentStatus(payment.status)}
                  </div>
                  <div className="mt-3 rounded-[1rem] border border-[var(--studio-line)] bg-black/10 px-3 py-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--studio-signal)]">
                      {phase.phase}
                    </div>
                    <p className="mt-1 text-xs leading-6 text-[var(--studio-ink-soft)]">{phase.detail}</p>
                  </div>
                  {payment.dueDate ? (
                    <div className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                      {copy.duePrefix}{new Date(payment.dueDate).toLocaleDateString("en-NG")}
                    </div>
                  ) : null}
                  <PaymentProofStatus payment={payment} copy={copy} />
                </div>
                {isFinance ? (
                  <form action={setPaymentStatusAction} className="flex gap-2">
                    <input type="hidden" name="paymentId" value={payment.id} />
                    <input type="hidden" name="redirectPath" value={redirectPath} />
                    <input type="hidden" name="status" value={payment.status === "paid" ? "requested" : "paid"} />
                    <button
                      type="submit"
                      className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs font-semibold text-[var(--studio-ink)]"
                    >
                      {payment.status === "paid" ? copy.reopen : copy.markPaid}
                    </button>
                  </form>
                ) : null}
              </div>
              {payment.status !== "paid" && !isStaff ? (
                <>
                  {!proofOnFile ? (
                    <ol className="mt-4 grid gap-2 sm:grid-cols-3">
                      {[
                        { num: "1", label: copy.stepTransferLabel, body: copy.stepTransferBody },
                        { num: "2", label: copy.stepAttachLabel, body: copy.stepAttachBody },
                        { num: "3", label: copy.stepFinanceLabel, body: copy.stepFinanceBody },
                      ].map((step) => (
                        <li
                          key={step.num}
                          className="flex items-start gap-3 rounded-[1rem] border border-[var(--studio-line)] bg-black/10 px-3 py-2.5"
                        >
                          <span
                            aria-hidden
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[rgba(151,244,243,0.45)] bg-[rgba(151,244,243,0.08)] text-[11px] font-semibold text-[var(--studio-signal)]"
                          >
                            {step.num}
                          </span>
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--studio-ink)]">
                              {step.label}
                            </div>
                            <p className="mt-0.5 text-[11.5px] leading-5 text-[var(--studio-ink-soft)]">
                              {step.body}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : null}

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                      href={paymentHref}
                      className="studio-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                    >
                      {proofOnFile ? copy.openPaymentStatus : copy.openSecurePaymentWorkspace}
                      {proofOnFile ? <Clock3 className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                    </Link>
                    <p className="max-w-md text-[12.5px] leading-5 text-[var(--studio-ink-soft)]">
                      {copy.focusedPageNote}
                    </p>
                  </div>

                  {shouldShowUpload ? (
                    <details className="group/proof mt-3 rounded-[1.15rem] border border-[var(--studio-line)] bg-black/10 px-4 py-3">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)] outline-none [&::-webkit-details-marker]:hidden">
                        <span>{copy.uploadProofHereInstead}</span>
                        <span className="text-[var(--studio-ink-soft)] transition group-open/proof:rotate-180">▾</span>
                      </summary>
                      <form action={uploadPaymentProofAction} className="mt-4 space-y-3">
                        <input type="hidden" name="paymentId" value={payment.id} />
                        <input type="hidden" name="redirectPath" value={redirectPath} />
                        <input type="hidden" name="accessKey" value={access || ""} />
                        <StudioFileField
                          name="proof"
                          required
                          variant="compact"
                          title={copy.proofFileTitle}
                          description={copy.proofFileDescription}
                          footerHint={copy.proofFileFooterHint}
                        />
                        <StudioSubmitButton label={copy.submitProofLabel} pendingLabel={copy.submitProofPending} />
                      </form>
                    </details>
                  ) : null}
                </>
              ) : null}
            </div>
          );
        })}
      </div>

      {!isStaff && unpaidPaymentsNeedHelp(payments) ? (
        <div className="mt-6 rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
          <div className="text-sm font-semibold text-[var(--studio-ink)]">{copy.needHelpTitle}</div>
          <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">
            {copy.needHelpBody}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {platform.paymentSupportEmail ? (
              <a
                href={`mailto:${platform.paymentSupportEmail}`}
                className="studio-button-secondary inline-flex rounded-full px-4 py-3 text-sm font-semibold"
              >
                {copy.emailFinance}
              </a>
            ) : null}
            {supportWhatsapp ? (
              <a
                href={supportWhatsapp}
                target="_blank"
                rel="noreferrer"
                className="studio-button-secondary inline-flex rounded-full px-4 py-3 text-sm font-semibold"
              >
                {copy.whatsappFinance}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function unpaidPaymentsNeedHelp(payments: StudioPayment[]) {
  return payments.some((p) => p.status !== "paid" && p.status !== "cancelled");
}
