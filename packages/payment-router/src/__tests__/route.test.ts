import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PaymentRouter, createPaymentRouter } from "../router";
import { PaystackProvider } from "../providers/paystack-provider";
import type { PaymentProviderAdapter, InitiatePaymentParams } from "../providers/adapter-interface";
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

/** Restore (or clear) a single env var to its prior value — keeps env tests hermetic. */
function restoreEnv(name: string, prev: string | undefined): void {
  if (prev === undefined) delete process.env[name];
  else process.env[name] = prev;
}

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

  it("threads RouteIntent.customerEmail into the adapter initiate params (Paystack needs a customer)", async () => {
    // Paystack cannot open a charge without an email; the router is the only place
    // that can carry the authenticated buyer's email to the adapter. A capturing
    // adapter lets us assert the field actually reaches `initiate`.
    let captured: InitiatePaymentParams | null = null;
    const capturing: PaymentProviderAdapter = {
      key: "paystack",
      async initiate(params) {
        captured = params;
        return { ok: true, value: { providerReference: "ref_x", clientAction: { type: "none" } } };
      },
      async refund() {
        return { ok: true, value: { refundReference: "rf_x" } };
      },
      async verifyWebhook() {
        return {
          ok: true,
          value: { providerEventId: "e", eventType: "charge.success", providerReference: "r", impliedStatus: "succeeded" },
        };
      },
    };
    const router = new PaymentRouter({ providers: [capturing] });
    const r = await router.route({ ...baseIntent, customerEmail: "buyer@example.com" });
    assert.equal(r.ok, true);
    assert.ok(captured, "initiate was invoked");
    assert.equal((captured as InitiatePaymentParams).customerEmail, "buyer@example.com");
  });
});

describe("createPaymentRouter (env-gated wiring)", () => {
  it("in mock mode routes a real country via a mock-backed adapter", async () => {
    const prevMock = process.env.MOCK_PAYMENT;
    const prevSecret = process.env.PAYSTACK_SECRET_KEY;
    process.env.MOCK_PAYMENT = "1";
    delete process.env.PAYSTACK_SECRET_KEY; // no live key → paystack stays mock-backed (no network)
    try {
      const router = createPaymentRouter();
      const r = await router.route(baseIntent); // NG card → paystack(mock-backed)
      assert.equal(r.ok, true);
    } finally {
      restoreEnv("MOCK_PAYMENT", prevMock);
      restoreEnv("PAYSTACK_SECRET_KEY", prevSecret);
    }
  });

  it("WITHOUT mock mode AND without a live key registers no providers (A5 manual fallback)", async () => {
    const prevMock = process.env.MOCK_PAYMENT;
    const prevSecret = process.env.PAYSTACK_SECRET_KEY;
    delete process.env.MOCK_PAYMENT;
    delete process.env.PAYSTACK_SECRET_KEY;
    try {
      const router = createPaymentRouter();
      const r = await router.route(baseIntent);
      assert.equal(r.ok, false);
      if (!r.ok) assert.equal(r.error.kind, "no_suitable_provider");
    } finally {
      restoreEnv("MOCK_PAYMENT", prevMock);
      restoreEnv("PAYSTACK_SECRET_KEY", prevSecret);
    }
  });
});

