import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Receipt,
  Shield,
} from "lucide-react";
import { cn } from "@henryco/ui/cn";
import { HenryCoHeroCard } from "@henryco/ui/public-shell";
import { PaymentGuide } from "./payment-guide";
import { PaymentProcessing } from "./payment-processing";
import { PaymentProofUpload } from "./payment-proof-upload";
import { PaymentReceipt } from "./payment-receipt";
import {
  formatPaymentAmount,
  formatPaymentDueDate,
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
  const { payment, record, platform, upload, copy, theme } = ctx;
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
