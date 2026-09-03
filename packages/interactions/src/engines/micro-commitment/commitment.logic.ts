/**
 * Micro-Commitment Engine — pure ladder resolver (doctrine Engine 2 /
 * Principle 13).
 *
 * "Ask for $0 first, then $0 with an email, then $5, then $200." The ladder:
 *
 *   anonymous → cookie → identified → account → verified → subscribed
 *
 * Rules encoded here, deterministically (caller owns the clock):
 *  - offer EXACTLY the next rung — never one the user cleared, never two above;
 *  - declines have cooldowns: no second ask for the same rung in the same
 *    session; no third ask for the same rung within a week;
 *  - top of the ladder → no offer, ever.
 *
 * Skipping rungs to chase short-term conversion costs long-term LTV.
 * Hold the ladder.
 */

export const COMMITMENT_TIERS = [
  "anonymous",
  "cookie",
  "identified",
  "account",
  "verified",
  "subscribed",
] as const;

export type CommitmentTier = (typeof COMMITMENT_TIERS)[number];

export interface OfferRecord {
  toTier: CommitmentTier;
  /** Wall-clock ms when the offer was shown. */
  at: number;
  /** Opaque session identifier at the time of the offer. */
  sessionId: string;
}

export interface CommitmentOffer {
  fromTier: CommitmentTier;
  toTier: CommitmentTier;
}

export const WEEK_MS = 7 * 24 * 3600 * 1000;

export function tierIndex(tier: CommitmentTier): number {
  return COMMITMENT_TIERS.indexOf(tier);
}

export function nextOffer(
  tier: CommitmentTier,
  history: OfferRecord[],
  now: number,
  sessionId: string,
): CommitmentOffer | null {
  const idx = tierIndex(tier);
  if (idx < 0 || idx >= COMMITMENT_TIERS.length - 1) return null;
  const toTier = COMMITMENT_TIERS[idx + 1];

  const asksForRung = history.filter((h) => h.toTier === toTier);

  // Cooldown 1 — never twice in the same session.
  if (asksForRung.some((h) => h.sessionId === sessionId)) return null;

  // Cooldown 2 — never a third ask for the same rung within a week.
  const inLastWeek = asksForRung.filter((h) => now - h.at < WEEK_MS);
  if (inLastWeek.length >= 2) return null;

  return { fromTier: tier, toTier };
}
