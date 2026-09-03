import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { providerSupportsMethod, CAPABILITY_MATRIX } from "../routing/capability-matrix";
import { PAYMENT_METHODS } from "../types";

describe("capability matrix (A10 wallet methods)", () => {
  it("stripe supports apple_pay and google_pay", () => {
    assert.equal(providerSupportsMethod("stripe", "apple_pay"), true);
    assert.equal(providerSupportsMethod("stripe", "google_pay"), true);
    assert.equal(providerSupportsMethod("stripe", "card"), true);
  });

  it("paystack supports ussd and bank_transfer but NOT apple_pay", () => {
    assert.equal(providerSupportsMethod("paystack", "ussd"), true);
    assert.equal(providerSupportsMethod("paystack", "bank_transfer"), true);
    assert.equal(providerSupportsMethod("paystack", "apple_pay"), false);
  });

  it("flutterwave supports mobile_money", () => {
    assert.equal(providerSupportsMethod("flutterwave", "mobile_money"), true);
  });

  it("mock supports every defined method (test rail)", () => {
    for (const m of PAYMENT_METHODS) {
      assert.equal(providerSupportsMethod("mock", m), true, `mock should support ${m}`);
    }
    assert.equal(CAPABILITY_MATRIX.mock.length, PAYMENT_METHODS.length);
  });
});
