import { FileCheck2 } from "lucide-react";
import { cn } from "@henryco/ui/cn";
import { formatPaymentReceiptDate } from "./format";
import type { PaymentRecordView, PaymentSurfaceTheme } from "./types";

export interface PaymentProcessingProps {
  payment: PaymentRecordView;
  statusLabel: string;
  theme?: PaymentSurfaceTheme;
}

/**
 * PaymentProcessing — banner shown after proof was uploaded and finance is
 * still verifying. Calm 3-up status grid (Status / Submitted / Next).
 */
export function PaymentProcessing({ payment, statusLabel, theme }: PaymentProcessingProps) {
  const submittedLabel = formatPaymentReceiptDate(payment.updatedAt);

  return (
    <section
      className={cn(
        "rounded-[1.4rem] border p-5 sm:p-6",
        "border-[color:var(--payment-accent,#97f4f3)]/30",
        "bg-[color:var(--payment-accent,#97f4f3)]/[0.07]",
        theme?.panelClassName,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-full border",
            "border-[color:var(--payment-accent,#97f4f3)]/35",
            "bg-[color:var(--payment-accent,#97f4f3)]/[0.08]",
            "text-[color:var(--payment-accent,#97f4f3)]",
          )}
        >
          <FileCheck2 className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--payment-accent,#97f4f3)]">
            Payment proof received
          </div>
          <h2
            className={cn(
              "mt-2 text-xl font-semibold tracking-[-0.02em]",
              "text-[color:var(--payment-ink,white)]",
              theme?.inkTextClassName,
            )}
          >
            We're verifying your transfer
          </h2>
          <p
            className={cn(
              "mt-2 max-w-2xl text-sm leading-6",
              "text-[color:var(--payment-soft,rgba(255,255,255,0.65))]",
              theme?.softTextClassName,
            )}
          >
            {payment.proofName ? (
              <>
                <span className={cn("font-semibold", "text-[color:var(--payment-ink,white)]", theme?.inkTextClassName)}>
                  {payment.proofName}
                </span>{" "}
                is attached to this payment. We are matching it to the bank transfer and will mark the
                checkpoint confirmed once it clears.
              </>
            ) : (
              "A proof file is attached to this payment. We are matching it to the bank transfer and will mark the checkpoint confirmed once it clears."
            )}
          </p>
          <div className="mt-4 grid gap-3 text-[12.5px] sm:grid-cols-3">
            {[
              { key: "status", label: "Status", value: statusLabel },
              { key: "submitted", label: "Submitted", value: submittedLabel },
              { key: "next", label: "Next", value: "Payment confirmation" },
            ].map((tile) => (
              <div
                key={tile.key}
                className={cn(
                  "rounded-[1rem] border bg-black/10 px-3 py-2",
                  "border-[color:var(--payment-line,rgba(255,255,255,0.18))]",
                )}
              >
                <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--payment-accent,#97f4f3)]">
                  {tile.label}
                </span>
                <span className={cn("mt-1 block font-semibold", "text-[color:var(--payment-ink,white)]", theme?.inkTextClassName)}>
                  {tile.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
