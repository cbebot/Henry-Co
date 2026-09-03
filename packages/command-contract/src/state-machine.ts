import type { AttentionStatus } from "./types";
import { ALL_ATTENTION_STATUSES } from "./types";
import { IllegalAttentionTransitionError } from "./errors";

export { ALL_ATTENTION_STATUSES };

/**
 * THE source of truth for legal attention-item lifecycle transitions.
 *
 * At live-wiring (V3-COMMAND-03) a SQL trigger on `command_attention_items`
 * MUST mirror this table exactly — defence-in-depth, the same lock-step
 * discipline `@henryco/payment-router` keeps with its payment-intent trigger.
 *
 * `escalated` is the honest staff→owner bump: a staff member who cannot or
 * should not decide an item escalates it; the item surfaces to the owner, who
 * resolves or dismisses. Terminal states (`resolved`, `dismissed`) have no
 * outgoing edges.
 */
export const LEGAL_TRANSITIONS: Record<AttentionStatus, AttentionStatus[]> = {
  open: ["acknowledged", "in_progress", "escalated", "dismissed"],
  acknowledged: ["in_progress", "escalated", "resolved", "dismissed"],
  in_progress: ["acknowledged", "escalated", "resolved"],
  escalated: ["in_progress", "resolved", "dismissed"],
  resolved: [],
  dismissed: [],
};

/**
 * Whether `from -> to` is permitted. Same-state writes are legal idempotent
 * no-ops (a re-delivered event re-asserting the current status must not be
 * rejected as illegal).
 */
export function isLegalTransition(from: AttentionStatus, to: AttentionStatus): boolean {
  if (from === to) return true;
  return LEGAL_TRANSITIONS[from].includes(to);
}

/** Throw {@link IllegalAttentionTransitionError} unless `from -> to` is legal. */
export function assertTransition(from: AttentionStatus, to: AttentionStatus): void {
  if (!isLegalTransition(from, to)) {
    throw new IllegalAttentionTransitionError(from, to);
  }
}
