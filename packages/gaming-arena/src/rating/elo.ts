/**
 * Elo rating math — PURE. Used ONLY server-side inside completeMatch (mirrors
 * V3-58 seller_tiers: only the server writes ratings; there is no client path).
 * Exposed in the client-safe barrel so the surface can preview a delta and a
 * third party can verify the rating change from a finished match.
 */

import type { EloResult } from "../types";

export const DEFAULT_ELO = 1200;
export const DEFAULT_K_FACTOR = 32;

/** Expected score of A against B on the standard logistic curve. */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

/**
 * New ratings after a head-to-head result.
 * `result`: 1 = seat A wins, 0 = seat B wins, 0.5 = tie. Rounded to integers.
 * Zero-sum in expectation: A's gain equals B's loss before rounding.
 */
export function applyElo(
  ratingA: number,
  ratingB: number,
  result: 0 | 0.5 | 1,
  kFactor: number = DEFAULT_K_FACTOR,
): EloResult {
  const expectedA = expectedScore(ratingA, ratingB);
  const expectedB = 1 - expectedA;
  const scoreA = result;
  const scoreB = 1 - result;
  return {
    ratingA: Math.round(ratingA + kFactor * (scoreA - expectedA)),
    ratingB: Math.round(ratingB + kFactor * (scoreB - expectedB)),
  };
}

/** Map a winner seat (or tie) to the seat-A-relative result score. */
export function resultForSeatA(winnerSeat: 0 | 1 | null): 0 | 0.5 | 1 {
  if (winnerSeat === null) return 0.5;
  return winnerSeat === 0 ? 1 : 0;
}
