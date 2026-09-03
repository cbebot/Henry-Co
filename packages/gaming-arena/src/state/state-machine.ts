/**
 * Match state machine — in-process guard (Layer 1).
 *
 * Modelled on packages/payment-router/src/state-machine.ts. This table is the
 * executable spec; the DB function `enforce_gaming_match_transition()` in the
 * Pass-1 migration is a LINE-FOR-LINE transcription of it (Layer 2, the
 * unbypassable guard). A divergence between the two is a correctness bug — both
 * are tested.
 *
 * `* -> abandoned` is encoded by listing "abandoned" in every non-terminal row
 * (no wildcard in code, so the SQL can mirror it exactly). Terminal states
 * (`completed`, `abandoned`) have NO outgoing edges. Same-state is an idempotent
 * no-op (a re-delivered event re-asserting the current status must not reject).
 */

import { IllegalMatchTransitionError } from "../errors";
import type { MatchStatus } from "../types";

export const ALL_MATCH_STATUSES: readonly MatchStatus[] = [
  "lobby",
  "matchmaking",
  "in_progress",
  "completed",
  "abandoned",
] as const;

/** THE source of truth for legal gaming-match transitions. Mirror in SQL exactly. */
export const LEGAL_MATCH_TRANSITIONS: Record<MatchStatus, MatchStatus[]> = {
  lobby: ["matchmaking", "abandoned"],
  matchmaking: ["in_progress", "abandoned"],
  in_progress: ["completed", "abandoned"],
  completed: [],
  abandoned: [],
};

/** Whether `from -> to` is permitted. Same-state writes are legal no-ops. */
export function isLegalMatchTransition(from: MatchStatus, to: MatchStatus): boolean {
  if (from === to) return true;
  return LEGAL_MATCH_TRANSITIONS[from].includes(to);
}

/** Throw `IllegalMatchTransitionError` unless `from -> to` is legal. */
export function assertMatchTransition(from: MatchStatus, to: MatchStatus): void {
  if (!isLegalMatchTransition(from, to)) {
    throw new IllegalMatchTransitionError(from, to);
  }
}

/** Terminal states have no outgoing edges. */
export function isTerminalStatus(status: MatchStatus): boolean {
  return LEGAL_MATCH_TRANSITIONS[status].length === 0;
}
