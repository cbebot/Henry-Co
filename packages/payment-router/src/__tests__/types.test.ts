import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateAmountMinor,
  normalizeCurrency,
  minorUnitExponent,
  PAYMENT_METHODS,
} from "../types";

describe("validateAmountMinor", () => {
  it("accepts positive safe integers", () => {
    assert.deepEqual(validateAmountMinor(150000), { ok: true, value: 150000 });
    assert.deepEqual(validateAmountMinor(1), { ok: true, value: 1 });
  });

  it("rejects zero, negatives, floats, NaN, and unsafe ints", () => {
    for (const bad of [0, -1, -150000, 1.5, 0.01, NaN, Number.MAX_SAFE_INTEGER + 1, Infinity]) {
      assert.equal(validateAmountMinor(bad).ok, false, `expected ${bad} to be rejected`);
    }
  });
});

describe("normalizeCurrency (A4 — reject unsupported, never fall back to NGN)", () => {
  it("upcases and accepts a supported currency", () => {
    assert.deepEqual(normalizeCurrency("ngn"), { ok: true, value: "NGN" });
    assert.deepEqual(normalizeCurrency("USD"), { ok: true, value: "USD" });
  });

  it("rejects an unsupported currency rather than silently falling back to NGN", () => {
    const r = normalizeCurrency("ZZZ");
    assert.equal(r.ok, false);
    // Critical: the result must NOT be a silent NGN coercion.
    if (!r.ok) assert.match(r.error, /unsupported/i);
  });
});

describe("minorUnitExponent (A4 — correct ISO-4217 exponent)", () => {
  it("returns 2 for NGN and 0 for a zero-decimal currency", () => {
    assert.equal(minorUnitExponent("NGN"), 2);
    assert.equal(minorUnitExponent("XOF"), 0);
  });
});

describe("PAYMENT_METHODS (A10 — wallet methods enumerated)", () => {
  it("includes apple_pay and google_pay as distinct values", () => {
    assert.ok(PAYMENT_METHODS.includes("apple_pay"));
    assert.ok(PAYMENT_METHODS.includes("google_pay"));
    assert.ok(PAYMENT_METHODS.includes("card"));
    assert.ok(PAYMENT_METHODS.includes("bank_transfer"));
    assert.ok(PAYMENT_METHODS.includes("ussd"));
    assert.ok(PAYMENT_METHODS.includes("mobile_money"));
  });
});
