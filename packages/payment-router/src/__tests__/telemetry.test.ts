import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  paymentEventOutcome,
  paymentEventClassification,
  type PaymentEventName,
} from "../telemetry";

// The full payment slice of the taxonomy. If a name is added to
// HenryEventName, the Record maps in telemetry.ts stop compiling until it is
// classified — this list is the runtime spot-check that the mapping is sane.
const ALL: PaymentEventName[] = [
  "henry.payment.intent.created",
  "henry.payment.intent.succeeded",
  "henry.payment.intent.failed",
  "henry.payment.intent.refunded",
  "henry.payment.webhook.received",
  "henry.payment.webhook.verified",
  "henry.payment.webhook.rejected",
  "henry.payment.no_suitable_provider",
  "henry.payment.illegal_transition",
];

describe("payment telemetry mapping", () => {
  it("maps the money lifecycle onto the shared outcome axis", () => {
    assert.equal(paymentEventOutcome("henry.payment.intent.created"), "started");
    assert.equal(paymentEventOutcome("henry.payment.intent.succeeded"), "paid");
    assert.equal(paymentEventOutcome("henry.payment.intent.failed"), "failed");
    assert.equal(paymentEventOutcome("henry.payment.intent.refunded"), "completed");
  });

  it("maps the webhook path: received→requested, verified→verified, rejected→rejected", () => {
    assert.equal(paymentEventOutcome("henry.payment.webhook.received"), "requested");
    assert.equal(paymentEventOutcome("henry.payment.webhook.verified"), "verified");
    assert.equal(paymentEventOutcome("henry.payment.webhook.rejected"), "rejected");
  });

  it("maps both A5 fallback and illegal-transition to blocked", () => {
    assert.equal(paymentEventOutcome("henry.payment.no_suitable_provider"), "blocked");
    assert.equal(paymentEventOutcome("henry.payment.illegal_transition"), "blocked");
  });

  it("classifies only intent.created as user_action; the rest are system_state", () => {
    assert.equal(paymentEventClassification("henry.payment.intent.created"), "user_action");
    for (const name of ALL.filter((n) => n !== "henry.payment.intent.created")) {
      assert.equal(paymentEventClassification(name), "system_state", `${name} should be system_state`);
    }
  });

  it("has an outcome + classification for every payment event (no gaps)", () => {
    for (const name of ALL) {
      assert.ok(paymentEventOutcome(name), `missing outcome for ${name}`);
      assert.ok(paymentEventClassification(name), `missing classification for ${name}`);
    }
  });
});
