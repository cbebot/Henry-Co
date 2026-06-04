import type { AttentionStatus } from "./types";

/**
 * A publish-time validation failure. Carries the offending `field` so callers
 * can surface a precise rejection rather than a generic "invalid item".
 */
export class ValidationError extends Error {
  readonly field: string;
  constructor(field: string, message: string) {
    super(`${field}: ${message}`);
    this.name = "ValidationError";
    this.field = field;
  }
}

/**
 * Thrown by `assertTransition` when a status move is not in `LEGAL_TRANSITIONS`.
 * The Command Center's lifecycle guard — the in-process mirror of the SQL
 * trigger that lands at live-wiring.
 */
export class IllegalAttentionTransitionError extends Error {
  readonly from: AttentionStatus;
  readonly to: AttentionStatus;
  constructor(from: AttentionStatus, to: AttentionStatus) {
    super(`illegal attention-item transition: ${from} -> ${to}`);
    this.name = "IllegalAttentionTransitionError";
    this.from = from;
    this.to = to;
  }
}
