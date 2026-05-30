import type { PaymentIntentStatus } from "./types";
import { IllegalTransitionError } from "./errors";

export const ALL_STATUSES: readonly PaymentIntentStatus[] = [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "refund_processing",
  "refunded",
  "cancelled",
] as const;

/**
 * THE source of truth for legal payment-intent transitions (A2).
 *
 * The SQL function `enforce_payment_intent_transition()` in
 * `apps/hub/supabase/migrations/20260529120000_payment_intents.sql` MUST
 * mirror this table exactly. They are kept in lock-step deliberately:
 * defence-in-depth means the DB trigger is the unbypassable guard and this
 * table is the in-process guard, but a divergence between them would be a
 * money bug — so the SQL is written as a direct transcription of these rows.
 *
 * `refund_processing` is the honest intermediate between requesting a refund and
 * the provider confirming money moved (Q3): `succeeded -> refund_processing` is the
 * request, `refund_processing -> refunded` is the provider's `refund.processed`
 * webhook, and `refund_processing -> succeeded` reverts when the refund fails (or
 * the provider rejects it synchronously) — money is still with us, so `succeeded`
 * is the truthful state. `refunded` therefore ALWAYS means provider-confirmed.
 *
 * Terminal states (`failed`, `refunded`, `cancelled`) have no outgoing edges.
 */
export const LEGAL_TRANSITIONS: Record<PaymentIntentStatus, PaymentIntentStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["succeeded", "failed"],
  succeeded: ["refund_processing"],
  refund_processing: ["refunded", "succeeded"],
  failed: [],
  refunded: [],
  cancelled: [],
};

/**
 * Whether `from -> to` is permitted. Same-state writes are treated as legal
 * idempotent no-ops (a re-delivered webhook that re-asserts the current status
 * must not be rejected as illegal).
 */
export function isLegalTransition(
  from: PaymentIntentStatus,
  to: PaymentIntentStatus,
): boolean {
  if (from === to) return true;
  return LEGAL_TRANSITIONS[from].includes(to);
}

/** Throw {@link IllegalTransitionError} unless `from -> to` is legal. */
export function assertTransition(
  from: PaymentIntentStatus,
  to: PaymentIntentStatus,
): void {
  if (!isLegalTransition(from, to)) {
    throw new IllegalTransitionError(from, to);
  }
}
