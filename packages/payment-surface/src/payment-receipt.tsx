import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@henryco/ui/cn";
import { formatPaymentReceiptDate } from "./format";
import type { PaymentRecordView, PaymentSurfaceRecord, PaymentSurfaceTheme } from "./types";

export interface PaymentReceiptProps {
  payment: PaymentRecordView;
  record: PaymentSurfaceRecord;
  theme?: PaymentSurfaceTheme;
  /** Optional override for the receipt body. Supports `{date}` and `{proof}` placeholders. */
  receiptText?: string;
}

const DEFAULT_RECEIPT =
  "Confirmed on {date}.{proof} Your record advances and the next step appears in the parent workspace.";

function applyTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

/**
 * PaymentReceipt — quiet, settled receipt summary shown after the payment
 * is confirmed. Receipt panel + a single quiet "Open record workspace"
 * link. No bank details, no proof upload form.
 */
export function PaymentReceipt({ payment, record, theme, receiptText }: PaymentReceiptProps) {
  const date = formatPaymentReceiptDate(payment.updatedAt);
  const proofClause = payment.proofName ? ` Proof on file: ${payment.proofName}.` : "";
  const body = applyTemplate(receiptText ?? DEFAULT_RECEIPT, { date, proof: proofClause });
  const cta = record.primaryCta ?? record.back;

  return (
    <section
      className={cn(
        "rounded-[1.4rem] border bg-black/10 p-5 sm:p-6",
        "border-[color:var(--payment-line,rgba(255,255,255,0.18))]",
        theme?.panelClassName,
      )}
    >
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--payment-accent,#97f4f3)]">
        Receipt
      </div>
      <p
        className={cn(
          "mt-3 text-sm leading-6",
          "text-[color:var(--payment-soft,rgba(255,255,255,0.65))]",
          theme?.softTextClassName,
        )}
      >
        {body}
      </p>
      <Link
        href={cta.href}
        className={cn(
          "mt-4 inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 transition outline-none",
          "text-[color:var(--payment-accent,#97f4f3)]",
          "focus-visible:ring-2 focus-visible:ring-[color:var(--payment-accent,#97f4f3)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40",
          "[@media(hover:hover)]:hover:underline",
        )}
      >
        {cta.label}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
