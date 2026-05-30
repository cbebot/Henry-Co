import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MockProvider } from "../providers/mock-provider";

const baseInitiate = {
  intentId: "i1",
  amountMinor: 1000,
  currency: "NGN",
  country: "NG",
  method: "card" as const,
  idempotencyKey: "k1",
};

describe("MockProvider.initiate", () => {
  it("succeeds by default and returns a provider reference", async () => {
    const p = new MockProvider();
    const r = await p.initiate(baseInitiate);
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.match(r.value.providerReference, /^mock_/);
      assert.equal(r.value.clientAction.type, "none");
    }
  });

  it("returns a RETRYABLE error when failureMode=retryable", async () => {
    const p = new MockProvider({ failureMode: "retryable" });
    const r = await p.initiate({ ...baseInitiate, intentId: "i2" });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.error.retryable, true);
      assert.equal(r.error.providerKey, "mock");
    }
  });

  it("returns a FATAL (non-retryable) error when failureMode=fatal", async () => {
    const p = new MockProvider({ failureMode: "fatal" });
    const r = await p.initiate({ ...baseInitiate, intentId: "i3" });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error.retryable, false);
  });
});

describe("MockProvider.verifyWebhook (HMAC)", () => {
  const p = new MockProvider();

  it("rejects a bad signature", async () => {
    const r = await p.verifyWebhook({ rawBody: "{}", signature: "wrong", secret: "s" });
    assert.equal(r.ok, false);
  });

  it("rejects a null signature", async () => {
    const r = await p.verifyWebhook({ rawBody: "{}", signature: null, secret: "s" });
    assert.equal(r.ok, false);
  });

  it("accepts a correctly signed body and extracts the event id + implied status", async () => {
    const body = JSON.stringify({
      id: "evt_1",
      type: "charge.success",
      reference: "mock_x",
      status: "succeeded",
    });
    const sig = MockProvider.sign(body, "s");
    const r = await p.verifyWebhook({ rawBody: body, signature: sig, secret: "s" });
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.value.providerEventId, "evt_1");
      assert.equal(r.value.providerReference, "mock_x");
      assert.equal(r.value.impliedStatus, "succeeded");
    }
  });

  it("maps an unrecognised status to a null impliedStatus (informational event)", async () => {
    const body = JSON.stringify({ id: "evt_2", type: "charge.pending", reference: "mock_y", status: "pending" });
    const sig = MockProvider.sign(body, "s");
    const r = await p.verifyWebhook({ rawBody: body, signature: sig, secret: "s" });
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.value.impliedStatus, null);
  });
});

describe("MockProvider.refund", () => {
  it("returns a refund reference on success", async () => {
    const p = new MockProvider();
    const r = await p.refund({ providerReference: "mock_x", amountMinor: 1000 });
    assert.equal(r.ok, true);
    if (r.ok) assert.match(r.value.refundReference, /^mockrf_/);
  });
});

describe("MockProvider.finalize (D1 synchronous confirm)", () => {
  it("confirms succeeded and sets providerEventId = providerReference (G2 dedup identity)", async () => {
    const p = new MockProvider();
    const r = await p.finalize({ providerReference: "mock_abc" });
    assert.equal(r.ok, true);
    if (r.ok) {
      // G2: the finalize event id MUST equal the charge reference so a later
      // charge.success webhook for the same reference can't double-apply.
      assert.equal(r.value.providerEventId, "mock_abc");
      assert.equal(r.value.impliedStatus, "succeeded");
    }
  });

  it("returns a RETRYABLE error when failureMode=retryable", async () => {
    const p = new MockProvider({ failureMode: "retryable" });
    const r = await p.finalize({ providerReference: "mock_abc" });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.error.retryable, true);
      assert.equal(r.error.providerKey, "mock");
    }
  });

  it("returns a FATAL error when failureMode=fatal", async () => {
    const p = new MockProvider({ failureMode: "fatal" });
    const r = await p.finalize({ providerReference: "mock_abc" });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error.retryable, false);
  });
});

describe("MockProvider.getBalance (G4 reconciliation read)", () => {
  it("echoes the requested currency and returns an ISO-8601 asOf", async () => {
    const p = new MockProvider();
    const r = await p.getBalance({ currency: "NGN" });
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.value.currency, "NGN");
      assert.equal(typeof r.value.availableMinor, "number");
      assert.ok(!Number.isNaN(Date.parse(r.value.asOf)), "asOf parses as a date");
    }
  });

  it("returns a FATAL error when failureMode=fatal", async () => {
    const p = new MockProvider({ failureMode: "fatal" });
    const r = await p.getBalance({ currency: "NGN" });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error.retryable, false);
  });
});
