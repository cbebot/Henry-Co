import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { PaystackProvider, type PaystackFetch } from "../providers/paystack-provider";

const SECRET = "sk_test_deadbeef";

/** Sign exactly as Paystack does: HMAC-SHA512 hex over the RAW request body. */
function sign512(rawBody: string, secret = SECRET): string {
  return createHmac("sha512", secret).update(rawBody).digest("hex");
}

interface Call {
  url: string;
  init: { method: string; headers: Record<string, string>; body?: string };
}

/** A fake transport that records calls and returns a scripted response. */
function fakeFetch(
  responder: (call: Call) => { status: number; body: unknown } | { throws: true },
): { fetchImpl: PaystackFetch; calls: Call[] } {
  const calls: Call[] = [];
  const fetchImpl: PaystackFetch = async (url, init) => {
    calls.push({ url, init });
    const out = responder({ url, init });
    if ("throws" in out) throw new Error("network down");
    return { status: out.status, json: async () => out.body };
  };
  return { fetchImpl, calls };
}

const baseInitiate = {
  intentId: "intent-uuid-1",
  amountMinor: 10000, // ₦100.00 in kobo — already the subunit
  currency: "NGN",
  country: "NG",
  method: "card" as const,
  idempotencyKey: "idem-1",
  customerEmail: "buyer@example.com",
};

describe("PaystackProvider.verifyWebhook (G1 — HMAC-SHA512, fail-closed)", () => {
  const p = new PaystackProvider({ secretKey: SECRET });

  it("rejects a missing (null) signature without parsing the body", async () => {
    const r = await p.verifyWebhook({ rawBody: "{}", signature: null, secret: SECRET });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error.providerKey, "paystack");
  });

  it("rejects a bad signature (fail-closed)", async () => {
    const body = JSON.stringify({ event: "charge.success", data: { reference: "ref_1", status: "success" } });
    const r = await p.verifyWebhook({ rawBody: body, signature: "not-the-hash", secret: SECRET });
    assert.equal(r.ok, false);
  });

  it("verifies the signature over the RAW body, not a re-serialized parse", async () => {
    // Non-canonical spacing + key order: re-stringifying would change the bytes and
    // break verification. We HMAC the exact received string, so this must verify.
    const rawBody = '{ "data" :{"reference":"ref_1","status":"success"} ,  "event":"charge.success" }';
    const r = await p.verifyWebhook({ rawBody, signature: sign512(rawBody), secret: SECRET });
    assert.equal(r.ok, true);
  });

  it("accepts charge.success → succeeded; providerEventId == reference (G2 dedup identity)", async () => {
    const rawBody = JSON.stringify({
      event: "charge.success",
      data: { id: 4677, status: "success", reference: "T-ref-1", amount: 10000, currency: "NGN" },
    });
    const r = await p.verifyWebhook({ rawBody, signature: sign512(rawBody), secret: SECRET });
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.value.eventType, "charge.success");
      assert.equal(r.value.impliedStatus, "succeeded");
      assert.equal(r.value.providerReference, "T-ref-1");
      assert.equal(r.value.providerEventId, "T-ref-1", "charge dedup key is the transaction reference");
    }
  });

  it("maps charge.failed → failed", async () => {
    const rawBody = JSON.stringify({ event: "charge.failed", data: { reference: "T-ref-2", status: "failed" } });
    const r = await p.verifyWebhook({ rawBody, signature: sign512(rawBody), secret: SECRET });
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.value.impliedStatus, "failed");
  });

  it("maps refund.processed → refundEvent (V3-19); resolves intent by transaction_reference; STRING amount parsed", async () => {
    const rawBody = JSON.stringify({
      event: "refund.processed",
      data: { status: "processed", transaction_reference: "T-ref-1", refund_reference: "RFND-1", amount: "10000", currency: "NGN" },
    });
    const r = await p.verifyWebhook({ rawBody, signature: sign512(rawBody), secret: SECRET });
    assert.equal(r.ok, true);
    if (r.ok) {
      // V3-19: never an impliedStatus — a PARTIAL refund's terminal intent status
      // depends on cumulative amounts only apply_refund_webhook knows.
      assert.equal(r.value.impliedStatus, null);
      assert.deepEqual(r.value.refundEvent, {
        outcome: "processed",
        amountMinor: 10000, // Paystack sends "10000" (a string) — parsed strictly
        refundReference: "RFND-1",
      });
      assert.equal(r.value.providerReference, "T-ref-1", "intent resolved by the ORIGINAL charge reference");
    }
  });

  it("maps refund.failed → refundEvent {outcome: failed} (revert; money never left)", async () => {
    const rawBody = JSON.stringify({
      event: "refund.failed",
      data: { status: "failed", transaction_reference: "T-ref-1", refund_reference: "RFND-1" },
    });
    const r = await p.verifyWebhook({ rawBody, signature: sign512(rawBody), secret: SECRET });
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.value.impliedStatus, null);
      assert.equal(r.value.refundEvent?.outcome, "failed");
      assert.equal(r.value.refundEvent?.amountMinor, null, "absent amount is null, never guessed");
      assert.equal(r.value.providerReference, "T-ref-1");
    }
  });

  it("treats a malformed refund amount as not-reported (null), never a guessed number", async () => {
    const rawBody = JSON.stringify({
      event: "refund.processed",
      data: { status: "processed", transaction_reference: "T-ref-1", refund_reference: null, amount: "10.50" },
    });
    const r = await p.verifyWebhook({ rawBody, signature: sign512(rawBody), secret: SECRET });
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.value.refundEvent?.amountMinor, null);
      assert.equal(r.value.refundEvent?.refundReference, null);
    }
  });

  it("maps an informational event (refund.pending) to a null impliedStatus", async () => {
    const rawBody = JSON.stringify({
      event: "refund.pending",
      data: { status: "pending", transaction_reference: "T-ref-1", refund_reference: null },
    });
    const r = await p.verifyWebhook({ rawBody, signature: sign512(rawBody), secret: SECRET });
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.value.impliedStatus, null);
  });

  it("returns an error (not a throw) for a validly-signed but non-JSON body", async () => {
    const rawBody = "this is not json";
    const r = await p.verifyWebhook({ rawBody, signature: sign512(rawBody), secret: SECRET });
    assert.equal(r.ok, false);
  });
});

