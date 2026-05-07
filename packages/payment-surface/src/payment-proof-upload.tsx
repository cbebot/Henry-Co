import { UploadCloud } from "lucide-react";
import { cn } from "@henryco/ui/cn";
import { PaymentActionButton } from "./payment-action-button";
import { PaymentFileField } from "./payment-file-field";
import type { PaymentProofUploadConfig, PaymentSurfaceTheme, PaymentStatus } from "./types";

export interface PaymentProofUploadProps {
  upload: PaymentProofUploadConfig;
  theme?: PaymentSurfaceTheme;
  /** Drives the eyebrow copy ("Send your proof" vs "Attach the missing proof"). */
  status: PaymentStatus;
  /** Drives the success-lock state on the submit button when status flips. */
  successLocked?: boolean;
}

/**
 * PaymentProofUpload — inline file upload form scoped to a single payment.
 * Submits to the consumer-supplied server action so we keep one canonical
 * proof pipeline per app — the surface composition stays uniform while the
 * back-end action remains app-owned (per V2-PAYMENT-UNIFICATION anti-pattern
 * "do not change the underlying payment data model").
 */
export function PaymentProofUpload({ upload, theme, status, successLocked }: PaymentProofUploadProps) {
  const eyebrow =
    status === "processing" ? "Attach the missing proof" : "Send your proof";

  return (
    <section
      className={cn(
        "rounded-[1.4rem] border border-[color:var(--payment-line,rgba(255,255,255,0.18))] bg-black/10 p-5 sm:p-6",
        theme?.panelClassName,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-full border bg-[color:var(--payment-accent,#97f4f3)]/[0.06]",
            "border-[color:var(--payment-line,rgba(255,255,255,0.18))]",
            "text-[color:var(--payment-accent,#97f4f3)]",
          )}
        >
          <UploadCloud className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--payment-accent,#97f4f3)]">
            {eyebrow}
          </div>
          <p
            className={cn(
              "mt-2 max-w-xl text-sm leading-6",
              "text-[color:var(--payment-soft,rgba(255,255,255,0.65))]",
              theme?.softTextClassName,
            )}
          >
            Upload your receipt or alert. Finance reviews and confirms within one business day —
            this page will update automatically.
          </p>
        </div>
      </div>
      <form action={upload.action} className="mt-4 space-y-4">
        {(upload.hiddenFields ?? []).map((field) => (
          <input key={field.name} type="hidden" name={field.name} value={field.value} />
        ))}
        <input type="hidden" name="redirectPath" value={upload.redirectPath} />
        <PaymentFileField
          name="proof"
          required
          variant="compact"
          accept={upload.accept ?? "image/*,application/pdf"}
          title="Payment proof file"
          description="Bank receipt, debit alert screenshot, or PDF — must show amount, date, and destination."
          footerHint="We trim the file name to a clean label finance can scan quickly."
        />
        <PaymentActionButton
          label={upload.submitLabel ?? "Submit payment proof"}
          pendingLabel={upload.pendingLabel ?? "Uploading…"}
          successLocked={successLocked}
          successLabel="Proof received"
        />
      </form>
    </section>
  );
}
