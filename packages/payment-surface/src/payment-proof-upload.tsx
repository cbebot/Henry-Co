import { UploadCloud } from "lucide-react";
import { cn } from "@henryco/ui/cn";
import { getPaymentSurfaceCopy, DEFAULT_LOCALE, type AppLocale } from "@henryco/i18n";
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
  /** Active locale for shared-surface copy. Defaults to EN when omitted. */
  locale?: AppLocale;
}

/**
 * PaymentProofUpload — inline file upload form scoped to a single payment.
 * Submits to the consumer-supplied server action so we keep one canonical
 * proof pipeline per app — the surface composition stays uniform while the
 * back-end action remains app-owned (per V2-PAYMENT-UNIFICATION anti-pattern
 * "do not change the underlying payment data model").
 */
export function PaymentProofUpload({ upload, theme, status, successLocked, locale = DEFAULT_LOCALE }: PaymentProofUploadProps) {
  const t = getPaymentSurfaceCopy(locale).proofUpload;
  const eyebrow =
    status === "processing" ? t.eyebrowProcessing : t.eyebrowSend;

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
            {t.intro}
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
          title={t.fieldTitle}
          description={t.fieldDescription}
          footerHint={t.fieldFooterHint}
        />
        <PaymentActionButton
          label={upload.submitLabel ?? t.submitLabel}
          pendingLabel={upload.pendingLabel ?? t.pendingLabel}
          successLocked={successLocked}
          successLabel={t.successLabel}
        />
      </form>
    </section>
  );
}
