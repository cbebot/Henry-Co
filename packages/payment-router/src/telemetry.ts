import type {
  EventClassification,
  EventOutcome,
  HenryEventName,
} from "@henryco/observability/events";

/**
 * The payment-router slice of the canonical event taxonomy. Derived from
 * `HenryEventName` with a template-literal `Extract`, so this set can NEVER
 * drift from the union in `@henryco/observability/events` — add a
 * `henry.payment.*` name there and it appears here automatically (and the
 * maps below stop compiling until you classify it).
 *
 * Imports are TYPE-ONLY: this module is erased to nothing at runtime, carries
 * no `server-only` poison, and is safe to import anywhere (incl. tsx tests).
 */
export type PaymentEventName = Extract<HenryEventName, `henry.payment.${string}`>;

/**
 * Outcome axis for each payment event. Every value is an existing
 * {@link EventOutcome} — payments deliberately reuse the shared axis
 * (created→started, succeeded→paid, refunded→completed) so the owner finance
 * tile rolls them up alongside every other domain with no special-casing.
 *
 * This is a `Record<PaymentEventName, …>`, so it is EXHAUSTIVE by construction:
 * a missing event is a compile error, and an outcome outside `EventOutcome` is
 * a compile error. No runtime guard needed.
 */
const PAYMENT_EVENT_OUTCOME: Record<PaymentEventName, EventOutcome> = {
  "henry.payment.intent.created": "started",
  "henry.payment.intent.succeeded": "paid",
  "henry.payment.intent.failed": "failed",
  "henry.payment.intent.refunded": "completed",
  "henry.payment.refund.initiated": "requested",
  "henry.payment.refund.processed": "completed",
  "henry.payment.refund.failed": "failed",
  "henry.payment.refund.orphaned": "blocked",
  "henry.payment.webhook.received": "requested",
  "henry.payment.webhook.verified": "verified",
  "henry.payment.webhook.rejected": "rejected",
  "henry.payment.no_suitable_provider": "blocked",
  "henry.payment.illegal_transition": "blocked",
};

/**
 * Actor-driven vs system-driven classification. `intent.created` is the one
 * user-initiated moment (the buyer pressed pay); everything after is the
 * router, the provider callback, or the state machine acting on its own.
 */
const PAYMENT_EVENT_CLASSIFICATION: Record<PaymentEventName, EventClassification> = {
  "henry.payment.intent.created": "user_action",
  "henry.payment.intent.succeeded": "system_state",
  "henry.payment.intent.failed": "system_state",
  "henry.payment.intent.refunded": "system_state",
  // V3-19: `initiated` is the one staff-driven moment; the outcomes are the
  // provider/state machine acting on their own.
  "henry.payment.refund.initiated": "user_action",
  "henry.payment.refund.processed": "system_state",
  "henry.payment.refund.failed": "system_state",
  "henry.payment.refund.orphaned": "system_state",
  "henry.payment.webhook.received": "system_state",
  "henry.payment.webhook.verified": "system_state",
  "henry.payment.webhook.rejected": "system_state",
  "henry.payment.no_suitable_provider": "system_state",
  "henry.payment.illegal_transition": "system_state",
};

/** The canonical {@link EventOutcome} for a payment event. */
export function paymentEventOutcome(name: PaymentEventName): EventOutcome {
  return PAYMENT_EVENT_OUTCOME[name];
}

/** The canonical {@link EventClassification} for a payment event. */
export function paymentEventClassification(name: PaymentEventName): EventClassification {
  return PAYMENT_EVENT_CLASSIFICATION[name];
}
