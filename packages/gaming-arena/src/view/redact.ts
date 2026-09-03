/**
 * Pure, game-aware view redaction — applied SERVER-SIDE before authoritative
 * state is sent to a participant. It (1) strips player identity from the state
 * envelope (the client gets seats + handles via the match view, never raw auth
 * user_ids), and (2) for Onyx Cards hides the opponent's pending simultaneous
 * commit AND the fact they shadow-bid it this round. Onyx Lines is
 * perfect-information, so only identity stripping applies. Client-safe + tested.
 *
 * `-1` is the sentinel for "opponent has committed this round, value hidden" so
 * the UI can show a face-down card without leaking the value.
 */

import type { GameState, Seat } from "../types";

export const HIDDEN_COMMIT = -1;

export function redactMatchStateForSeat(state: GameState, viewerSeat: Seat | null): GameState {
  // Strip raw auth user_ids from the seat list for EVERY game — the client only
  // ever needs the seat index; identity (handle) comes via the match view.
  const seats = state.seats.map((s) => ({ seat: s.seat, userId: "" }));

  if (state.gameId !== "onyx-cards") {
    return { ...state, seats };
  }

  const board = state.board as Record<string, unknown>;
  const committed = board.committed;
  const shadowThisRound = board.shadowThisRound;
  const shadowUsed = board.shadowUsed;
  if (!Array.isArray(committed)) return { ...state, seats };

  // At most one seat has a pending commit (resolution resets both atomically).
  const redactedCommitted = committed.map((v, seat) =>
    seat !== viewerSeat && v !== null && v !== undefined ? HIDDEN_COMMIT : v,
  );
  const redactedShadowThis = Array.isArray(shadowThisRound)
    ? shadowThisRound.map((v, seat) => (seat !== viewerSeat ? false : v))
    : shadowThisRound;

  // Hide the opponent's `shadowUsed` flip when it happened THIS (unresolved)
  // round — otherwise the bluff leaks before reveal. A shadow used in a PRIOR
  // round is public knowledge (the player has spent their one shadow), so keep it.
  let redactedShadowUsed = shadowUsed;
  if (Array.isArray(shadowUsed) && Array.isArray(shadowThisRound)) {
    redactedShadowUsed = shadowUsed.map((v, seat) => {
      const oppPendingShadow =
        seat !== viewerSeat &&
        committed[seat] !== null &&
        committed[seat] !== undefined &&
        shadowThisRound[seat] === true;
      return oppPendingShadow ? false : v;
    });
  }

  return {
    ...state,
    seats,
    board: {
      ...board,
      committed: redactedCommitted,
      shadowThisRound: redactedShadowThis,
      shadowUsed: redactedShadowUsed,
    },
  };
}
