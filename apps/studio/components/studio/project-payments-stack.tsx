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
          ? "border-[rgba(151,244,243,0.35)] bg-[linear-gradient(180deg,rgba(12,48,58,0.55),rgba(6,18,26,0.92))] shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
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
        </div>
      </div>

      <div className={`mt-6 grid gap-4 md:grid-cols-4 ${isPriority ? "rounded-[1.5rem] border border-[var(--studio-line)] bg-black/15 p-4" : ""}`}>
        {[
          ["Total", formatCurrency(paymentOverview.total, proposalCurrency)],
          ["Paid", formatCurrency(paymentOverview.paid, proposalCurrency)],
          ["Processing", formatCurrency(paymentOverview.processing, proposalCurrency)],
          ["Outstanding", formatCurrency(paymentOverview.outstanding, proposalCurrency)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[1.35rem] border border-[var(--studio-line)] bg-black/10 p-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--studio-signal)]">{label}</div>
            <div className="mt-2 text-lg font-semibold text-[var(--studio-ink)]">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {pricingBreakdown.map((line) => (
          <div key={`${line.label}-${line.amount}`} className="rounded-[1.35rem] border border-[var(--studio-line)] bg-black/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-[var(--studio-ink)]">{line.label}</div>
                {line.detail ? (
                  <div className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--studio-ink-soft)]">{line.detail}</div>
                ) : null}
              </div>
              <div className="text-sm font-semibold text-[var(--studio-signal)]">
                {formatCurrency(line.amount, proposalCurrency)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <StudioPaymentGuide
          title="Transfer to HenryCo’s verified company account"
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
                      Due {new Date(payment.dueDate).toLocaleDateString("en-NG")}
                    </div>
                  ) : null}
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
                <form action={uploadPaymentProofAction} className="mt-4 space-y-3">
                  <input type="hidden" name="paymentId" value={payment.id} />
                  <input type="hidden" name="redirectPath" value={redirectPath} />
                  <input type="hidden" name="accessKey" value={access || ""} />
                  <StudioFileField
                    name="proof"
                    required
                    variant="compact"
                    title="Upload payment proof"
                    description="Bank receipt, debit alert screenshot, or PDF—anything that shows amount, date, and destination."
                    footerHint="Review your file name before submit—we show a trimmed label so you know exactly what finance received."
                  />
                  <StudioSubmitButton label="Submit payment proof" pendingLabel="Uploading…" />
                </form>
              ) : null}
            </div>
          );
        })}
      </div>

      {!isStaff && unpaidPaymentsNeedHelp(payments) ? (
        <div className="mt-6 rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
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
