"use client";

import { useRef, useState, type ComponentType } from "react";
import { translateSurfaceLabel, useHenryCoLocale } from "@henryco/i18n";
import { ButtonPendingContent } from "@henryco/ui";
import { fetchWithSensitiveAction } from "@henryco/auth/client/sensitive-action-modal";
import { ArrowRight, CreditCard, Landmark, ShieldCheck, Smartphone } from "lucide-react";

import { RAIL_TOPUP_METHODS, type RailTopupMethod } from "@/lib/wallet-topup";

const PRESET_NAIRA = [5000, 10000, 25000, 50000, 100000];

type MethodOption = { key: RailTopupMethod; label: string; hint: string; Icon: ComponentType<{ size?: number }> };

/**
 * V3-15-JOB-B — the buyer entry point for the proven hosted-redirect payment
 * rail. Card / bank / USSD is the DEFAULT primary method; the bank-transfer-proof
 * flow remains as a fallback rendered below this on the page.
 *
 * It does NOT rebuild the rail — it CALLS it:
 *   1. POST /api/wallet/topup/init   → durable funding record (shared idempotency UUID)
 *   2. fetchWithSensitiveAction(POST /api/payments/intents) → the proven create
 *      (handles the R1 reauth challenge and retries with the SAME body/key, A11)
 *   3. follow the opaque hosted-redirect (no provider is ever named — Principle 9)
 *
 * On return, /payments/callback advances pending→processing, the webhook confirms
 * →succeeded, and the wallet credit is reconciled on the /wallet load.
 */
export default function WalletTopUpClient() {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const methods: MethodOption[] = [
    { key: "card", label: t("Card"), hint: t("Debit or credit card"), Icon: CreditCard },
    { key: "bank_transfer", label: t("Bank transfer"), hint: t("Pay from your bank app"), Icon: Landmark },
    { key: "ussd", label: t("USSD"), hint: t("Dial a short code to pay"), Icon: Smartphone },
  ];

  const [amount, setAmount] = useState("10000");
  const [method, setMethod] = useState<RailTopupMethod>("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const amountNaira = Number(amount) || 0;
  const amountLabel = amountNaira > 0 ? `NGN ${amountNaira.toLocaleString(locale === "en" ? "en-NG" : locale)}` : "";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submittingRef.current) return; // hard guard against double-submit
    if (!RAIL_TOPUP_METHODS.includes(method)) {
      setError(t("Choose a payment method."));
      return;
    }
    if (!amountNaira || amountNaira < 100) {
      setError(t("Minimum amount is NGN 100."));
      return;
    }
    if (amountNaira > 100000) {
      setError(t("For this flow, the maximum is NGN 100,000 per top-up."));
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setError(null);

    // ONE idempotency key for this attempt — anchors BOTH the funding record and
    // the payment intent, so a reauth retry (A11) cannot create a second of either.
    const idempotencyKey = crypto.randomUUID();
    const amountKobo = Math.round(amountNaira * 100);

    try {
      const initRes = await fetch("/api/wallet/topup/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountKobo, method, idempotencyKey }),
      });
      const initData = (await initRes.json().catch(() => ({}))) as { error?: string };
      if (!initRes.ok) {
        throw new Error(initData.error || t("We couldn't start your top-up. Please try again."));
      }

      // The proven rail. fetchWithSensitiveAction handles the reauth challenge and
      // replays this exact request (same body → same idempotencyKey) on success.
      const intentRes = await fetchWithSensitiveAction("/api/payments/intents", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({
          amountMinor: amountKobo,
          currency: "NGN",
          country: "NG",
          method,
          idempotencyKey,
          division: "account",
          returnTo: "/wallet",
        }),
      });

      if (intentRes.status === 401) {
        // Reauth was required and not completed (modal cancelled).
        throw new Error(t("Confirm your identity to continue with this payment."));
      }

      const intentData = (await intentRes.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        clientAction?: { type: "redirect"; url: string } | { type: "sdk"; token: string } | { type: "none" };
      };

      if (!intentRes.ok) {
        if (intentData.code === "manual_fallback") {
          throw new Error(t("Instant payment isn't available right now — use bank transfer with proof below."));
        }
        throw new Error(intentData.error || t("Payment could not be started. Please try again."));
      }

      const action = intentData.clientAction;
      if (action && action.type === "redirect" && action.url) {
        window.location.assign(action.url); // hosted checkout — opaque, no provider named
        return; // keep the button pending through navigation
      }
      // No client step needed (e.g. an already-settled replay) — review on the wallet.
      window.location.assign("/wallet");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Something went wrong. Please try again."));
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="acct-card p-5 sm:p-6" data-live-refresh-pause="true">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="acct-kicker">{t("Pay instantly")}</p>
          <p className="mt-1 text-sm leading-5 text-[var(--acct-muted)]">
            {t("Top up with card, bank transfer or USSD. Your balance updates the moment payment is confirmed.")}
          </p>
        </div>
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--acct-gold-soft)] text-[var(--acct-gold)]">
          <ShieldCheck size={18} />
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label={t("Payment method")}>
        {methods.map(({ key, label, hint, Icon }) => {
          const selected = method === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setMethod(key)}
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                selected
                  ? "border-[var(--acct-gold)] bg-[var(--acct-gold-soft)]"
                  : "border-[var(--acct-line)] bg-[var(--acct-bg)] hover:border-[var(--acct-gold)]"
              }`}
            >
              <span
                className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  selected ? "bg-white/80 text-[var(--acct-gold)]" : "bg-[var(--acct-surface)] text-[var(--acct-muted)]"
                }`}
              >
                <Icon size={17} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[var(--acct-ink)]">{label}</span>
                <span className="mt-0.5 block text-xs leading-4 text-[var(--acct-muted)]">{hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-5">
        {PRESET_NAIRA.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setAmount(String(preset))}
            className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
              amount === String(preset)
                ? "border-[var(--acct-gold)] bg-[var(--acct-gold-soft)] text-[var(--acct-gold)]"
                : "border-[var(--acct-line)] bg-[var(--acct-bg)] text-[var(--acct-muted)]"
            }`}
          >
            NGN {preset.toLocaleString(locale === "en" ? "en-NG" : locale)}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <label className="mb-1.5 block text-sm font-medium text-[var(--acct-ink)]">{t("Amount")}</label>
        <input
          type="number"
          min={100}
          max={100000}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="acct-input text-lg font-semibold"
          placeholder={t("Enter amount in naira")}
          inputMode="numeric"
        />
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl bg-[var(--acct-red-soft)] px-4 py-3 text-sm text-[var(--acct-red)]" role="alert">
          {error}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={loading} className="acct-button-primary rounded-2xl px-5 py-3">
          <ButtonPendingContent
            pending={loading}
            pendingLabel={t("Opening secure checkout...")}
            spinnerLabel={t("Opening secure checkout...")}
          >
            <>
              {amountLabel ? `${t("Top up")} ${amountLabel}` : t("Top up wallet")}
              <ArrowRight size={16} />
            </>
          </ButtonPendingContent>
        </button>
        <p className="text-xs leading-5 text-[var(--acct-muted)]">
          {t("You'll complete payment on a secure checkout, then return here automatically.")}
        </p>
      </div>
    </form>
  );
}
