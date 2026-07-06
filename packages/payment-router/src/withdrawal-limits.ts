// V3-MONEY-PAYOUT — withdrawal (payout) limits: tiered by KYC, per-currency, pure + testable.
//
// A payout moves money OUT, so limits guard fraud (a compromised account draining a wallet),
// fat-finger, and AML thresholds — without frustrating a legitimate earner. The policy (owner-
// approved): NEVER cash out for an unverified account; for an identity-verified account, a
// ₦100 floor, a ₦5,000,000 single ceiling (the Nigerian NIP single-transfer ceiling, which covers
// real seller payouts), and a ₦10,000,000/day cap (an AML-reasonable anti-drain bound).
//
// Per-currency + per-tier by construction: NGN is active today; other currencies are added here
// the moment multi-currency wallets exist (the rail + adapter are already currency-generic), so
// no code path changes — just a new row. Amounts are minor units (kobo for NGN).

/** KYC tiers relevant to cash-out. Extend as the KYC ladder grows (e.g. a higher business tier). */
export type WithdrawalKycTier = "unverified" | "verified";

export interface WithdrawalLimit {
  /** Smallest allowed withdrawal (minor units) — kept comfortably above the transfer fee. */
  minMinor: number;
  /** Largest single withdrawal (minor units). */
  maxSingleMinor: number;
  /** Rolling 24h cap across a person's withdrawals (minor units). */
  dailyCapMinor: number;
}

export type WithdrawalLimitTable = Record<string, Partial<Record<WithdrawalKycTier, WithdrawalLimit>>>;

/**
 * The default limit table. A currency with no entry, or a tier with no entry, means "not allowed"
 * — so an unverified account (no `verified` tier match for it) is fail-closed, never cashed out.
 */
export const DEFAULT_WITHDRAWAL_LIMITS: WithdrawalLimitTable = {
  NGN: {
    // ₦100 min · ₦5,000,000 single · ₦10,000,000/day (kobo).
    verified: { minMinor: 10_000, maxSingleMinor: 500_000_000, dailyCapMinor: 1_000_000_000 },
    // no `unverified` entry ⇒ unverified accounts cannot withdraw (KYC first).
  },
};

export type WithdrawalDecisionReason =
  | "currency_unsupported"
  | "kyc_required"
  | "below_min"
  | "above_max_single"
  | "daily_cap_exceeded";

export type WithdrawalDecision =
  | { ok: true; limit: WithdrawalLimit }
  | { ok: false; reason: WithdrawalDecisionReason; limit?: WithdrawalLimit };

/**
 * Decide whether a withdrawal is allowed. Pure: given the amount, currency, the person's KYC tier,
 * and how much they have already withdrawn in the rolling window (pending + paid, so an in-flight
 * withdrawal still counts toward the cap), return allow or a typed reason. The DB reserve is the
 * final overdraw guard on balance; this is the POLICY gate that runs first.
 */
export function evaluateWithdrawal(
  input: {
    amountMinor: number;
    currency: string;
    kycTier: WithdrawalKycTier;
    /** Sum of the person's pending + paid withdrawals in the rolling 24h window (minor units). */
    windowWithdrawnMinor: number;
  },
  limits: WithdrawalLimitTable = DEFAULT_WITHDRAWAL_LIMITS,
): WithdrawalDecision {
  const currency = String(input.currency || "").toUpperCase();
  const perCurrency = limits[currency];
  if (!perCurrency) return { ok: false, reason: "currency_unsupported" };

  const limit = perCurrency[input.kycTier];
  // No limit for this tier ⇒ this tier cannot withdraw this currency (unverified is fail-closed).
  if (!limit) return { ok: false, reason: "kyc_required" };

  const amount = Math.trunc(input.amountMinor);
  if (!Number.isSafeInteger(amount) || amount < limit.minMinor) return { ok: false, reason: "below_min", limit };
  if (amount > limit.maxSingleMinor) return { ok: false, reason: "above_max_single", limit };

  const priorWindow = Math.max(0, Math.trunc(input.windowWithdrawnMinor));
  if (priorWindow + amount > limit.dailyCapMinor) return { ok: false, reason: "daily_cap_exceeded", limit };

  return { ok: true, limit };
}
