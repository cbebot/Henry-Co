import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  disputeResolutionLabel,
  disputeStatusLabel,
  fulfillmentStatusLabel,
  humanizeEnumValue,
  paymentStatusLabel,
  payoutRequestErrorDetail,
  payoutRequestStatusLabel,
  payoutStatusLabel,
} from "./labels";

const t = (label: string) => label;

describe("vendor enum labels — raw enum values never reach the page", () => {
  it("humanizes fulfilment states", () => {
    assert.equal(fulfillmentStatusLabel("awaiting_acceptance", t), "Awaiting acceptance");
    assert.equal(fulfillmentStatusLabel("shipped", t), "Shipped");
    assert.equal(
      fulfillmentStatusLabel("delivered_pending_confirmation", t),
      "Delivered, awaiting confirmation",
    );
  });

  it("humanizes payment states", () => {
    assert.equal(paymentStatusLabel("pending", t), "Payment pending");
    assert.equal(paymentStatusLabel("verified", t), "Payment verified");
  });

  it("buckets settlement states the way computePayoutBalance does", () => {
    assert.equal(payoutStatusLabel("paid_held", t), "Held in escrow");
    assert.equal(payoutStatusLabel("awaiting_auto_release", t), "Awaiting auto-release");
    assert.equal(payoutStatusLabel("payout_releasable", t), "Releasable");
    assert.equal(payoutStatusLabel("payout_frozen", t), "Frozen");
    assert.equal(payoutStatusLabel("payout_released", t), "Released");
  });

  it("humanizes payout-request and dispute states", () => {
    assert.equal(payoutRequestStatusLabel("requested", t), "Requested");
    assert.equal(payoutRequestStatusLabel("paid", t), "Paid");
    assert.equal(disputeStatusLabel("investigating", t), "Investigating");
    assert.equal(disputeResolutionLabel("refund_to_buyer", t), "Refund to buyer");
  });

  it("falls back to a calm title-cased form for unknown values", () => {
    assert.equal(humanizeEnumValue("some_new_state"), "Some new state");
    assert.equal(fulfillmentStatusLabel("some_new_state", t), "Some new state");
    assert.equal(payoutStatusLabel("", t), "");
  });

  it("maps payout redirect error codes to human detail, unknown codes to none", () => {
    assert.equal(
      payoutRequestErrorDetail("amount-exceeds-releasable", t),
      "The amount has to be within your releasable balance.",
    );
    assert.equal(payoutRequestErrorDetail("something-new", t), undefined);
  });

  it("routes every known value through the injected t", () => {
    let calls = 0;
    const counting = (label: string) => {
      calls += 1;
      return label;
    };
    fulfillmentStatusLabel("packed", counting);
    payoutStatusLabel("eligible", counting);
    disputeStatusLabel("open", counting);
    assert.equal(calls, 3);
  });
});
