"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowRight, Paperclip, ShieldCheck } from "lucide-react";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";
import { emitCareToast } from "@/components/feedback/CareToaster";
import { CareLoadingGlyph } from "@/components/ui/CareLoading";

type PaymentProofFormProps = {
  locale: AppLocale;
  trackingCode: string;
  initialPhone?: string | null;
  amountDue: number;
  canSubmit: boolean;
  statusLabel: string;
  statusMessage: string;
  supportEmail?: string | null;
  supportWhatsApp?: string | null;
  onSubmitted?: () => Promise<void> | void;
};

function formatMoney(value?: number | null) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

function todayValue() {
  return new Date().toISOString().slice(0, 16);
}

export default function PaymentProofForm({
  locale,
  trackingCode,
  initialPhone,
  amountDue,
  canSubmit,
  statusLabel,
  statusMessage,
  supportEmail,
  supportWhatsApp,
  onSubmitted,
}: PaymentProofFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const contactFallback = useMemo(
    () => [supportEmail, supportWhatsApp].filter(Boolean).join(" • "),
    [supportEmail, supportWhatsApp]
  );

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    setDone(false);

    try {
      const response = await fetch("/api/care/payments/receipt", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            duplicate?: boolean;
          }
        | null;

      if (!response.ok || !payload?.ok) {
        const message =
          payload?.error || t("The payment proof could not be submitted right now.");
        setError(message);
        emitCareToast({
          tone: "error",
          title: t("Receipt submission failed"),
          description: message,
        });
        return;
      }

      setDone(true);
      formRef.current?.reset();
      emitCareToast({
        tone: payload.duplicate ? "info" : "success",
        title: payload.duplicate ? t("Receipt already captured") : t("Receipt submitted"),
        description: payload.duplicate
          ? t("The team already has this receipt on file.")
          : t("The HenryCo Care team will review the payment and update your booking shortly."),
      });

      await onSubmitted?.();
    } catch {
      const message = t("Network error. Please try again in a moment.");
      setError(message);
      emitCareToast({
        tone: "error",
        title: t("Network error"),
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[32px] border border-black/10 bg-white/80 p-7 shadow-[0_18px_60px_rgba(0,0,0,0.06)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent)]/18 bg-[color:var(--accent)]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
            <ShieldCheck className="h-4 w-4" />
            {t("Payment review")}
          </div>
          <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white">
            {statusLabel}
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600 dark:text-white/68">
            {statusMessage}
          </p>
        </div>

        <div className="rounded-[1.6rem] border border-black/10 bg-zinc-50/90 px-5 py-4 text-right dark:border-white/10 dark:bg-white/[0.05]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
            {t("Amount due")}
          </div>
          <div className="mt-2 text-2xl font-black tracking-[-0.03em] text-zinc-950 dark:text-white">
            {formatMoney(amountDue)}
          </div>
        </div>
      </div>

      <form
        ref={formRef}
        className="mt-6 grid gap-4"
        action={async (formData) => {
          await handleSubmit(formData);
        }}
      >
        <input type="hidden" name="tracking_code" value={trackingCode} />

        <div className="grid gap-4 md:grid-cols-2">
          <input
            name="phone"
            defaultValue={initialPhone || ""}
            placeholder={t("Booking phone number")}
            className="care-input care-ring rounded-2xl px-4 py-3 text-base md:text-sm"
            required
          />
          <input
            name="payer_name"
            placeholder={t("Payer name")}
            className="care-input care-ring rounded-2xl px-4 py-3 text-base md:text-sm"
            required
            disabled={!canSubmit || loading}
          />
          <input
            name="amount_paid"
            type="number"
            min="0"
            step="0.01"
            placeholder={t("Amount paid")}
            className="care-input care-ring rounded-2xl px-4 py-3 text-base md:text-sm"
            required
            disabled={!canSubmit || loading}
          />
          <input
            name="paid_at"
            type="datetime-local"
            defaultValue={todayValue()}
            className="care-input care-ring rounded-2xl px-4 py-3 text-base md:text-sm"
            required
            disabled={!canSubmit || loading}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <input
            name="payment_reference"
            placeholder={t("Transfer reference or teller reference")}
            className="care-input care-ring rounded-2xl px-4 py-3 text-base md:text-sm"
            disabled={!canSubmit || loading}
          />

          <label className="rounded-[1.8rem] border border-[var(--care-border)] bg-[color:var(--care-bg-soft)] px-4 py-3 text-sm font-medium text-zinc-700 dark:text-white/70">
            <span className="flex items-center gap-2 font-semibold text-zinc-950 dark:text-white">
              <Paperclip className="h-4 w-4 text-[color:var(--accent)]" />
              {t("Receipt image or PDF")}
            </span>
            <input
              type="file"
              name="receipt"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="mt-3 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-full file:border-0 file:bg-[color:var(--accent)]/12 file:px-4 file:py-2 file:font-semibold file:text-[color:var(--accent)] dark:text-white/60"
              disabled={!canSubmit || loading}
            />
          </label>
        </div>

        <textarea
          name="note"
          rows={4}
          placeholder={t("Add any note that will help the team confirm your payment quickly.")}
          className="care-input care-ring min-h-[140px] rounded-2xl px-4 py-3 text-base md:text-sm"
          disabled={!canSubmit || loading}
        />

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.8rem] border border-black/10 bg-zinc-50/90 px-5 py-4 text-sm leading-7 text-zinc-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/65">
          <div>
            {t("Upload the receipt here or reply to the same payment email with it attached.")}
            {contactFallback ? ` ${t("Support fallback")}: ${contactFallback}.` : ""}
          </div>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="care-button-primary inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <CareLoadingGlyph size="sm" className="text-[#07111F]" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {loading
              ? t("Uploading receipt...")
              : canSubmit
                ? t("Upload receipt")
                : t("Payment already confirmed")}
          </button>
        </div>
      </form>

      {done ? (
        <div className="mt-4 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-100">
          {t("Receipt submitted successfully. The support team will review it and update your booking.")}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-100">
          {error}
        </div>
      ) : null}
    </section>
  );
}
