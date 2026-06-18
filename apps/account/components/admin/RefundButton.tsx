"use client";

import { useRef, useState } from "react";
// crypto.randomUUID is the same primitive WalletTopUpClient uses to pin its
// idempotency key (available in every browser the app targets).
import { translateSurfaceLabel, useHenryCoLocale } from "@henryco/i18n";
import { ButtonPendingContent } from "@henryco/ui";
import { fetchWithSensitiveAction } from "@henryco/auth/client/sensitive-action-modal";
import { RotateCcw, ShieldAlert } from "lucide-react";

type RefundButtonProps = {
  intentId: string;
  amountMinor: number;
  currency: string;
};

type ButtonState = "idle" | "confirming" | "processing" | "done" | "error";

/**
 * V3-19 / VAT-WIRING — one-click owner REFUND control.
 *
 * MONEY-SENSITIVE. This button does NOT contain any refund logic — it CALLS the
 * proven `POST /api/payments/intents/[id]/refund` route, which is the single
 * source of money truth (claim + record + wallet hold in one DB transaction,
 * then the provider call). The button only narrates outcomes.
 *
 * Money-safety guarantees mirrored from WalletTopUpClient:
 *   - ONE idempotency key per attempt, pinned via a lazy useState. A reauth replay
 *     (fetchWithSensitiveAction re-issues the SAME serialized body) reuses the
 *     same refundKey, so the DB dedups on UNIQUE(intent, refund_key) — a
 *     double-click or a reauth round-trip can never create two real refunds.
 *   - Two-step inline confirm (idle → confirming) so a single mis-click never
 *     fires a real-money refund. We do NOT use window.confirm (blocked here and
 *     not stylable).
 *   - The route returns `refund_processing`; the terminal `refunded` state only
 *     arrives later via the provider webhook — so we show "Refund processing",
 *     never "Refunded".
 *   - The provider is NEVER named (brand rule).
 */
export default function RefundButton({ intentId, amountMinor, currency }: RefundButtonProps) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  // Pin ONE idempotency key for the lifetime of this attempt. The lazy useState
  // initializer runs exactly once, so the key is stable across re-renders: a
  // reauth replay (fetchWithSensitiveAction re-sends the identical serialized
  // body) reuses the same refundKey → the DB dedups on UNIQUE(intent, refund_key).
  // (A render-time `useRef` mutation would trip react-hooks/refs.)
  const [refundKey] = useState(() => crypto.randomUUID());

  const [state, setState] = useState<ButtonState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const submittingRef = useRef(false);

  // Currency is shown only for transparency on a non-NGN-blocked surface; the
  // route itself rejects non-base-currency refunds. We do not localize the ISO code.
  const amountLabel =
    currency === "NGN"
      ? `NGN ${(amountMinor / 100).toLocaleString(locale === "en" ? "en-NG" : locale, {
          minimumFractionDigits: amountMinor % 100 === 0 ? 0 : 2,
          maximumFractionDigits: 2,
        })}`
      : `${currency} ${(amountMinor / 100).toLocaleString(locale === "en" ? "en-US" : locale)}`;

  const mapReason = (reason: string | undefined, fallback: string): string => {
    switch (reason) {
      case "A refund is already in progress":
        return t("A refund is already in progress for this payment.");
      case "Amount exceeds the refundable balance":
        return t("That amount is more than what's left to refund.");
      case "Wallet balance is insufficient for this reversal — refund a smaller amount":
        return t("The wallet balance can't cover this reversal — try a smaller amount.");
      case "Only NGN payments can be refunded":
        return t("Only naira payments can be refunded here.");
      case "Only succeeded payments can be refunded":
        return t("This payment can't be refunded in its current state.");
      case "This payment predates the ledger and needs manual review":
        return t("This payment predates the ledger and needs manual review.");
      default:
        return fallback;
    }
  };

  const submitRefund = async () => {
    if (submittingRef.current) return; // hard guard against double-submit
    submittingRef.current = true;
    setState("processing");
    setMessage(null);

    try {
      // The proven, money-safe route. fetchWithSensitiveAction handles the R1
      // reauth challenge and REPLAYS this exact serialized body (same refundKey)
      // after reauth — the body MUST be a string for the replay to work.
      const res = await fetchWithSensitiveAction(`/api/payments/intents/${intentId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Full refund — amountMinor omitted. reason is owner-internal provenance.
        body: JSON.stringify({ refundKey, reason: "Owner refund (admin)" }),
      });

      if (res.status === 401) {
        // Reauth was required and not completed (modal cancelled).
        setState("error");
        setMessage(t("Confirm your identity to continue."));
        submittingRef.current = false;
        return;
      }

      const data = (await res.json().catch(() => ({}))) as { error?: string; status?: string };

      if (!res.ok) {
        setState("error");
        setMessage(mapReason(data.error, t("The refund couldn't start. Please try again.")));
        submittingRef.current = false;
        return;
      }

      // 200 — the provider has the refund queued. The terminal `refunded` state
      // arrives later via the provider webhook, so we say "processing", never
      // "Refunded". The button stays disabled to prevent a second submission.
      setState("done");
      setMessage(t("Refund processing"));
    } catch {
      setState("error");
      setMessage(t("The refund couldn't start. Please try again."));
      submittingRef.current = false;
    }
  };

  if (state === "done") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--acct-gold-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--acct-gold)]"
        role="status"
      >
        <ShieldAlert size={14} aria-hidden="true" />
        {t("Refund processing")}
      </span>
    );
  }

  if (state === "confirming") {
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={submitRefund}
          className="acct-button-primary inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold"
        >
          <ShieldAlert size={14} aria-hidden="true" />
          {`${t("Confirm refund")} ${amountLabel}`}
        </button>
        <button
          type="button"
          onClick={() => {
            setState("idle");
            setMessage(null);
          }}
          className="inline-flex items-center rounded-xl border border-[var(--acct-line)] px-3 py-1.5 text-xs font-semibold text-[var(--acct-muted)] hover:border-[var(--acct-gold)]"
        >
          {t("Cancel")}
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={state === "processing"}
        onClick={() => {
          if (state === "processing") return;
          setState("confirming");
          setMessage(null);
        }}
        className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--acct-ink)] transition hover:border-[var(--acct-gold)] disabled:opacity-60"
      >
        <ButtonPendingContent
          pending={state === "processing"}
          pendingLabel={t("Starting refund...")}
          spinnerLabel={t("Starting refund...")}
        >
          <>
            <RotateCcw size={14} aria-hidden="true" />
            {t("Refund")}
          </>
        </ButtonPendingContent>
      </button>
      {state === "error" && message ? (
        <span className="text-xs leading-4 text-[var(--acct-red)]" role="alert">
          {message}
        </span>
      ) : null}
    </span>
  );
}
