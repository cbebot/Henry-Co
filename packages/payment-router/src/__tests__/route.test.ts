import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PaymentRouter, createPaymentRouter } from "../router";
import type { PaymentProviderKey } from "../types";
import { providerWithKey } from "./_helpers";

const baseIntent = {
  intentId: "i1",
  amountMinor: 50000,
  currency: "NGN",
  country: "NG",
  method: "card" as const,
  idempotencyKey: "k1",
};

describe("PaymentRouter.route", () => {
  it("routes NG card through a registered provider and returns a provider-AGNOSTIC result", async () => {
    const router = new PaymentRouter({ providers: [providerWithKey("paystack")] });
    const r = await router.route(baseIntent);
    assert.equal(r.ok, true);
    if (r.ok) {
      // ANTI-CLONE Principle 9: the result must NOT name the chosen provider.
      const v = r.value as unknown as Record<string, unknown>;
      assert.equal(v.selectedProvider, undefined);
      assert.equal(v.providerKey, undefined);
      assert.ok("clientAction" in r.value);
    }
  });

  it("reports the succeeded provider via hook (server persists it; result stays agnostic)", async () => {
    let succeeded: PaymentProviderKey | null = null;
    const router = new PaymentRouter({
      providers: [providerWithKey("paystack")],
      hooks: { onProviderSucceeded: (k) => { succeeded = k; } },
    });
    const r = await router.route(baseIntent);
    assert.equal(r.ok, true);
    assert.equal(succeeded, "paystack");
  });

  it("fails over to the next provider on a RETRYABLE error", async () => {
    let succeeded: PaymentProviderKey | null = null;
    let failedOver = false;
    const router = new PaymentRouter({
      providers: [providerWithKey("paystack", { failureMode: "retryable" }), providerWithKey("flutterwave")],
      hooks: {
        onProviderSucceeded: (k) => { succeeded = k; },
        onProviderFailover: () => { failedOver = true; },
      },
    });
    const r = await router.route(baseIntent);
    assert.equal(r.ok, true, "should have failed over to flutterwave");
    assert.equal(succeeded, "flutterwave");
    assert.equal(failedOver, true);
  });

  it("does NOT fail over on a FATAL (non-retryable) error", async () => {
    const router = new PaymentRouter({
      providers: [providerWithKey("paystack", { failureMode: "fatal" }), providerWithKey("flutterwave")],
    });
    const r = await router.route(baseIntent);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error.kind, "provider_error");
  });

  it("returns NoSuitableProvider (A5 manual fallback) when nothing is registered", async () => {
    let blocked = false;
    const router = new PaymentRouter({ providers: [], hooks: { onNoSuitableProvider: () => { blocked = true; } } });
    const r = await router.route(baseIntent);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error.kind, "no_suitable_provider");
    assert.equal(blocked, true);
  });

  it("returns NoSuitableProvider for an unknown country (A5)", async () => {
    const router = new PaymentRouter({ providers: [providerWithKey("stripe")] });
    const r = await router.route({ ...baseIntent, country: "ZZ", currency: "USD" });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error.kind, "no_suitable_provider");
  });
});

describe("createPaymentRouter (env-gated wiring)", () => {
  it("in mock mode routes a real country via a mock-backed adapter", async () => {
    const prev = process.env.MOCK_PAYMENT;
    process.env.MOCK_PAYMENT = "1";
    try {
      const router = createPaymentRouter();
      const r = await router.route(baseIntent); // NG card → paystack(mock-backed)
      assert.equal(r.ok, true);
    } finally {
      if (prev === undefined) delete process.env.MOCK_PAYMENT;
      else process.env.MOCK_PAYMENT = prev;
    }
  });

  it("WITHOUT mock mode registers no providers (A5 until V3-14/15/16 wire real SDKs)", async () => {
    const prev = process.env.MOCK_PAYMENT;
    delete process.env.MOCK_PAYMENT;
    try {
      const router = createPaymentRouter();
      const r = await router.route(baseIntent);
      assert.equal(r.ok, false);
      if (!r.ok) assert.equal(r.error.kind, "no_suitable_provider");
    } finally {
      if (prev !== undefined) process.env.MOCK_PAYMENT = prev;
    }
  });
});