describe("createPaymentRouter — Paystack activation (V3-15)", () => {
  it("registers a LIVE PaystackProvider under 'paystack' when PAYSTACK_SECRET_KEY is set", () => {
    const prevMock = process.env.MOCK_PAYMENT;
    const prevSecret = process.env.PAYSTACK_SECRET_KEY;
    delete process.env.MOCK_PAYMENT;
    process.env.PAYSTACK_SECRET_KEY = "sk_test_activation";
    try {
      const router = createPaymentRouter();
      assert.ok(
        router.getAdapter("paystack") instanceof PaystackProvider,
        "paystack must be the live adapter, not a relabelled mock",
      );
    } finally {
      restoreEnv("MOCK_PAYMENT", prevMock);
      restoreEnv("PAYSTACK_SECRET_KEY", prevSecret);
    }
  });

  it("does NOT shadow the live Paystack adapter with a mock when BOTH env vars are set; mock fills only un-served keys", () => {
    const prevMock = process.env.MOCK_PAYMENT;
    const prevSecret = process.env.PAYSTACK_SECRET_KEY;
    process.env.MOCK_PAYMENT = "1";
    process.env.PAYSTACK_SECRET_KEY = "sk_test_activation";
    try {
      const router = createPaymentRouter();
      // The live key wins for paystack…
      assert.ok(router.getAdapter("paystack") instanceof PaystackProvider, "paystack stays live");
      // …and the mock backfills the keys Paystack does not serve (e.g. stripe).
      const stripe = router.getAdapter("stripe");
      assert.ok(stripe, "stripe is mock-filled");
      assert.ok(!(stripe instanceof PaystackProvider), "stripe is NOT the live paystack adapter");
      assert.equal(stripe!.key, "stripe");
    } finally {
      restoreEnv("MOCK_PAYMENT", prevMock);
      restoreEnv("PAYSTACK_SECRET_KEY", prevSecret);
    }
  });

  it("leaves 'paystack' unregistered when neither a live key nor mock mode is present", () => {
    const prevMock = process.env.MOCK_PAYMENT;
    const prevSecret = process.env.PAYSTACK_SECRET_KEY;
    delete process.env.MOCK_PAYMENT;
    delete process.env.PAYSTACK_SECRET_KEY;
    try {
      const router = createPaymentRouter();
      assert.equal(router.getAdapter("paystack"), undefined);
    } finally {
      restoreEnv("MOCK_PAYMENT", prevMock);
      restoreEnv("PAYSTACK_SECRET_KEY", prevSecret);
    }
  });

  it("threads an injected callbackUrl into the live Paystack initialize call (G7 — config-driven, never a hardcoded host)", async () => {
    // G7: the callback URL is computed by the APP via getAccountUrl() (env-aware,
    // base-domain-migration safe) and injected here — the package no longer reads
    // a PAYSTACK_CALLBACK_URL env var. Assert the injected value actually reaches
    // Paystack's transaction/initialize body, stubbing only the HTTP boundary.
    const prevMock = process.env.MOCK_PAYMENT;
    const prevSecret = process.env.PAYSTACK_SECRET_KEY;
    const prevCallback = process.env.PAYSTACK_CALLBACK_URL;
    const prevFetch = globalThis.fetch;
    delete process.env.MOCK_PAYMENT;
    delete process.env.PAYSTACK_CALLBACK_URL; // proves the value comes from the option, not env
    process.env.PAYSTACK_SECRET_KEY = "sk_test_callback";
    const sentBodies: string[] = [];
    globalThis.fetch = (async (_url: string, init: { body?: string }) => {
      if (init.body) sentBodies.push(init.body);
      return {
        status: 200,
        json: async () => ({ status: true, data: { authorization_url: "https://checkout.example/x", reference: "i1" } }),
      };
    }) as unknown as typeof fetch;
    try {
      const router = createPaymentRouter({ callbackUrl: "https://account.example/payments/callback" });
      const r = await router.route({ ...baseIntent, customerEmail: "buyer@example.com" });
      assert.equal(r.ok, true);
      assert.equal(sentBodies.length, 1, "initiate hit the HTTP boundary exactly once");
      const sent = JSON.parse(sentBodies[0]!) as Record<string, unknown>;
      assert.equal(sent.callback_url, "https://account.example/payments/callback");
    } finally {
      globalThis.fetch = prevFetch;
      restoreEnv("MOCK_PAYMENT", prevMock);
      restoreEnv("PAYSTACK_SECRET_KEY", prevSecret);
      restoreEnv("PAYSTACK_CALLBACK_URL", prevCallback);
    }
  });

  it("still accepts hooks (back-compat) when passed via the options object", async () => {
    const prevMock = process.env.MOCK_PAYMENT;
    const prevSecret = process.env.PAYSTACK_SECRET_KEY;
    process.env.MOCK_PAYMENT = "1";
    delete process.env.PAYSTACK_SECRET_KEY; // mock-backed paystack, no network
    let succeeded: PaymentProviderKey | null = null;
    try {
      const router = createPaymentRouter({ hooks: { onProviderSucceeded: (k) => { succeeded = k; } } });
      const r = await router.route(baseIntent);
      assert.equal(r.ok, true);
      assert.equal(succeeded, "paystack");
    } finally {
      restoreEnv("MOCK_PAYMENT", prevMock);
      restoreEnv("PAYSTACK_SECRET_KEY", prevSecret);
    }
  });
});
