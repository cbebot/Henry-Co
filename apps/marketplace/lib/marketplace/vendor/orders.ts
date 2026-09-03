// Vendor order fulfilment models — pure and testable, copy via injected `t`.
// The timeline is derived ONLY from fields the order group already carries
// (fulfillment/payment/payout status) — no invented progress.

import {
  fulfillmentStatusLabel,
  paymentStatusLabel,
  payoutStatusLabel,
} from "./labels";

type Translate = (label: string) => string;

/**
 * The states a vendor can set from the update form. Values are the API
 * contract (`vendor_order_update`.fulfillment_status) and stay raw; labels
 * are translated at render via `fulfillmentStatusLabel`.
 */
export const VENDOR_FULFILLMENT_OPTIONS = [
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "delayed",
] as const;

export type OrderTimelineStep = {
  key: "placed" | "payment" | "fulfilment" | "settlement";
  label: string;
  detail: string;
  state: "done" | "current" | "upcoming" | "attention";
};

const DELIVERED_STATES = new Set(["delivered", "delivered_pending_confirmation"]);
const FULFILMENT_ATTENTION_STATES = new Set(["delayed", "returned"]);
const SETTLEMENT_DONE_STATES = new Set(["payout_released", "released", "paid"]);
const SETTLEMENT_ATTENTION_STATES = new Set([
  "payout_frozen",
  "frozen",
  "disputed",
  "refunded",
  "partially_refunded",
]);

/**
 * Four honest stages for the order detail: placed → payment → fulfilment →
 * settlement, each stamped with the humanized status it currently carries.
 */
export function deriveOrderTimeline(
  order: { fulfillmentStatus: string; paymentStatus: string; payoutStatus: string },
  t: Translate,
): OrderTimelineStep[] {
  const paymentState: OrderTimelineStep["state"] =
    order.paymentStatus === "verified"
      ? "done"
      : order.paymentStatus === "failed" || order.paymentStatus === "refunded"
        ? "attention"
        : "current";

  const fulfilmentState: OrderTimelineStep["state"] = DELIVERED_STATES.has(
    order.fulfillmentStatus,
  )
    ? "done"
    : FULFILMENT_ATTENTION_STATES.has(order.fulfillmentStatus)
      ? "attention"
      : "current";

  const settlementState: OrderTimelineStep["state"] = SETTLEMENT_DONE_STATES.has(
    order.payoutStatus,
  )
    ? "done"
    : SETTLEMENT_ATTENTION_STATES.has(order.payoutStatus)
      ? "attention"
      : fulfilmentState === "done"
        ? "current"
        : "upcoming";

  return [
    {
      key: "placed",
      label: t("Order placed"),
      detail: "",
      state: "done",
    },
    {
      key: "payment",
      label: t("Payment"),
      detail: paymentStatusLabel(order.paymentStatus, t),
      state: paymentState,
    },
    {
      key: "fulfilment",
      label: t("Fulfilment"),
      detail: fulfillmentStatusLabel(order.fulfillmentStatus, t),
      state: fulfilmentState,
    },
    {
      key: "settlement",
      label: t("Settlement"),
      detail: payoutStatusLabel(order.payoutStatus, t),
      state: settlementState,
    },
  ];
}