describe("PaystackProvider.initiate (transaction/initialize)", () => {
  it("posts kobo-exact amount as a STRING (G5: no x100) with email, currency, reference, channel", async () => {
    const { fetchImpl, calls } = fakeFetch(() => ({
      status: 200,
      body: { status: true, data: { authorization_url: "https://checkout.paystack.com/abc", access_code: "abc", reference: "intent-uuid-1" } },
    }));
    const p = new PaystackProvider({ secretKey: SECRET, callbackUrl: "https://pay.henrycogroup.com/cb", fetchImpl });
    const r = await p.initiate(baseInitiate);

    assert.equal(calls.length, 1);
    const call = calls[0];
    // G3: base URL is always api.paystack.co — no test/live branching.
    assert.equal(call.url, "https://api.paystack.co/transaction/initialize");
    assert.equal(call.init.method, "POST");
    assert.equal(call.init.headers["Authorization"], `Bearer ${SECRET}`);
    const sent = JSON.parse(call.init.body!);
    assert.equal(sent.amount, "10000", "kobo passed verbatim as a string — never x100");
    assert.equal(sent.email, "buyer@example.com");
    assert.equal(sent.currency, "NGN");
    assert.equal(sent.reference, "intent-uuid-1", "our intentId is the Paystack reference (stable, idempotent, G2 anchor)");
    assert.equal(sent.callback_url, "https://pay.henrycogroup.com/cb");
    assert.deepEqual(sent.channels, ["card"]);

    assert.equal(r.ok, true);
    if (r.ok) {
      assert.deepEqual(r.value.clientAction, { type: "redirect", url: "https://checkout.paystack.com/abc" });
      assert.equal(r.value.providerReference, "intent-uuid-1");
    }
  });

  it("biases channels by the requested method (ussd → ['ussd'])", async () => {
    const { fetchImpl, calls } = fakeFetch(() => ({ status: 200, body: { status: true, data: { authorization_url: "u", reference: "r" } } }));
    const p = new PaystackProvider({ secretKey: SECRET, fetchImpl });
    await p.initiate({ ...baseInitiate, method: "ussd" });
    assert.deepEqual(JSON.parse(calls[0].init.body!).channels, ["ussd"]);
  });

  it("fails (fatal, no network call) when the customer email is missing", async () => {
    const { fetchImpl, calls } = fakeFetch(() => ({ status: 200, body: { status: true, data: {} } }));
    const p = new PaystackProvider({ secretKey: SECRET, fetchImpl });
    const r = await p.initiate({ ...baseInitiate, customerEmail: undefined });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error.retryable, false);
    assert.equal(calls.length, 0, "no charge attempted without a customer identifier");
  });

  it("treats a 4xx / status:false as FATAL (no failover)", async () => {
    const { fetchImpl } = fakeFetch(() => ({ status: 400, body: { status: false, message: "Invalid key" } }));
    const p = new PaystackProvider({ secretKey: SECRET, fetchImpl });
    const r = await p.initiate(baseInitiate);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error.retryable, false);
  });

  it("treats a 5xx as RETRYABLE (router fails over)", async () => {
    const { fetchImpl } = fakeFetch(() => ({ status: 503, body: { status: false } }));
    const p = new PaystackProvider({ secretKey: SECRET, fetchImpl });
    const r = await p.initiate(baseInitiate);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error.retryable, true);
  });

  it("treats a network throw as RETRYABLE", async () => {
    const { fetchImpl } = fakeFetch(() => ({ throws: true }));
    const p = new PaystackProvider({ secretKey: SECRET, fetchImpl });
    const r = await p.initiate(baseInitiate);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error.retryable, true);
  });
});

