import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CreditCard,
  Lock,
  Receipt,
  Shield,
} from "lucide-react";
import { COMPANY } from "@henryco/config";
import { cn } from "@henryco/ui/cn";
import { HenryCoHeroCard } from "@henryco/ui/public-shell";
import { PaymentGuide } from "./payment-guide";
import { PaymentProcessing } from "./payment-processing";
import { PaymentProofUpload } from "./payment-proof-upload";
import { PaymentReceipt } from "./payment-receipt";
import {
  formatPaymentAmount,
  formatPaymentDueDate,
  formatPaymentReference,
  friendlyPaymentStatus,
} from "./format";
import type { PaymentSurfaceContext } from "./types";

const DEFAULT_BODY: Record<string, string> = {
  pending:
    "Send your payment using the verified company details below, then attach your proof so finance can confirm and unlock the next step.",
  processing:
    "Payment proof received. Finance is verifying — you can track confirmation here.",
  paid: "Payment confirmed. Thank you — your record stays moving.",
  failed:
    "We could not match this transfer. Please re-upload your proof or contact finance support below.",
  refunded: "Refund issued. The transfer was returned to the source account.",
  cancelled: "This payment was cancelled. No further action is needed.",
};

const DEFAULT_INSTRUCTIONS =
  "Bank transfer is the active payment method. Proof can be a debit alert screenshot, bank receipt, or PDF — anything showing amount, date, and destination.";

const DEFAULT_PROOF_HINT =
  "After sending, attach the proof below — finance reviews within one business day. You'll see the status flip to processing here as soon as the upload lands.";

/**
 * PaymentSurface — top-level composition rendered at every /pay route.
 *
 * Composition (mobile-first):
 *   1. Quiet breadcrumb back to the parent record (project, order, booking)
 *   2. Visually-hidden h1 for landmark heading
 *   3. HenryCoHeroCard (status-aware copy + amount/status/due rows)
 *   4. PaymentGuide (bank details + step-by-step + support) — only when
 *      payment is open AND no proof is on file
 *   5. PaymentProcessing — only when proof is on file but not yet confirmed
 *   6. PaymentProofUpload — only when payment is open AND no proof is on file
 *   7. PaymentReceipt — only after settlement
 *   8. Quiet bottom navigation rail
 *
 * The composition is identical to the V2-HERO-01 studio /pay/[paymentId]
 * page — extraction preserves layout 1:1 so it cannot regress in studio.
 */
export interface PaymentSurfaceProps {
  ctx: PaymentSurfaceContext;
}

