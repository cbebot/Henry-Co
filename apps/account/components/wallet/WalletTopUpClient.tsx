"use client";

import { useRef, useState, type ComponentType } from "react";
import { translateSurfaceLabel, useHenryCoLocale } from "@henryco/i18n";
import { ButtonPendingContent } from "@henryco/ui";
import { fetchWithSensitiveAction } from "@henryco/auth/client/sensitive-action-modal";
import { ArrowRight, Check, CreditCard, Landmark, Smartphone, ShieldCheck } from "lucide-react";

import {
  RAIL_TOPUP_METHODS,
  WALLET_FUNDING_MIN_NAIRA,
  type RailTopupMethod,
} from "@/lib/wallet-topup";

/** Quick-pick amounts (naira). Free custom entry stays available alongside these. */
const PRESET_NAIRA = [1000, 5000, 20000, 50000, 100000];

type MethodOption = { key: RailTopupMethod; label: string; hint: string; Icon: ComponentType<{ size?: number }> };

/**
 * V3-15-JOB-B — the buyer entry point for the proven hosted-redirect payment
 * rail. It does NOT rebuild the rail — it CALLS it, and that money contract is
 * preserved exactly:
 *   1. POST /api/wallet/topup/init   → durable funding record (shared idempotency UUID)
 *   2. fetchWithSensitiveAction(POST /api/payments/intents) → the proven create
 *      (handles the R1 reauth challenge and retries with the SAME body/key, A11)
 *   3. follow the opaque hosted-redirect (no provider is ever named — Principle 9)
 *
 * On return, /payments/callback advances pending→processing, the webhook confirms
 * →succeeded, and the wallet credit is reconciled on the /wallet load.
 *
 * The method chooser presents Card / Pay from bank app / USSD as opaque tiles —
 * the underlying provider is never surfaced. There is NO maximum amount (owner
 * decision): the guardrails are the R1 reauth above + the provider's own limits.
 */
export default function WalletTopUpClient() {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const numberLocale = locale === "en" ? "en-NG" : locale;
  const minNairaLabel = WALLET_FUNDING_MIN_NAIRA.toLocaleString(numberLocale);

  const methods: MethodOption[] = [
    { key: "card", label: t("Card"), hint: t("Debit or credit card"), Icon: CreditCard },
    { key: "bank_transfer", label: t("Pay from bank app"), hint: t("Transfer from your banking app"), Icon: Landmark },
    { key: "ussd", label: t("USSD"), hint: t("Dial a short code to pay"), Icon: Smartphone },
  ];

  const [amount, setAmount] = useState("5000");
  const [method, setMethod] = useState<RailTopupMethod>("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const amountNaira = Number(amount) || 0;
  const amountLabel = amountNaira > 0 ? `₦${amountNaira.toLocaleString(numberLocale)}` : "";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submittingRef.current) return; // hard guard against double-submit
    if (!RAIL_TOPUP_METHODS.includes(method)) {
      setError(t("Choose a payment method."));
      return;
    }
    // Single shared floor; NO ceiling (owner decision — wallet-topup.ts).
    if (!amountNaira || amountNaira < WALLET_FUNDING_MIN_NAIRA) {
      setError(t("Minimum amount is NGN {min}.").replace("{min}", minNairaLabel));
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
          throw new Error(t("Instant payment isn't available right now. Please try again shortly."));
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
    <form onSubmit={handleSubmit} className="acct-wal__topup" data-live-refresh-pause="true">
      {/* 1 — Method chooser: opaque, tappable tiles (provider never named) */}
      <fieldset className="acct-wal__topup-block">
        <legend className="acct-wal__topup-legend">
          <span className="acct-wal__topup-legend-title">{t("Choose how to pay")}</span>
          <span className="acct-wal__topup-legend-hint">
            {t("Your balance updates the moment payment is confirmed.")}
          </span>
        </legend>
        <div className="acct-wal__methods" role="radiogroup" aria-label={t("Payment method")}>
          {methods.map(({ key, label, hint, Icon }) => {
            const selected = method === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setMethod(key)}
                className="acct-wal__method"
              >
                <span className="acct-wal__method-icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <span className="acct-wal__method-meta">
                  <span className="acct-wal__method-name">{label}</span>
                  <span className="acct-wal__method-hint">{hint}</span>
                </span>
                <span className="acct-wal__method-check" aria-hidden="true">
                  <Check size={16} strokeWidth={3} />
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* 2 — Amount: quick presets + free custom entry */}
      <div className="acct-wal__topup-block">
        <div className="acct-wal__topup-legend">
          <span className="acct-wal__topup-legend-title">{t("How much would you like to add?")}</span>
          <span className="acct-wal__topup-legend-hint">
            {t("Pick a quick amount or type your own.")}
          </span>
        </div>
        <div className="acct-wal__presets">
          {PRESET_NAIRA.map((preset) => (
            <button
              key={preset}
              type="button"
              data-active={amount === String(preset)}
              onClick={() => setAmount(String(preset))}
              className="acct-wal__preset"
            >
              ₦{preset.toLocaleString(numberLocale)}
            </button>
          ))}
        </div>
        <label className="acct-wal__amount">
          <span className="acct-wal__amount-cur" aria-hidden="true">₦</span>
          <input
            type="number"
            min={WALLET_FUNDING_MIN_NAIRA}
            step={1}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="acct-wal__amount-input"
            placeholder={t("Enter amount")}
            inputMode="numeric"
            aria-label={t("Amount")}
          />
        </label>
      </div>

      {error ? (
        <p className="acct-wal__topup-error" role="alert">
          {error}
        </p>
      ) : null}

      {/* 3 — One confident primary action */}
      <div className="acct-wal__topup-foot">
        <button type="submit" disabled={loading} className="acct-button-primary acct-wal__topup-submit">
          <ButtonPendingContent
            pending={loading}
            pendingLabel={t("Opening secure checkout...")}
            spinnerLabel={t("Opening secure checkout...")}
          >
            <>
              {amountLabel ? `${t("Add")} ${amountLabel}` : t("Add money")}
              <ArrowRight size={16} />
            </>
          </ButtonPendingContent>
        </button>
        <span className="acct-wal__topup-note">
          <ShieldCheck size={15} aria-hidden="true" />
          {t("You'll finish on a secure checkout, then return here automatically.")}
        </span>
      </div>
    </form>
  );
}
