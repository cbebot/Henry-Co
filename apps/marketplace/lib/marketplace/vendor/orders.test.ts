import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { deriveOrderTimeline, VENDOR_FULFILLMENT_OPTIONS } from "./orders";

const t = (label: string) => label;

describe("VENDOR_FULFILLMENT_OPTIONS — the API contract stays raw", () => {
  it("keeps the exact values the vendor_order_update intent accepts", () => {
    assert.deepEqual(
      [...VENDOR_FULFILLMENT_OPTIONS],
      ["confirmed", "packed", "shipped", "delivered", "delayed"],
    );
  });
});

describe("deriveOrderTimeline — four stages from existing fields only", () => {
  it("walks a fresh unpaid order: placed done, payment current, settlement upcoming", () => {
    const steps = deriveOrderTimeline(
      { fulfillmentStatus: "awaiting_acceptance", paymentStatus: "pending", payoutStatus: "awaiting_payment" },
      t,
    );
    assert.deepEqual(
      steps.map((step) => [step.key, step.state]),
      [
        ["placed", "done"],
        ["payment", "current"],
        ["fulfilment", "current"],
        ["settlement", "upcoming"],
      ],
    );
    assert.equal(steps[1].detail, "Payment pending");
    assert.equal(steps[2].detail, "Awaiting acceptance");
  });

  it("marks a delivered, escrow-held order done through fulfilment", () => {
    const steps = deriveOrderTimeline(
      { fulfillmentStatus: "delivered", paymentStatus: "verified", payoutStatus: "awaiting_auto_release" },
      t,
    );
    assert.deepEqual(
      steps.map((step) => step.state),
      ["done", "done", "done", "current"],
    );
    assert.equal(steps[3].detail, "Awaiting auto-release");
  });

  it("flags delays and frozen settlements for attention", () => {
    const steps = deriveOrderTimeline(
      { fulfillmentStatus: "delayed", paymentStatus: "verified", payoutStatus: "payout_frozen" },
      t,
    );
    assert.equal(steps[2].state, "attention");
    assert.equal(steps[3].state, "attention");
    assert.equal(steps[3].detail, "Frozen");
  });

  it("marks a released settlement done", () => {
    const steps = deriveOrderTimeline(
      { fulfillmentStatus: "delivered", paymentStatus: "verified", payoutStatus: "payout_released" },
      t,
    );
    assert.equal(steps[3].state, "done");
  });
});
