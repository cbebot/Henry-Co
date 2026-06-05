"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";
import { CallbackCard } from "./CallbackCard";

type Settled = "succeeded" | "processing" | "failed";

function settledFrom(status: string): Settled | null {
  if (status === "succeeded" || status === "refunded") return "succeeded";
  if (status === "failed" || status === "cancelled") return "failed";
  return null;
}

/**
 * The hosted-redirect return surface (V3-15-S1, LOAD-BEARING).
 *
 * The webhook NEVER self-advances pending→processing — that ownership is HERE:
 * this calls finalize(), which advances pending→processing via the guarded RPC and
 * confirms the terminal status (deduped against the async webhook). Without this
 * step a charge.success webhook on a still-pending intent raises 23514 (A2). Provider
 * identity is never named (Anti-Clone Principle 9); status is generic "payment".
 */
export function PaymentCallbackClient({
  intentId,
  initialStatus,
  amountMinor,
  currency,
  locale,
}: {
  intentId: string;
  initialStatus: string;
  amountMinor: number;
  currency: string;
  locale: AppLocale;
}) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const initialSettled = settledFrom(initialStatus);
  const [status, setStatus] = useState<Settled>(initialSettled ?? "processing");
  const [resolved, setResolved] = useState<boolean>(initialSettled !== null);
  const cancelled = useRef(false);

  useEffect(() => {
    if (resolved) return;
    cancelled.current = false;
    let tries = 0;
    const finalize = async (): Promise<void> => {
      if (cancelled.current) return;
      tries += 1;
      try {
        // finalize is idempotent: advance() is an optimistic mutex, apply() is deduped.
        const res = await fetch(`/api/payments/intents/${encodeURIComponent(intentId)}/finalize`, { method: "POST" });
        const data = (await res.json().catch(() => ({}))) as { status?: string };
        const term = settledFrom(data.status ?? "");
        if (term) {
          if (!cancelled.current) {
            setStatus(term);
            setResolved(true);
          }
          return;
        }
      } catch {
        /* transient — keep polling for the async webhook to confirm */
      }
      if (tries >= 6) {
        if (!cancelled.current) {
          setStatus("processing");
          setResolved(true); // settle to an honest "we're confirming" state
        }
        return;
      }
      if (!cancelled.current) setTimeout(finalize, 2500);
    };
    void finalize();
    return () => {
      cancelled.current = true;
    };
  }, [intentId, resolved]);

  let amount: string;
  try {
    amount = new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amountMinor / 100);
  } catch {
    amount = `${currency} ${Math.round(amountMinor / 100).toLocaleString()}`;
  }

  const continueLink = (
    <Link
      href="/"
      className="acct-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
    >
      {t("Continue to my account")}
      <ArrowRight size={14} />
    </Link>
  );
  const amountRow = (
    <div className="text-sm">
      <span className="text-[var(--acct-muted)]">{t("Amount")}</span>{" "}
      <span className="font-semibold text-[var(--acct-ink)]">{amount}</span>
    </div>
  );

  if (!resolved) {
    return (
      <CallbackCard
        tone="processing"
        eyebrow={t("Payment")}
        title={t("Confirming your payment")}
        body={t("Hold on a moment while we confirm this payment with your bank. This usually takes a few seconds.")}
      >
        {amountRow}
      </CallbackCard>
    );
  }

  if (status === "succeeded") {
    return (
      <CallbackCard
        tone="success"
        eyebrow={t("Payment confirmed")}
        title={t("Payment successful")}
        body={t("Your payment has been confirmed and a receipt is available in your account.")}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {amountRow}
          {continueLink}
        </div>
      </CallbackCard>
    );
  }

  if (status === "failed") {
    return (
      <CallbackCard
        tone="error"
        eyebrow={t("Payment")}
        title={t("Payment not completed")}
        body={t("This payment did not go through and you have not been charged. You can try again from your account.")}
      >
        {continueLink}
      </CallbackCard>
    );
  }

  // processing — settled but not yet terminal (the webhook confirms shortly)
  return (
    <CallbackCard
      tone="processing"
      eyebrow={t("Payment")}
      title={t("We're confirming your payment")}
      body={t("Your payment is being confirmed. We'll update your account and email you once it's complete — you can safely close this page.")}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {amountRow}
        {continueLink}
      </div>
    </CallbackCard>
  );
}