describe("PaystackProvider.finalize (transaction/verify — D1 authoritative confirm)", () => {
  it("GETs verify/:reference and maps a successful charge → succeeded with kobo-exact amount", async () => {
    const { fetchImpl, calls } = fakeFetch(() => ({
      status: 200,
      body: { status: true, data: { status: "success", reference: "intent-uuid-1", amount: 10000, currency: "NGN", id: 999 } },
    }));
    const p = new PaystackProvider({ secretKey: SECRET, fetchImpl });
    const r = await p.finalize!({ providerReference: "intent-uuid-1" });

    assert.equal(calls[0].url, "https://api.paystack.co/transaction/verify/intent-uuid-1");
    assert.equal(calls[0].init.method, "GET");
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.value.impliedStatus, "succeeded");
      assert.equal(r.value.providerEventId, "intent-uuid-1", "G2: dedup key == reference, shared with the charge webhook");
      assert.equal(r.value.amountMinor, 10000, "kobo verbatim from the provider — no scaling");
      assert.equal(r.value.currency, "NGN");
    }
  });

  it("maps a failed/abandoned charge → failed", async () => {
    const { fetchImpl } = fakeFetch(() => ({ status: 200, body: { status: true, data: { status: "abandoned", reference: "r", amount: 10000, currency: "NGN" } } }));
    const p = new PaystackProvider({ secretKey: SECRET, fetchImpl });
    const r = await p.finalize!({ providerReference: "r" });
    assert.ok(r.ok && r.value.impliedStatus === "failed");
  });

  it("maps a still-pending charge → null (not yet terminal)", async () => {
    const { fetchImpl } = fakeFetch(() => ({ status: 200, body: { status: true, data: { status: "ongoing", reference: "r", amount: 10000, currency: "NGN" } } }));
    const p = new PaystackProvider({ secretKey: SECRET, fetchImpl });
    const r = await p.finalize!({ providerReference: "r" });
    assert.ok(r.ok && r.value.impliedStatus === null);
  });

  it("treats a 5xx as RETRYABLE", async () => {
    const { fetchImpl } = fakeFetch(() => ({ status: 502, body: {} }));
    const p = new PaystackProvider({ secretKey: SECRET, fetchImpl });
    const r = await p.finalize!({ providerReference: "r" });
    assert.ok(!r.ok && r.error.retryable);
  });
});

