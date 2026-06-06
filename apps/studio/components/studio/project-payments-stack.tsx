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

function PaymentProofStatus({ payment }: { payment: StudioPayment }) {
  const proofName = payment.proofName?.trim() || null;
  const proofOnFile = Boolean(proofName || payment.proofUrl);

  if (payment.status === "paid") {
    return (
      <div className="mt-4 rounded-[1.15rem] border border-[var(--studio-green-line)] bg-[var(--studio-green-soft)] px-4 py-3">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--studio-green-ink)]" aria-hidden />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--studio-ink)]">
              {proofOnFile ? "Payment proof verified" : "Payment verified"}
            </div>
            <p className="mt-1 text-xs leading-5 text-[var(--studio-ink-soft)]">
              {proofName
                ? `Finance verified ${proofName} and recorded this payment against the project.`
                : "Finance has confirmed this transfer and recorded it against the project."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (proofOnFile) {
    return (
      <div className="mt-4 rounded-[1.15rem] border border-[var(--studio-accent-ring)] bg-[var(--studio-accent-soft)] px-4 py-3">
        <div className="flex items-start gap-3">
          <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--studio-signal)]" aria-hidden />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--studio-ink)]">Payment proof on file</div>
            <p className="mt-1 text-xs leading-5 text-[var(--studio-ink-soft)]">
              {proofName
                ? `${proofName} is attached. Finance is matching it to the transfer and will mark this checkpoint confirmed once it clears.`
                : "A proof file is attached. Finance is matching it to the transfer and will mark this checkpoint confirmed once it clears."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-[1.15rem] border border-[var(--studio-amber-line)] bg-[var(--studio-amber-soft)] px-4 py-3">
      <div className="flex items-start gap-3">
        <UploadCloud className="mt-0.5 h-4 w-4 shrink-0 text-[var(--studio-amber-ink)]" aria-hidden />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--studio-ink)]">No payment proof uploaded yet</div>
          <p className="mt-1 text-xs leading-5 text-[var(--studio-ink-soft)]">
            Use the secure payment workspace below to transfer, attach your receipt, and move this checkpoint into finance verification.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProjectPaymentsStack({
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
  const supportWhatsapp = supportWhatsappHref(platform.paymentSupportWhatsApp);
  const isPriority = variant === "priority";

  return (
    <section
      id={isPriority && sectionId ? sectionId : undefined}
      className={`scroll-mt-28 rounded-[1.75rem] border p-6 ${
        isPriority
          ? "border-[var(--studio-accent-ring)] bg-[linear-gradient(180deg,var(--studio-accent-soft),var(--studio-bg-soft))] shadow-[var(--studio-shadow)]"
          : "studio-panel border-[var(--studio-line)]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="studio-kicker">{isPriority ? "Action required" : "Payments"}</div>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--studio-ink)] sm:text-2xl">
            {isPriority ? "Complete your payment to begin" : "Payment overview"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--studio-ink-soft)]">
            {isPriority
              ? "Each milestone begins once the corresponding payment is confirmed. Use the account details below to make your transfer, then upload proof so our team can verify and get started."
              : "A clear breakdown of your project investment — every payment maps directly to your proposal and milestones."}
          </p>
          {isPriority ? (
            <div className="mt-4 rounded-[1.25rem] border border-[var(--studio-accent-ring)] bg-[var(--studio-fill-soft)] px-4 py-3 text-sm leading-6 text-[var(--studio-ink-soft)]">
              <span className="font-semibold text-[var(--studio-ink)]">What happens next: </span>
              Transfer using the verified bank details, then use <strong className="text-[var(--studio-ink)]">Upload payment proof</strong> in this same section. After upload, you will return to your Henry Onyx account Studio hub while finance confirms privately.
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
            ? "rounded-[1.5rem] border border-[var(--studio-line)] bg-[var(--studio-fill-soft)] p-4"
            : ""
        }`}
      >
        {[
          ["Total", formatCurrency(paymentOverview.total, proposalCurrency)],
          ["Paid", formatCurrency(paymentOverview.paid, proposalCurrency)],
          ["Processing", formatCurrency(paymentOverview.processing, proposalCurrency)],
          ["Outstanding", formatCurrency(paymentOverview.outstanding, proposalCurrency)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[1.2rem] border border-[var(--studio-line)] bg-[var(--studio-fill-soft)] px-3 py-3 sm:px-4 sm:py-4">
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
          className="group/breakdown mt-5 rounded-[1.35rem] border border-[var(--studio-line)] bg-[var(--studio-fill-soft)] px-4 py-3"
          open={isFinance || isStaff}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-signal)] outline-none [&::-webkit-details-marker]:hidden">
            <span>Proposal pricing detail</span>
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
          title="Transfer to Henry Onyx’s verified company account"
          amount={paymentOverview.nextPayment?.amount || paymentOverview.outstanding}
          currency={paymentOverview.nextPayment?.currency || proposalCurrency}
          statusLabel={paymentOverview.nextPayment ? friendlyPaymentStatus(paymentOverview.nextPayment.status) : "Ready to pay"}
          dueLabel={
            paymentOverview.nextPayment?.dueDate
              ? `Due ${new Date(paymentOverview.nextPayment.dueDate).toLocaleDateString("en-NG")}`
              : "Pay when you are ready to secure the next milestone"
          }
          instructions={platform.paymentInstructions}
          bankName={platform.paymentBankName}
          accountName={platform.paymentAccountName}
          accountNumber={platform.paymentAccountNumber}
          supportEmail={platform.paymentSupportEmail}
          supportWhatsApp={platform.paymentSupportWhatsApp}
          proofHint="After you transfer, upload your receipt or bank confirmation below. Our team will verify the payment privately — nothing is published publicly."
        />
      </div>

      <div className="mt-6 space-y-4">
        {payments.map((payment) => {
          const phase = studioPaymentCheckpointCopy(payment);
          const proofOnFile = Boolean(payment.proofName || payment.proofUrl);
          const paymentHref = paymentWorkspaceHref(payment.id, access);
          const shouldShowUpload = payment.status !== "paid" && !proofOnFile;
          return (
            <div key={payment.id} className="rounded-[1.4rem] border border-[var(--studio-line)] bg-[var(--studio-fill-soft)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[var(--studio-ink)]">{payment.label}</div>
                  <div className="mt-2 text-sm text-[var(--studio-ink-soft)]">
                    {formatCurrency(payment.amount, payment.currency)} · {friendlyPaymentStatus(payment.status)}
                  </div>
                  <div className="mt-3 rounded-[1rem] border border-[var(--studio-line)] bg-[var(--studio-fill-soft)] px-3 py-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--studio-signal)]">
                      {phase.phase}
                    </div>
                    <p className="mt-1 text-xs leading-6 text-[var(--studio-ink-soft)]">{phase.detail}</p>
                  </div>
                  {payment.dueDate ? (
                    <div className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                      Due {new Date(payment.dueDate).toLocaleDateString("en-NG")}
                    </div>
                  ) : null}
                  <PaymentProofStatus payment={payment} />
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
                      {payment.status === "paid" ? "Re-open" : "Mark paid"}
                    </button>
                  </form>
                ) : null}
              </div>
              {payment.status !== "paid" && !isStaff ? (
                <>
                  {!proofOnFile ? (
                    <ol className="mt-4 grid gap-2 sm:grid-cols-3">
                      {[
                        { num: "1", label: "Transfer", body: "Use the verified bank details." },
                        { num: "2", label: "Attach proof", body: "Receipt, alert screenshot, or PDF." },
                        { num: "3", label: "Finance clears it", body: "Usually within one business day." },
                      ].map((step) => (
                        <li
                          key={step.num}
                          className="flex items-start gap-3 rounded-[1rem] border border-[var(--studio-line)] bg-[var(--studio-fill-soft)] px-3 py-2.5"
                        >
                          <span
                            aria-hidden
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--studio-accent-ring)] bg-[var(--studio-accent-soft)] text-[11px] font-semibold text-[var(--studio-signal)]"
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
                      {proofOnFile ? "Open payment status" : "Open secure payment workspace"}
                      {proofOnFile ? <Clock3 className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                    </Link>
                    <p className="max-w-md text-[12.5px] leading-5 text-[var(--studio-ink-soft)]">
                      The focused payment page keeps the amount, account details, proof upload, and finance status in one clean view.
                    </p>
                  </div>

                  {shouldShowUpload ? (
                    <details className="group/proof mt-3 rounded-[1.15rem] border border-[var(--studio-line)] bg-[var(--studio-fill-soft)] px-4 py-3">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)] outline-none [&::-webkit-details-marker]:hidden">
                        <span>Upload proof here instead</span>
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
                          title="Payment proof file"
                          description="Bank receipt, debit alert screenshot, or PDF — must show amount, date, and destination."
                          footerHint="After upload, this page will show the proof as received while finance verifies it."
                        />
                        <StudioSubmitButton label="Submit payment proof" pendingLabel="Uploading…" />
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
        <div className="mt-6 rounded-[1.5rem] border border-[var(--studio-line)] bg-[var(--studio-fill-soft)] p-5">
          <div className="text-sm font-semibold text-[var(--studio-ink)]">Need help with your payment?</div>
          <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">
            Our finance team can confirm account details, discuss timing, or walk you through the process.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {platform.paymentSupportEmail ? (
              <a
                href={`mailto:${platform.paymentSupportEmail}`}
                className="studio-button-secondary inline-flex rounded-full px-4 py-3 text-sm font-semibold"
              >
                Email finance
              </a>
            ) : null}
            {supportWhatsapp ? (
              <a
                href={supportWhatsapp}
                target="_blank"
                rel="noreferrer"
                className="studio-button-secondary inline-flex rounded-full px-4 py-3 text-sm font-semibold"
              >
                WhatsApp finance
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
