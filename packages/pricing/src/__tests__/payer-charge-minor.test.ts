import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { computePayerChargeMinor } from "../currency-model";

describe("computePayerChargeMinor — the single payer-currency charge seam (M1)", () => {
  it("preserves the NGN base exactly (rate 1, x100) — today's behaviour is unchanged", () => {
    const r = computePayerChargeMinor({
      amountMajor: 1500,
      pricingCurrency: "NGN",
      payerCurrency: "NGN",
      chargeCurrencies: ["NGN"],
      rate: 1,
      payerMinorExponent: 2,
    });
    assert.deepEqual(r, { currency: "NGN", minorAmount: 150_000, converted: false });
  });

  it("converts to an allowlisted 2-decimal currency at the frozen rate", () => {
    // ₦1500 at 0.0012 USD/NGN = $1.80 = 180 cents.
    const r = computePayerChargeMinor({
      amountMajor: 1500,
      pricingCurrency: "NGN",
      payerCurrency: "USD",
      chargeCurrencies: ["NGN", "USD"],
      rate: 0.0012,
      payerMinorExponent: 2,
    });
    assert.deepEqual(r, { currency: "USD", minorAmount: 180, converted: true });
  });

  it("does NOT blanket-x100 a zero-decimal currency (the mis-scale the scout flagged)", () => {
    // A payer currency with exponent 0 (e.g. XOF): 12000 major -> 12000 minor, not 1,200,000.
    const r = computePayerChargeMinor({
      amountMajor: 20000,
      pricingCurrency: "NGN",
      payerCurrency: "XOF",
      chargeCurrencies: ["NGN", "XOF"],
      rate: 0.6, // 20000 NGN -> 12000 XOF
      payerMinorExponent: 0,
    });
    assert.deepEqual(r, { currency: "XOF", minorAmount: 12000, converted: true });
  });

  it("returns null (rail falls back to NGN) when the payer currency is NOT allowlisted", () => {
    assert.equal(
      computePayerChargeMinor({
        amountMajor: 1500,
        pricingCurrency: "NGN",
        payerCurrency: "USD",
        chargeCurrencies: ["NGN"], // USD not enabled yet
        rate: 0.0012,
        payerMinorExponent: 2,
      }),
      null,
    );
  });

  it("NGN base is always chargeable even if not spelled out in the allowlist", () => {
    const r = computePayerChargeMinor({
      amountMajor: 100,
      pricingCurrency: "NGN",
      payerCurrency: "NGN",
      chargeCurrencies: [],
      rate: 1,
      payerMinorExponent: 2,
    });
    assert.equal(r?.minorAmount, 10_000);
  });

  it("fails closed on bad inputs (never returns a garbage charge)", () => {
    const base = { pricingCurrency: "NGN", payerCurrency: "USD", chargeCurrencies: ["NGN", "USD"], payerMinorExponent: 2 };
    assert.equal(computePayerChargeMinor({ ...base, amountMajor: 0, rate: 0.001 }), null, "zero amount");
    assert.equal(computePayerChargeMinor({ ...base, amountMajor: -5, rate: 0.001 }), null, "negative amount");
    assert.equal(computePayerChargeMinor({ ...base, amountMajor: 1500, rate: 0 }), null, "zero rate");
    assert.equal(
      computePayerChargeMinor({ amountMajor: 1500, pricingCurrency: "NG", payerCurrency: "USD", chargeCurrencies: ["USD"], rate: 1, payerMinorExponent: 2 }),
      null,
      "invalid currency code",
    );
  });
});