describe("PaystackProvider.refund (refund/create — async, money-truth via webhook)", () => {
  it("posts transaction + kobo-exact amount and returns the refund id (status is pending — Q3)", async () => {
    const { fetchImpl, calls } = fakeFetch(() => ({
      status: 200,
      body: { status: true, message: "Refund has been queued for processing", data: { status: "pending", id: 3018284, amount: 10000, currency: "NGN" } },
    }));
    const p = new PaystackProvider({ secretKey: SECRET, fetchImpl });
    const r = await p.refund({ providerReference: "intent-uuid-1", amountMinor: 10000 });

    assert.equal(calls[0].url, "https://api.paystack.co/refund");
    assert.equal(calls[0].init.method, "POST");
    const sent = JSON.parse(calls[0].init.body!);
    assert.equal(sent.transaction, "intent-uuid-1");
    assert.equal(sent.amount, 10000, "kobo verbatim — no x100");
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.value.refundReference, "3018284");
  });

  it("treats a 4xx as FATAL", async () => {
    const { fetchImpl } = fakeFetch(() => ({ status: 400, body: { status: false, message: "Transaction not found" } }));
    const p = new PaystackProvider({ secretKey: SECRET, fetchImpl });
    const r = await p.refund({ providerReference: "nope", amountMinor: 10000 });
    assert.ok(!r.ok && !r.error.retryable);
  });
});

describe("PaystackProvider.listRefunds (V3-19 — adopt-don't-redrive)", () => {
  it("lists a transaction's refunds with id/amount/status normalised", async () => {
    const { fetchImpl, calls } = fakeFetch(() => ({
      status: 200,
      body: {
        status: true,
        data: [
          { id: 3018284, amount: 10000, status: "pending", transaction: 1004723697 },
          { id: 3018299, amount: "4300", status: "processed", transaction: 1004723697 },
          { amount: 1, status: "ignored-no-id" },
        ],
      },
    }));
    const p = new PaystackProvider({ secretKey: SECRET, fetchImpl });
    const r = await p.listRefunds({ providerReference: "intent-uuid-1" });

    assert.equal(calls[0].url, "https://api.paystack.co/refund?transaction=intent-uuid-1");
    assert.equal(calls[0].init.method, "GET");
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.deepEqual(r.value, [
        { refundReference: "3018284", amountMinor: 10000, status: "pending" },
        { refundReference: "3018299", amountMinor: 4300, status: "processed" },
      ]);
    }
  });

  it("propagates provider failure (the route then REFUSES to create blind)", async () => {
    const { fetchImpl } = fakeFetch(() => ({ status: 503, body: { status: false } }));
    const p = new PaystackProvider({ secretKey: SECRET, fetchImpl });
    const r = await p.listRefunds({ providerReference: "intent-uuid-1" });
    assert.ok(!r.ok);
  });
});

describe("PaystackProvider.getBalance (G4 reconciliation)", () => {
  it("returns the matching-currency available balance in minor units", async () => {
    const { fetchImpl, calls } = fakeFetch(() => ({
      status: 200,
      body: { status: true, data: [ { currency: "USD", balance: 5 }, { currency: "NGN", balance: 2910971757 } ] },
    }));
    const p = new PaystackProvider({ secretKey: SECRET, fetchImpl });
    const r = await p.getBalance!({ currency: "NGN" });

    assert.equal(calls[0].url, "https://api.paystack.co/balance");
    assert.equal(calls[0].init.method, "GET");
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.value.currency, "NGN");
      assert.equal(r.value.availableMinor, 2910971757);
      assert.ok(!Number.isNaN(Date.parse(r.value.asOf)));
    }
  });

  it("fails (fatal) when the requested currency is absent from the balance", async () => {
    const { fetchImpl } = fakeFetch(() => ({ status: 200, body: { status: true, data: [ { currency: "USD", balance: 5 } ] } }));
    const p = new PaystackProvider({ secretKey: SECRET, fetchImpl });
    const r = await p.getBalance!({ currency: "NGN" });
    assert.ok(!r.ok && !r.error.retryable);
  });

  it("treats a 5xx as RETRYABLE", async () => {
    const { fetchImpl } = fakeFetch(() => ({ status: 500, body: {} }));
    const p = new PaystackProvider({ secretKey: SECRET, fetchImpl });
    const r = await p.getBalance!({ currency: "NGN" });
    assert.ok(!r.ok && r.error.retryable);
  });
});

