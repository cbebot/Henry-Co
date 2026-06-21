/**
 * Typed gaming errors. Mirrors the RoomError shape (packages/rooms) — a stable
 * machine `code` plus a human message. Surfaces render these as branded
 * empty-states; they NEVER leak PII (no handle→identity link, no move payload).
 */

export type GamingErrorCode =
  | "illegal_match_transition"
  | "move_rejected"
  | "not_your_turn"
  | "entry_denied"
  | "match_not_found"
  | "match_full"
  | "stale_or_conflict"
  | "fairness_unverified";

export class GamingError extends Error {
  readonly code: GamingErrorCode;

  constructor(code: GamingErrorCode, message: string) {
    super(message);
    this.name = "GamingError";
    this.code = code;
    // Restore prototype chain for instanceof across the ES2022 target.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class IllegalMatchTransitionError extends GamingError {
  constructor(from: string, to: string) {
    super("illegal_match_transition", `illegal match transition: ${from} -> ${to}`);
    this.name = "IllegalMatchTransitionError";
  }
}

export class MoveRejectedError extends GamingError {
  /** stable validation reason (machine code, not prose) */
  readonly reason: string;

  constructor(reason: string) {
    super("move_rejected", `move rejected: ${reason}`);
    this.name = "MoveRejectedError";
    this.reason = reason;
  }
}

export class NotYourTurnError extends GamingError {
  constructor() {
    super("not_your_turn", "not your turn");
    this.name = "NotYourTurnError";
  }
}

export class EntryDeniedError extends GamingError {
  /** why entry was denied — surfaced as a typed, PII-free reason */
  readonly reason: "not_authenticated" | "self_excluded";

  constructor(reason: "not_authenticated" | "self_excluded") {
    super("entry_denied", `entry denied: ${reason}`);
    this.name = "EntryDeniedError";
    this.reason = reason;
  }
}