export function PaymentSurface({ ctx }: PaymentSurfaceProps) {
  const { payment, record, platform, upload, copy, theme, cardCta } = ctx;
  const reference = formatPaymentReference(payment.id, payment.reference);
  const statusLabel = friendlyPaymentStatus(payment.status, payment.statusLabel ?? null);
  const dueLabel = formatPaymentDueDate(payment.dueDate);
  const bodyByStatus = { ...DEFAULT_BODY, ...(copy?.bodyByStatus ?? {}) } as Record<string, string>;
  const heroBody = bodyByStatus[payment.status] ?? DEFAULT_BODY[payment.status] ?? DEFAULT_BODY.pending;
  const isPaid = payment.status === "paid";
  const isProcessing = payment.status === "processing";
  const isCancelled = payment.status === "cancelled" || payment.status === "refunded";
  const proofOnFile = Boolean(payment.proofName || payment.proofUrl);
  const showGuide = !isPaid && !proofOnFile && !isCancelled;
  const showProcessing = proofOnFile && !isPaid && !isCancelled;
  const showUpload = !isPaid && !proofOnFile && !isCancelled && Boolean(upload);
  const showReceipt = isPaid;
  // Card CTA shows only while the payment is genuinely open: not settled, not
  // closed, not already in a verification/processing flow, and no proof on file
  // (a transfer already in motion). This keeps the card path from competing
  // with a payment the customer has already started.
  const showCardCta =
    Boolean(cardCta) && !isPaid && !isProcessing && !isCancelled && !proofOnFile;
  const heroEyebrow =
    copy?.eyebrow ??
    (payment.rank ? `Payment · ${payment.rank.index} of ${payment.rank.total}` : statusLabel);

  return (
    <main
      className={cn(
        "mx-auto max-w-[64rem] px-5 py-10 sm:px-8 sm:py-14 lg:px-10",
        theme?.mainClassName,
      )}
      style={theme?.rootStyle}
      data-payment-surface={payment.status}
    >
      {/* Breadcrumb back to parent record. */}
      <Link
        href={record.back.href}
        className={cn(
          "inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em]",
          "text-[color:var(--payment-soft,rgba(255,255,255,0.65))]",
          "transition outline-none",
          "focus-visible:ring-2 focus-visible:ring-[color:var(--payment-accent,#97f4f3)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40",
          "[@media(hover:hover)]:hover:text-[color:var(--payment-ink,white)]",
        )}
      >
        <ArrowLeft className="h-3 w-3" />
        {record.back.label}
      </Link>

      <h1 className="sr-only">
        Payment workspace · {payment.label || "Payment"} · {record.title}
      </h1>

      <div className="mt-5">
        <HenryCoHeroCard
          tone={theme?.heroTone ?? "contrast"}
          accentVar={theme?.accentVar ?? "var(--payment-accent, #97f4f3)"}
          eyebrow={heroEyebrow}
          title={payment.label || "Payment"}
          body={heroBody}
          rows={[
            {
              key: "amount",
              icon: <Receipt className="h-4 w-4" />,
              label: "Amount due",
              value: formatPaymentAmount(payment.amount, payment.currency),
            },
            {
              key: "status",
              icon: <Shield className="h-4 w-4" />,
              label: "Status",
              value: statusLabel,
            },
            {
              key: "due",
              icon: <CalendarClock className="h-4 w-4" />,
              label: "Due",
              value: dueLabel,
            },
            ...(record.subtitle
              ? [{ key: "subtitle", label: "Context", value: record.subtitle }]
              : []),
            { key: "record", label: record.back.label, value: record.title },
          ]}
          footer={
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>Reference your record name on the transfer.</span>
              {record.primaryCta ? (
                <Link
                  href={record.primaryCta.href}
                  className={cn(
                    "font-semibold underline-offset-4 transition",
                    "text-[color:var(--payment-accent,#97f4f3)]",
                    "[@media(hover:hover)]:hover:underline",
                  )}
                >
                  {record.primaryCta.label}
                </Link>
              ) : null}
            </div>
          }
        />
      </div>

      {/* Trust anchor — persistent across states: who you're paying, that it is
          secured, and the transaction reference. Makes the surface read as a
          real, tracked, secure payment rather than a generic form. */}
      <div
        className={cn(
          "mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-2xl border px-4 py-3 text-[12px]",
          "border-[color:var(--payment-line,rgba(255,255,255,0.18))]",
          "text-[color:var(--payment-soft,rgba(255,255,255,0.65))]",
        )}
      >
        <span className="inline-flex items-center gap-1.5 font-semibold text-[color:var(--payment-ink,white)]">
          <Lock className="h-3.5 w-3.5 text-[color:var(--payment-accent,#97f4f3)]" aria-hidden />
          Secured payment
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="opacity-70">to</span>
          <span className="font-semibold text-[color:var(--payment-ink,white)]">{COMPANY.group.legalName}</span>
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 tabular-nums">
          <span className="opacity-70">Ref</span>
          <span className="font-semibold text-[color:var(--payment-ink,white)]">{reference}</span>
        </span>
      </div>

      {showCardCta && cardCta ? (
        <div className="mt-5">
          <Link
            href={cardCta.href}
            data-testid="payment-card-cta"
            className={cn(
              "group inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold sm:w-auto",
              "bg-[color:var(--payment-accent,#97f4f3)] text-black/90",
              "transition outline-none",
              "focus-visible:ring-2 focus-visible:ring-[color:var(--payment-accent,#97f4f3)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40",
              "[@media(hover:hover)]:hover:brightness-110",
            )}
          >
            <CreditCard className="h-4 w-4" />
            {cardCta.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}

      {showGuide ? (
        <div className="mt-6">
          <PaymentGuide
            title={copy?.guideTitle ?? "Send the payment using the verified company account"}
            amount={payment.amount}
            currency={payment.currency}
            statusLabel={statusLabel}
            dueLabel={`Due ${dueLabel}`}
            instructions={copy?.instructions ?? DEFAULT_INSTRUCTIONS}
            proofHint={copy?.proofHint ?? DEFAULT_PROOF_HINT}
            platform={platform}
            copy={copy}
            theme={theme}
          />
        </div>
      ) : null}

      {showProcessing ? (
        <div className="mt-6">
          <PaymentProcessing payment={payment} statusLabel={statusLabel} theme={theme} />
        </div>
      ) : null}

      {showUpload && upload ? (
        <div className="mt-6">
          <PaymentProofUpload
            upload={upload}
            theme={theme}
            status={payment.status}
            successLocked={false}
          />
        </div>
      ) : null}

      {showReceipt ? (
        <div className="mt-6">
          <PaymentReceipt payment={payment} record={record} theme={theme} receiptText={copy?.receiptText} />
        </div>
      ) : null}

      <nav
        className={cn(
          "mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-[12.5px]",
          "border-[color:var(--payment-line,rgba(255,255,255,0.18))]",
          "text-[color:var(--payment-soft,rgba(255,255,255,0.65))]",
        )}
      >
        <Link
          href={record.back.href}
          className={cn(
            "inline-flex items-center gap-1.5 font-semibold transition outline-none",
            "focus-visible:ring-2 focus-visible:ring-[color:var(--payment-accent,#97f4f3)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40",
            "[@media(hover:hover)]:hover:text-[color:var(--payment-ink,white)]",
          )}
        >
          <ArrowLeft className="h-3 w-3" />
          {record.back.label}
        </Link>
        <Link
          href={record.account.href}
          className={cn(
            "inline-flex items-center gap-1.5 font-semibold transition outline-none",
            "focus-visible:ring-2 focus-visible:ring-[color:var(--payment-accent,#97f4f3)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40",
            "[@media(hover:hover)]:hover:text-[color:var(--payment-ink,white)]",
          )}
        >
          {record.account.label}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </nav>
    </main>
  );
}