describe("PaystackProvider — REAL processor fee capture (V3-VAT-01)", () => {
  it("finalize reads the real total fee from data.fees (kobo verbatim, never assumed)", async () => {
    // Real Paystack /transaction/verify shape: amount 40333, fees 10283.
    const { fetchImpl } = fakeFetch(() => ({
      status: 200,
      body: { status: true, data: { status: "success", reference: "T-1", amount: 40333, fees: 10283, currency: "NGN" } },
    }));
    const r = await new PaystackProvider({ secretKey: SECRET, fetchImpl }).finalize!({ providerReference: "T-1" });
    assert.ok(r.ok);
    if (r.ok) assert.equal(r.value.feeMinor, 10283);
  });

  it("finalize leaves feeMinor undefined when the provider reports no fee (null) — no fabrication", async () => {
    const { fetchImpl } = fakeFetch(() => ({
      status: 200,
      body: { status: true, data: { status: "success", reference: "T-2", amount: 10000, fees: null, currency: "NGN" } },
    }));
    const r = await new PaystackProvider({ secretKey: SECRET, fetchImpl }).finalize!({ providerReference: "T-2" });
    assert.ok(r.ok);
    if (r.ok) assert.equal(r.value.feeMinor, undefined);
  });

  it("finalize ignores a non-integer/negative fee (treats as unreported)", async () => {
    const { fetchImpl } = fakeFetch(() => ({
      status: 200,
      body: { status: true, data: { status: "success", reference: "T-2b", amount: 10000, fees: -5, currency: "NGN" } },
    }));
    const r = await new PaystackProvider({ secretKey: SECRET, fetchImpl }).finalize!({ providerReference: "T-2b" });
    assert.ok(r.ok);
    if (r.ok) assert.equal(r.value.feeMinor, undefined);
  });

  it("verifyWebhook reads data.fees on charge.success when present", async () => {
    const rawBody = JSON.stringify({ event: "charge.success", data: { reference: "T-3", status: "success", amount: 25000, fees: 375, currency: "NGN" } });
    const r = await new PaystackProvider({ secretKey: SECRET }).verifyWebhook({ rawBody, signature: sign512(rawBody), secret: SECRET });
    assert.ok(r.ok);
    if (r.ok) assert.equal(r.value.feeMinor, 375);
  });

  it("verifyWebhook leaves feeMinor undefined when the webhook omits fees (the common case)", async () => {
    const rawBody = JSON.stringify({ event: "charge.success", data: { reference: "T-4", status: "success", amount: 25000, fees: null } });
    const r = await new PaystackProvider({ secretKey: SECRET }).verifyWebhook({ rawBody, signature: sign512(rawBody), secret: SECRET });
    assert.ok(r.ok);
    if (r.ok) assert.equal(r.value.feeMinor, undefined);
  });

  it("captures a provider-reported VAT line from fees_breakdown when present (forward-compat seam)", async () => {
    const { fetchImpl } = fakeFetch(() => ({
      status: 200,
      body: { status: true, data: { status: "success", reference: "T-5", amount: 40333, fees: 10283, currency: "NGN",
        fees_breakdown: [ { amount: 9566, type: "paystack" }, { amount: 717, type: "vat" } ] } },
    }));
    const r = await new PaystackProvider({ secretKey: SECRET, fetchImpl }).finalize!({ providerReference: "T-5" });
    assert.ok(r.ok);
    if (r.ok) {
      assert.equal(r.value.feeMinor, 10283);
      assert.equal(r.value.feeVatMinor, 717);
    }
  });
});
