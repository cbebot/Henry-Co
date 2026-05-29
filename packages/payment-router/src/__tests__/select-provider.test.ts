import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PaymentRouter } from "../router";
import { providerWithKey } from "./_helpers";

describe("selectProvider (country ∩ capability ∩ registered)", () => {
  it("returns null when no provider is registered", () => {
    const router = new PaymentRouter({ providers: [] });
    assert.equal(router.selectProvider({ country: "NG", currency: "NGN", method: "card" }), null);
  });

  it("returns the first eligible provider in country-preference order", () => {
    const router = new PaymentRouter({
      providers: [providerWithKey("paystack"), providerWithKey("flutterwave")],
    });
    assert.equal(router.selectProvider({ country: "NG", currency: "NGN", method: "card" }), "paystack");
  });

  it("does NOT select a country-preferred provider that lacks the method", () => {
    const router = new PaymentRouter({ providers: [providerWithKey("paystack")] });
    // paystack has no apple_pay capability → no eligible provider.
    assert.equal(router.selectProvider({ country: "NG", currency: "NGN", method: "apple_pay" }), null);
  });

  it("falls through to the second preference when the first lacks the method", () => {
    const router = new PaymentRouter({
      providers: [providerWithKey("paystack"), providerWithKey("flutterwave")],
    });
    // mobile_money: paystack lacks it, flutterwave has it → flutterwave.
    assert.equal(
      router.selectProvider({ country: "NG", currency: "NGN", method: "mobile_money" }),
      "flutterwave",
    );
  });

  it("skips a country-preferred provider that is not registered", () => {
    // NG prefers paystack then flutterwave; only flutterwave registered → flutterwave.
    const router = new PaymentRouter({ providers: [providerWithKey("flutterwave")] });
    assert.equal(router.selectProvider({ country: "NG", currency: "NGN", method: "card" }), "flutterwave");
  });

  it("returns null for an unknown country even when providers are registered", () => {
    const router = new PaymentRouter({ providers: [providerWithKey("stripe")] });
    assert.equal(router.selectProvider({ country: "ZZ", currency: "USD", method: "card" }), null);
  });
});
