import { emitEvent } from "@henryco/observability/events";
import {
  paymentEventClassification,
  paymentEventOutcome,
  type PaymentEventName,
} from "@henryco/payment-router";

/**
 * Emit a payment event with its canonical axes derived from the name.
 *
 * The event NAME is provider-agnostic by construction (ANTI-CLONE Principle 9):
 * `henry.payment.paystack.*` is NOT a distinct name — the provider rides in
 * `payload.provider` as a server-side dimension, so the finance tile rolls
 * payments up by outcome/classification without a per-vendor taxonomy. The
 * outcome/classification maps are exhaustively unit-tested in
 * `@henryco/payment-router` (telemetry.test.ts); this is the thin route-layer
 * call site that forwards to the shared sink.
 */
export function emitPaymentEvent(
  name: PaymentEventName,
  opts: { actorId?: string; payload?: Record<string, unknown> } = {},
): void {
  emitEvent({
    name,
    classification: paymentEventClassification(name),
    outcome: paymentEventOutcome(name),
    actorId: opts.actorId,
    payload: opts.payload,
  });
}

/**
 * The money-truth intent event for a confirmed terminal status. Emitted ONLY
 * when `apply_payment_webhook` reports `applied:true` (its dedup gate), so the
 * event fires exactly once whether finalize or the async webhook confirms first.
 */
export function intentEventForStatus(
  status: "succeeded" | "failed" | "refunded",
): PaymentEventName {
  switch (status) {
    case "succeeded":
      return "henry.payment.intent.succeeded";
    case "failed":
      return "henry.payment.intent.failed";
    case "refunded":
      return "henry.payment.intent.refunded";
  }
}
