import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FlutterwaveProvider, type FlutterwaveFetch } from "../providers/flutterwave-provider";
import { createPaymentRouter } from "../router";

const SECRET_KEY = "FLWSECK_TEST-deadbeefdeadbeefdeadbeef-X";
/** The dashboard webhook secret hash — Flutterwave sends it VERBATIM in `verif-hash`
 *  (a static compare, NOT an HMAC of the body — unlike Paystack). */
const SECRET_HASH = "fl2-webhook-secret-hash";

interface Call {
  url: string;
  init: { method: string; headers: Record<string, string>; body?: string };
}

/** A fake transport that records calls and returns scripted responses per URL. */
function fakeFetch(
  responder: (call: Call) => { status: number; body: unknown } | { throws: true },
): { fetchImpl: FlutterwaveFetch; calls: Call[] } {
  const calls: Call[] = [];
  const fetchImpl: FlutterwaveFetch = async (url, init) => {
    calls.push({ url, init });
    const out = responder({ url, init });
    if ("throws" in out) throw new Error("network down");
    return { status: out.status, json: async () => out.body };
  };
  return { fetchImpl, calls };
}

const baseInitiate = {
  intentId: "intent-uuid-1",
  amountMinor: 50_000, // ₦500.00 in kobo — the proofs' real charge size
  currency: "NGN",
  country: "NG",
  method: "card" as const,
  idempotencyKey: "idem-1",
  customerEmail: "buyer@example.com",
};

/**
 * REAL verify_by_reference payload shape, captured by the V3-16 proof harness
 * from a live TEST charge (id 10292954): `amount` is MAJOR units, `app_fee` is
 * VAT-EXCLUSIVE (opposite of Paystack), and settlement separately deducts the
 * 7.5% VAT on the fee: gross − settled = app_fee + feeVAT.
 *   kobo: 50000 − 49246 = 754 = 701 (app_fee 7.01) + 53 (VAT)
 */
const REAL_VERIFY_DATA = {
  id: 10292954,
  tx_ref: "intent-uuid-1",
  flw_ref: "FLW-MOCK-6c33ce80fb9c5fa146fdf2a7af474f0c",
  amount: 500,
  charged_amount: 500,
  app_fee: 7.01,
  merchant_fee: 0,
  amount_settled: 492.46,
  currency: "NGN",
  status: "successful",
  payment_type: "card",
};

function verifyOkFetch(overrides: Partial<typeof REAL_VERIFY_DATA> = {}) {
  return fakeFetch((call) => {
    if (call.url.includes("/transactions/verify_by_reference")) {
      return { status: 200, body: { status: "success", message: "ok", data: { ...REAL_VERIFY_DATA, ...overrides } } };
    }
    return { status: 404, body: { status: "error", message: "no route" } };
  });
}

describe("FlutterwaveProvider.initiate (Standard hosted checkout — POST /payments)", () => {
  function initOkFetch() {
    return fakeFetch(() => ({
      status: 200,
      body: { status: "success", message: "Hosted Link", data: { link: "https://checkout.flutterwave.com/v3/hosted/pay/abc123" } },
    }));
  }

  it("sends MAJOR units (minor ÷ 10^exponent) as a string — NGN 50000 kobo → '500'", async () => {
    const { fetchImpl, calls } = initOkFetch();
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, callbackUrl: "https://account.henryonyx.com/payments/callback", fetchImpl });
    const r = await p.initiate(baseInitiate);

    assert.equal(calls.length, 1);
    // G3: base URL is ALWAYS api.flutterwave.com/v3 — test vs live is purely the key.
    assert.equal(calls[0].url, "https://api.flutterwave.com/v3/payments");
    assert.equal(calls[0].init.method, "POST");
    assert.equal(calls[0].init.headers["Authorization"], `Bearer ${SECRET_KEY}`);
    const sent = JSON.parse(calls[0].init.body!);
    assert.equal(sent.amount, "500", "amountMinor 50000 (kobo) must become MAJOR '500' — the proven Flutterwave unit");
    assert.equal(sent.currency, "NGN");
    assert.equal(sent.tx_ref, "intent-uuid-1", "tx_ref = intentId (stable, idempotent — the G2 dedup anchor)");
    assert.equal(sent.redirect_url, "https://account.henryonyx.com/payments/callback");
    assert.equal(sent.customer.email, "buyer@example.com");
    assert.equal(sent.payment_options, "card");

    assert.equal(r.ok, true);
    if (r.ok) {
      assert.deepEqual(r.value.clientAction, { type: "redirect", url: "https://checkout.flutterwave.com/v3/hosted/pay/abc123" });
      assert.equal(r.value.providerReference, "intent-uuid-1", "providerReference is the tx_ref — verify + webhook resolve by it");
    }
  });

  it("converts per-currency exponent — USD 12345 cents → '123.45' (×100 currencies)", async () => {
    const { fetchImpl, calls } = initOkFetch();
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    await p.initiate({ ...baseInitiate, amountMinor: 12_345, currency: "USD", country: "US" });
    assert.equal(JSON.parse(calls[0].init.body!).amount, "123.45");
  });

  it("does NOT scale zero-decimal currencies — XOF 5000 → '5000' (never ÷100)", async () => {
    const { fetchImpl, calls } = initOkFetch();
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    await p.initiate({ ...baseInitiate, amountMinor: 5_000, currency: "XOF", country: "BJ" });
    assert.equal(JSON.parse(calls[0].init.body!).amount, "5000", "XOF has exponent 0 — a ÷100 here would mis-scale money 100×");
  });

  it("keeps sub-unit precision exact — NGN 10050 kobo → '100.5' (integer math, no float drift)", async () => {
    const { fetchImpl, calls } = initOkFetch();
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    await p.initiate({ ...baseInitiate, amountMinor: 10_050 });
    assert.equal(JSON.parse(calls[0].init.body!).amount, "100.5");
  });

  it("biases payment_options by method (bank_transfer → banktransfer, mobile_money → mobilemoney, ussd → ussd)", async () => {
    for (const [method, expected] of [
      ["bank_transfer", "banktransfer"],
      ["mobile_money", "mobilemoney"],
      ["ussd", "ussd"],
    ] as const) {
      const { fetchImpl, calls } = initOkFetch();
      const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
      await p.initiate({ ...baseInitiate, method });
      assert.equal(JSON.parse(calls[0].init.body!).payment_options, expected, `${method} → ${expected}`);
    }
  });

  it("omits payment_options for wallet methods Flutterwave's hosted page handles itself (apple_pay)", async () => {
    const { fetchImpl, calls } = initOkFetch();
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    await p.initiate({ ...baseInitiate, method: "apple_pay" });
    assert.equal(JSON.parse(calls[0].init.body!).payment_options, undefined);
  });

  it("fails FATALLY with no network call when the customer email is missing", async () => {
    const { fetchImpl, calls } = initOkFetch();
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.initiate({ ...baseInitiate, customerEmail: undefined });
    assert.ok(!r.ok && !r.error.retryable);
    assert.equal(calls.length, 0, "no charge attempted without a customer identifier");
  });

  it("fails FATALLY with no network call for an unsupported currency (A4 — never guess an exponent)", async () => {
    const { fetchImpl, calls } = initOkFetch();
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.initiate({ ...baseInitiate, currency: "ZWL" });
    assert.ok(!r.ok && !r.error.retryable);
    assert.equal(calls.length, 0);
  });

  it("fails FATALLY when the response has no hosted link", async () => {
    const { fetchImpl } = fakeFetch(() => ({ status: 200, body: { status: "success", data: {} } }));
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.initiate(baseInitiate);
    assert.ok(!r.ok && !r.error.retryable);
  });

  it("treats envelope status:'error' on a 2xx as FATAL (provider rejected)", async () => {
    const { fetchImpl } = fakeFetch(() => ({ status: 200, body: { status: "error", message: "Invalid currency" } }));
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.initiate(baseInitiate);
    assert.ok(!r.ok && !r.error.retryable);
  });

  it("treats a 4xx as FATAL (no failover)", async () => {
    const { fetchImpl } = fakeFetch(() => ({ status: 401, body: { status: "error", message: "unauthorized" } }));
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.initiate(baseInitiate);
    assert.ok(!r.ok && !r.error.retryable);
  });

  it("treats a 5xx as RETRYABLE (the NG/GH router fails over)", async () => {
    const { fetchImpl } = fakeFetch(() => ({ status: 503, body: {} }));
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.initiate(baseInitiate);
    assert.ok(!r.ok && r.error.retryable);
  });

  it("treats a network throw as RETRYABLE", async () => {
    const { fetchImpl } = fakeFetch(() => ({ throws: true }));
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.initiate(baseInitiate);
    assert.ok(!r.ok && r.error.retryable);
  });
});

describe("FlutterwaveProvider.finalize (verify_by_reference — D1 authoritative confirm)", () => {
  it("GETs verify_by_reference?tx_ref= and maps successful → succeeded with minor-exact amount", async () => {
    const { fetchImpl, calls } = verifyOkFetch();
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.finalize!({ providerReference: "intent-uuid-1" });

    assert.equal(calls[0].url, "https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=intent-uuid-1");
    assert.equal(calls[0].init.method, "GET");
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.value.impliedStatus, "succeeded");
      assert.equal(r.value.providerEventId, "intent-uuid-1", "G2: dedup key == tx_ref, shared with the charge webhook");
      assert.equal(r.value.amountMinor, 50_000, "major 500 NGN converts back to EXACTLY 50000 kobo");
      assert.equal(r.value.currency, "NGN");
    }
  });

  it("captures the REAL fee identity: feeMinor = gross − settled − merchant_fee; feeVat = feeMinor − app_fee (app_fee is EX-VAT)", async () => {
    const { fetchImpl } = verifyOkFetch();
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.finalize!({ providerReference: "intent-uuid-1" });
    assert.ok(r.ok);
    if (r.ok) {
      assert.equal(r.value.feeMinor, 754, "50000 − 49246 − 0 = 754 kobo VAT-INCLUSIVE total deduction");
      assert.equal(r.value.feeVatMinor, 53, "754 − 701 (app_fee 7.01 ex-VAT) = 53 kobo provider VAT");
    }
  });

  it("leaves fees undefined when amount_settled is absent — never fabricate a fee", async () => {
    const { fetchImpl } = verifyOkFetch({ amount_settled: undefined as unknown as number });
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.finalize!({ providerReference: "intent-uuid-1" });
    assert.ok(r.ok);
    if (r.ok) {
      assert.equal(r.value.feeMinor, undefined);
      assert.equal(r.value.feeVatMinor, undefined);
    }
  });

  it("reports feeMinor but leaves feeVat undefined when app_fee is absent (statutory split downstream)", async () => {
    const { fetchImpl } = verifyOkFetch({ app_fee: undefined as unknown as number });
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.finalize!({ providerReference: "intent-uuid-1" });
    assert.ok(r.ok);
    if (r.ok) {
      assert.equal(r.value.feeMinor, 754);
      assert.equal(r.value.feeVatMinor, undefined);
    }
  });

  it("maps a failed charge → failed", async () => {
    const { fetchImpl } = verifyOkFetch({ status: "failed" });
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.finalize!({ providerReference: "intent-uuid-1" });
    assert.ok(r.ok && r.value.impliedStatus === "failed");
  });

  it("maps a still-pending charge → null (not yet terminal)", async () => {
    const { fetchImpl } = verifyOkFetch({ status: "pending" });
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.finalize!({ providerReference: "intent-uuid-1" });
    assert.ok(r.ok && r.value.impliedStatus === null);
  });

  it("fails FATALLY on an unsupported response currency (cannot convert units honestly)", async () => {
    const { fetchImpl } = verifyOkFetch({ currency: "ZWL" });
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.finalize!({ providerReference: "intent-uuid-1" });
    assert.ok(!r.ok && !r.error.retryable);
  });

  it("treats a 5xx as RETRYABLE", async () => {
    const { fetchImpl } = fakeFetch(() => ({ status: 502, body: {} }));
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.finalize!({ providerReference: "x" });
    assert.ok(!r.ok && r.error.retryable);
  });
});

describe("FlutterwaveProvider.verifyWebhook (verif-hash + MANDATORY server re-verify — notification-only discipline)", () => {
  const chargePayload = {
    event: "charge.completed",
    data: { id: 10292954, tx_ref: "intent-uuid-1", flw_ref: REAL_VERIFY_DATA.flw_ref, amount: 500, currency: "NGN", status: "successful" },
  };

  it("rejects a missing (null) verif-hash without parsing the body", async () => {
    const { fetchImpl, calls } = verifyOkFetch();
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.verifyWebhook({ rawBody: JSON.stringify(chargePayload), signature: null, secret: SECRET_HASH });
    assert.ok(!r.ok && !r.error.retryable);
    assert.equal(calls.length, 0, "no API call for an unauthenticated event");
  });

  it("rejects a wrong verif-hash (fail-closed, constant-time)", async () => {
    const { fetchImpl, calls } = verifyOkFetch();
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.verifyWebhook({ rawBody: JSON.stringify(chargePayload), signature: "wrong-hash", secret: SECRET_HASH });
    assert.ok(!r.ok);
    assert.equal(calls.length, 0);
  });

  it("returns an error (not a throw) for a validly-hashed but non-JSON body", async () => {
    const { fetchImpl } = verifyOkFetch();
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.verifyWebhook({ rawBody: "not json", signature: SECRET_HASH, secret: SECRET_HASH });
    assert.ok(!r.ok);
  });

  it("charge.completed → RE-VERIFIES via the API and derives succeeded from the VERIFY (never the payload)", async () => {
    const { fetchImpl, calls } = verifyOkFetch();
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.verifyWebhook({ rawBody: JSON.stringify(chargePayload), signature: SECRET_HASH, secret: SECRET_HASH });

    assert.equal(calls.length, 1, "exactly one server-side re-verify call");
    assert.ok(calls[0].url.includes("/transactions/verify_by_reference?tx_ref=intent-uuid-1"));
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.value.eventType, "charge.completed");
      assert.equal(r.value.impliedStatus, "succeeded");
      assert.equal(r.value.providerReference, "intent-uuid-1");
      assert.equal(r.value.providerEventId, "intent-uuid-1", "G2: same dedup key as finalize — can't double-apply");
      assert.equal(r.value.feeMinor, 754, "fees come from the VERIFY payload (the reliable source)");
      assert.equal(r.value.feeVatMinor, 53);
    }
  });

  it("FATALLY rejects a payload↔verify amount mismatch — the known Flutterwave footgun (never a success)", async () => {
    const tampered = { ...chargePayload, data: { ...chargePayload.data, amount: 1 } }; // claims ₦1
    const { fetchImpl } = verifyOkFetch(); // verify says ₦500
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.verifyWebhook({ rawBody: JSON.stringify(tampered), signature: SECRET_HASH, secret: SECRET_HASH });
    assert.ok(!r.ok && !r.error.retryable);
  });

  it("FATALLY rejects a payload↔verify currency mismatch", async () => {
    const tampered = { ...chargePayload, data: { ...chargePayload.data, currency: "USD" } };
    const { fetchImpl } = verifyOkFetch();
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.verifyWebhook({ rawBody: JSON.stringify(tampered), signature: SECRET_HASH, secret: SECRET_HASH });
    assert.ok(!r.ok && !r.error.retryable);
  });

  it("FATALLY rejects a money-bearing charge event that OMITS amount/currency (the match is MANDATORY, not best-effort) — no re-verify call", async () => {
    // The verif-hash is a STATIC shared secret, so a leaked/replayed hash + a body
    // that simply omits amount+currency must NOT slip past the match guard.
    const { fetchImpl, calls } = verifyOkFetch();
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const rawBody = JSON.stringify({ event: "charge.completed", data: { id: 10292954, tx_ref: "intent-uuid-1", status: "successful" } });
    const r = await p.verifyWebhook({ rawBody, signature: SECRET_HASH, secret: SECRET_HASH });
    assert.ok(!r.ok && !r.error.retryable, "a charge event with no amount/currency to match against the verify must be fatal");
    assert.equal(calls.length, 0, "fail fast — no API call for an unmatchable charge event");
  });

  it("derives failed from the verify even when the webhook claimed success (verify is the money truth)", async () => {
    const { fetchImpl } = verifyOkFetch({ status: "failed" });
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.verifyWebhook({ rawBody: JSON.stringify(chargePayload), signature: SECRET_HASH, secret: SECRET_HASH });
    assert.ok(r.ok && r.value.impliedStatus === "failed");
  });

  it("maps a verify still-pending to a null impliedStatus (ack; redelivery/finalize settles it)", async () => {
    const { fetchImpl } = verifyOkFetch({ status: "pending" });
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.verifyWebhook({ rawBody: JSON.stringify(chargePayload), signature: SECRET_HASH, secret: SECRET_HASH });
    assert.ok(r.ok && r.value.impliedStatus === null);
  });

  it("propagates a re-verify transport failure as an error (fail-closed; provider redelivers)", async () => {
    const { fetchImpl } = fakeFetch(() => ({ status: 503, body: {} }));
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.verifyWebhook({ rawBody: JSON.stringify(chargePayload), signature: SECRET_HASH, secret: SECRET_HASH });
    assert.ok(!r.ok);
  });

  it("maps an informational event (transfer.completed) to a null impliedStatus with NO re-verify call", async () => {
    const { fetchImpl, calls } = verifyOkFetch();
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const rawBody = JSON.stringify({ event: "transfer.completed", data: { id: 1 } });
    const r = await p.verifyWebhook({ rawBody, signature: SECRET_HASH, secret: SECRET_HASH });
    assert.ok(r.ok && r.value.impliedStatus === null && !r.value.refundEvent);
    assert.equal(calls.length, 0);
  });

  it("refund.completed with tx_ref + currency → refundEvent {processed} resolved by the ORIGINAL charge tx_ref", async () => {
    const { fetchImpl, calls } = verifyOkFetch();
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const rawBody = JSON.stringify({
      event: "refund.completed",
      data: { id: 88421, tx_ref: "intent-uuid-1", flw_ref: REAL_VERIFY_DATA.flw_ref, amount_refunded: 500, currency: "NGN", status: "completed" },
    });
    const r = await p.verifyWebhook({ rawBody, signature: SECRET_HASH, secret: SECRET_HASH });
    assert.equal(calls.length, 0, "tx_ref + currency present — no resolution call needed");
    assert.ok(r.ok);
    if (r.ok) {
      assert.equal(r.value.impliedStatus, null, "refund truth flows through apply_refund_webhook, never impliedStatus");
      assert.equal(r.value.providerReference, "intent-uuid-1");
      assert.equal(r.value.providerEventId, "refund:intent-uuid-1");
      assert.deepEqual(r.value.refundEvent, { outcome: "processed", amountMinor: 50_000, refundReference: "88421" });
    }
  });

  it("refund.completed WITHOUT tx_ref resolves it via verify-by-id (tx_id) before reporting", async () => {
    const { fetchImpl, calls } = fakeFetch((call) => {
      if (call.url === "https://api.flutterwave.com/v3/transactions/10292954/verify") {
        return { status: 200, body: { status: "success", data: REAL_VERIFY_DATA } };
      }
      return { status: 404, body: { status: "error" } };
    });
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const rawBody = JSON.stringify({
      event: "refund.completed",
      data: { id: 88421, tx_id: 10292954, amount_refunded: 500, status: "completed" },
    });
    const r = await p.verifyWebhook({ rawBody, signature: SECRET_HASH, secret: SECRET_HASH });
    assert.equal(calls.length, 1);
    assert.ok(r.ok);
    if (r.ok) {
      assert.equal(r.value.providerReference, "intent-uuid-1", "tx_ref resolved from the transaction id");
      assert.equal(r.value.refundEvent?.amountMinor, 50_000, "currency resolved from the verify enables exact conversion");
    }
  });

  it("returns a RETRYABLE error (never an ack) when tx_ref is absent AND the id-resolve fails — the refund confirmation must redeliver, not drop", async () => {
    // refund.completed without tx_ref → resolve via tx_id; if that call fails, emitting
    // an unbindable refundEvent (empty reference) would make the route ACK and Flutterwave
    // never redeliver → a silently-dropped refund confirmation (the inverse of #272).
    const { fetchImpl, calls } = fakeFetch(() => ({ status: 503, body: {} }));
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const rawBody = JSON.stringify({
      event: "refund.completed",
      data: { id: 88421, tx_id: 10292954, amount_refunded: 500, status: "completed" },
    });
    const r = await p.verifyWebhook({ rawBody, signature: SECRET_HASH, secret: SECRET_HASH });
    assert.ok(!r.ok && r.error.retryable, "a failed resolve must surface as retryable so the webhook is not acked");
    assert.equal(calls.length, 1);
  });

  it("FATALLY rejects a terminal refund outcome whose tx_ref is wholly unresolvable (no tx_ref, no tx_id) — never emit an unbindable event the route would silently ack", async () => {
    const { fetchImpl, calls } = verifyOkFetch();
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const rawBody = JSON.stringify({ event: "refund.completed", data: { id: 88421, amount_refunded: 500, status: "completed" } });
    const r = await p.verifyWebhook({ rawBody, signature: SECRET_HASH, secret: SECRET_HASH });
    assert.ok(!r.ok && !r.error.retryable, "a terminal refund with no resolvable reference must fail loudly, not ack");
    assert.equal(calls.length, 0);
  });

  it("reports a null refund amount when the currency is unknowable — never a guessed conversion", async () => {
    const { fetchImpl } = fakeFetch(() => ({ throws: true }));
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const rawBody = JSON.stringify({
      event: "refund.completed",
      data: { id: 88421, tx_ref: "intent-uuid-1", amount_refunded: 500, status: "completed" }, // no currency
    });
    const r = await p.verifyWebhook({ rawBody, signature: SECRET_HASH, secret: SECRET_HASH });
    assert.ok(r.ok);
    if (r.ok) assert.equal(r.value.refundEvent?.amountMinor, null);
  });

  it("maps a failed refund status → refundEvent {outcome: failed}", async () => {
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl: fakeFetch(() => ({ throws: true })).fetchImpl });
    const rawBody = JSON.stringify({
      event: "refund.completed",
      data: { id: 88421, tx_ref: "intent-uuid-1", currency: "NGN", amount_refunded: 500, status: "failed" },
    });
    const r = await p.verifyWebhook({ rawBody, signature: SECRET_HASH, secret: SECRET_HASH });
    assert.ok(r.ok && r.value.refundEvent?.outcome === "failed");
  });

  it("treats a refund event with an unknown status as informational (no refundEvent — outcomes are never guessed)", async () => {
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl: fakeFetch(() => ({ throws: true })).fetchImpl });
    const rawBody = JSON.stringify({
      event: "refund.completed",
      data: { id: 88421, tx_ref: "intent-uuid-1", amount_refunded: 500, status: "initiated" },
    });
    const r = await p.verifyWebhook({ rawBody, signature: SECRET_HASH, secret: SECRET_HASH });
    assert.ok(r.ok && r.value.impliedStatus === null && r.value.refundEvent === undefined);
  });
});

describe("FlutterwaveProvider.refund (POST /transactions/{id}/refund — queued; money truth via webhook)", () => {
  function refundFetch() {
    return fakeFetch((call) => {
      if (call.url.includes("/transactions/verify_by_reference")) {
        return { status: 200, body: { status: "success", data: REAL_VERIFY_DATA } };
      }
      if (call.url === "https://api.flutterwave.com/v3/transactions/10292954/refund") {
        return { status: 200, body: { status: "success", message: "queued", data: { id: 88421, status: "completed" } } };
      }
      return { status: 404, body: { status: "error" } };
    });
  }

  it("resolves tx_ref → numeric transaction id, then refunds by THAT id with a MAJOR-unit amount", async () => {
    const { fetchImpl, calls } = refundFetch();
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.refund({ providerReference: "intent-uuid-1", amountMinor: 20_000, reason: "customer request" });

    assert.equal(calls.length, 2);
    assert.ok(calls[0].url.includes("/transactions/verify_by_reference?tx_ref=intent-uuid-1"));
    assert.equal(calls[1].url, "https://api.flutterwave.com/v3/transactions/10292954/refund");
    const sent = JSON.parse(calls[1].init.body!);
    assert.equal(sent.amount, "200", "20000 kobo → MAJOR '200' (the proven unit seam)");
    assert.equal(sent.comments, "customer request");
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.value.refundReference, "88421");
  });

  it("fails FATALLY when the transaction id cannot be resolved (no blind refund)", async () => {
    const { fetchImpl } = fakeFetch((call) =>
      call.url.includes("/transactions/verify_by_reference")
        ? { status: 200, body: { status: "success", data: { tx_ref: "intent-uuid-1", currency: "NGN" } } } // no id
        : { status: 200, body: { status: "success", data: { id: 1 } } },
    );
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.refund({ providerReference: "intent-uuid-1", amountMinor: 20_000 });
    assert.ok(!r.ok && !r.error.retryable);
  });

  it("fails FATALLY when the refund response carries no id", async () => {
    const { fetchImpl } = fakeFetch((call) =>
      call.url.includes("verify_by_reference")
        ? { status: 200, body: { status: "success", data: REAL_VERIFY_DATA } }
        : { status: 200, body: { status: "success", data: {} } },
    );
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.refund({ providerReference: "intent-uuid-1", amountMinor: 20_000 });
    assert.ok(!r.ok && !r.error.retryable);
  });

  it("propagates a retryable failure from the resolve step", async () => {
    const { fetchImpl } = fakeFetch(() => ({ status: 503, body: {} }));
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.refund({ providerReference: "intent-uuid-1", amountMinor: 20_000 });
    assert.ok(!r.ok && r.error.retryable);
  });

  it("fails FATALLY when the resolved transaction currency is unsupported — never guess an exponent on the disbursement path", async () => {
    const { fetchImpl } = fakeFetch((call) =>
      call.url.includes("verify_by_reference")
        ? { status: 200, body: { status: "success", data: { id: 10292954, currency: "ZWL" } } }
        : { status: 200, body: { status: "success", data: { id: 88421 } } },
    );
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.refund({ providerReference: "intent-uuid-1", amountMinor: 20_000 });
    assert.ok(!r.ok && !r.error.retryable, "an unsupported currency on the money-moving path must be fatal, never a x100 guess");
  });
});

describe("FlutterwaveProvider.listRefunds — DELIBERATELY ABSENT (money-safety)", () => {
  it("is not implemented: Flutterwave has no verified per-transaction refund-list filter; an incomplete list would license the route's adopt path to create a SECOND real-money refund (the Paystack #272 class). The refund route 503s the crash window instead.", () => {
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY });
    assert.equal((p as { listRefunds?: unknown }).listRefunds, undefined);
  });
});

describe("FlutterwaveProvider.getBalance (G4 reconciliation — /balances)", () => {
  it("returns the matching-currency available balance converted to minor units", async () => {
    const { fetchImpl, calls } = fakeFetch(() => ({
      status: 200,
      body: { status: "success", data: [
        { currency: "USD", available_balance: 12.5, ledger_balance: 12.5 },
        { currency: "NGN", available_balance: 21_950, ledger_balance: 22_000 },
      ] },
    }));
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.getBalance!({ currency: "NGN" });

    assert.equal(calls[0].url, "https://api.flutterwave.com/v3/balances");
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.value.currency, "NGN");
      assert.equal(r.value.availableMinor, 2_195_000, "major 21950 → 2195000 kobo");
      assert.ok(!Number.isNaN(Date.parse(r.value.asOf)));
    }
  });

  it("fails (fatal) when the requested currency is absent from the balances", async () => {
    const { fetchImpl } = fakeFetch(() => ({ status: 200, body: { status: "success", data: [{ currency: "USD", available_balance: 1 }] } }));
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.getBalance!({ currency: "NGN" });
    assert.ok(!r.ok && !r.error.retryable);
  });

  it("treats a 5xx as RETRYABLE", async () => {
    const { fetchImpl } = fakeFetch(() => ({ status: 500, body: {} }));
    const p = new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });
    const r = await p.getBalance!({ currency: "NGN" });
    assert.ok(!r.ok && r.error.retryable);
  });
});

describe("createPaymentRouter — FLW_SECRET_KEY activation seam (G3: config-only test↔live)", () => {
  it("registers the live FlutterwaveProvider when FLW_SECRET_KEY is set", () => {
    const prev = process.env.FLW_SECRET_KEY;
    process.env.FLW_SECRET_KEY = SECRET_KEY;
    try {
      const adapter = createPaymentRouter().getAdapter("flutterwave");
      assert.ok(adapter instanceof FlutterwaveProvider, "FLW_SECRET_KEY set → live adapter registered");
    } finally {
      if (prev === undefined) delete process.env.FLW_SECRET_KEY;
      else process.env.FLW_SECRET_KEY = prev;
    }
  });

  it("registers nothing under 'flutterwave' when FLW_SECRET_KEY is absent (and mock is off)", () => {
    const prevKey = process.env.FLW_SECRET_KEY;
    const prevMock = process.env.MOCK_PAYMENT;
    delete process.env.FLW_SECRET_KEY;
    delete process.env.MOCK_PAYMENT;
    try {
      assert.equal(createPaymentRouter().getAdapter("flutterwave"), undefined);
    } finally {
      if (prevKey !== undefined) process.env.FLW_SECRET_KEY = prevKey;
      if (prevMock !== undefined) process.env.MOCK_PAYMENT = prevMock;
    }
  });

  it("a live Flutterwave adapter is never shadowed by the mock (live registers first)", () => {
    const prevKey = process.env.FLW_SECRET_KEY;
    const prevMock = process.env.MOCK_PAYMENT;
    process.env.FLW_SECRET_KEY = SECRET_KEY;
    process.env.MOCK_PAYMENT = "1";
    try {
      const adapter = createPaymentRouter().getAdapter("flutterwave");
      assert.ok(adapter instanceof FlutterwaveProvider, "MOCK_PAYMENT=1 must backfill only keys nothing live serves");
    } finally {
      if (prevKey === undefined) delete process.env.FLW_SECRET_KEY;
      else process.env.FLW_SECRET_KEY = prevKey;
      if (prevMock === undefined) delete process.env.MOCK_PAYMENT;
      else process.env.MOCK_PAYMENT = prevMock;
    }
  });
});

// ── V3-MONEY-PAYOUT — outbound transfers (payout rail W1) ──
describe("FlutterwaveProvider — outbound transfers (automatic withdrawal payouts)", () => {
  const provider = (fetchImpl: FlutterwaveFetch) => new FlutterwaveProvider({ secretKey: SECRET_KEY, fetchImpl });

  it("resolveBankAccount returns the holder name (POST /accounts/resolve)", async () => {
    const { fetchImpl, calls } = fakeFetch((c) => {
      assert.ok(c.url.endsWith("/accounts/resolve"));
      return { status: 200, body: { status: "success", data: { account_name: "ADA LOVELACE" } } };
    });
    const res = await provider(fetchImpl).resolveBankAccount({ accountNumber: "0690000031", bankCode: "044" });
    assert.ok(res.ok);
    if (res.ok) assert.equal(res.value.accountName, "ADA LOVELACE");
    const body = JSON.parse(calls[0].init.body ?? "{}");
    assert.equal(body.account_number, "0690000031");
    assert.equal(body.account_bank, "044");
  });

  it("resolveBankAccount fails fast on a missing account (no API call)", async () => {
    const { fetchImpl, calls } = fakeFetch(() => ({ status: 200, body: {} }));
    const res = await provider(fetchImpl).resolveBankAccount({ accountNumber: "", bankCode: "044" });
    assert.equal(res.ok, false);
    assert.equal(calls.length, 0);
  });

  it("createTransfer POSTs /transfers with MAJOR amount + OUR reference, returns the provider id", async () => {
    const { fetchImpl, calls } = fakeFetch((c) => {
      assert.ok(c.url.endsWith("/transfers"));
      assert.equal(c.init.method, "POST");
      return { status: 200, body: { status: "success", data: { id: 28237, reference: "wd-req-1", status: "NEW" } } };
    });
    const res = await provider(fetchImpl).createTransfer({
      reference: "wd-req-1", amountMinor: 50_000, currency: "NGN", accountNumber: "0690000031", bankCode: "044", narration: "payout",
    });
    assert.ok(res.ok);
    if (res.ok) {
      assert.equal(res.value.providerReference, "28237");
      assert.equal(res.value.status, "NEW");
    }
    const body = JSON.parse(calls[0].init.body ?? "{}");
    assert.equal(body.amount, "500"); // 50000 kobo → MAJOR "500", never raw kobo
    assert.equal(body.reference, "wd-req-1"); // our idempotency key
    assert.equal(body.account_number, "0690000031");
    assert.equal(body.account_bank, "044");
    assert.equal(body.currency, "NGN");
  });

  it("createTransfer never treats a create as paid — status is verbatim, not an outcome", async () => {
    const { fetchImpl } = fakeFetch(() => ({ status: 200, body: { status: "success", data: { id: 1, status: "NEW" } } }));
    const res = await provider(fetchImpl).createTransfer({ reference: "r", amountMinor: 1000, currency: "NGN", accountNumber: "1", bankCode: "044" });
    assert.ok(res.ok && res.value.status === "NEW"); // NEW != completed; only verifyTransfer confirms
  });

  it("verifyTransfer maps SUCCESSFUL→completed with the real fee, FAILED→failed, PENDING→null", async () => {
    const mk = (status: string, fee?: number) =>
      provider(fakeFetch(() => ({ status: 200, body: { status: "success", data: { id: 28237, reference: "wd-req-1", status, fee, currency: "NGN" } } })).fetchImpl);
    const ok = await mk("SUCCESSFUL", 10.75).verifyTransfer({ providerReference: "28237" });
    assert.ok(ok.ok);
    if (ok.ok) {
      assert.equal(ok.value.outcome, "completed");
      assert.equal(ok.value.reference, "wd-req-1");
      assert.equal(ok.value.feeMinor, 1075); // ₦10.75 → 1075 kobo
    }
    const failed = await mk("FAILED").verifyTransfer({ providerReference: "28237" });
    assert.ok(failed.ok && failed.value.outcome === "failed");
    const pending = await mk("PENDING").verifyTransfer({ providerReference: "28237" });
    assert.ok(pending.ok && pending.value.outcome === null); // never assume — pending stays null
  });

  it("a transfer.completed webhook RE-VERIFIES by id and yields a transferEvent bound to our reference", async () => {
    let sawVerify = false;
    const { fetchImpl } = fakeFetch((c) => {
      if (c.url.includes("/transfers/28237")) {
        sawVerify = true;
        return { status: 200, body: { status: "success", data: { id: 28237, reference: "wd-req-1", status: "SUCCESSFUL", fee: 10.75, currency: "NGN" } } };
      }
      return { status: 200, body: {} };
    });
    const rawBody = JSON.stringify({ event: "transfer.completed", data: { id: 28237, reference: "wd-req-1", status: "SUCCESSFUL" } });
    const res = await provider(fetchImpl).verifyWebhook({ rawBody, signature: SECRET_HASH, secret: SECRET_HASH });
    assert.ok(res.ok);
    if (res.ok) {
      assert.ok(sawVerify, "the webhook must re-verify, never trust the static-hash payload alone");
      assert.equal(res.value.impliedStatus, null); // payout truth is NOT a charge status
      assert.deepEqual(res.value.transferEvent, {
        reference: "wd-req-1", providerReference: "28237", outcome: "completed", feeMinor: 1075,
      });
    }
  });

  it("a still-PENDING transfer notice is informational — no re-verify, no transferEvent", async () => {
    const { fetchImpl, calls } = fakeFetch(() => ({ status: 200, body: {} }));
    const rawBody = JSON.stringify({ event: "transfer.completed", data: { id: 28237, reference: "wd-req-1", status: "PENDING" } });
    const res = await provider(fetchImpl).verifyWebhook({ rawBody, signature: SECRET_HASH, secret: SECRET_HASH });
    assert.ok(res.ok);
    if (res.ok) assert.equal(res.value.transferEvent, undefined);
    assert.equal(calls.length, 0, "a pending notice makes no verify call");
  });

  it("a transfer webhook whose reference disagrees with the verify is rejected (footgun guard)", async () => {
    const { fetchImpl } = fakeFetch((c) =>
      c.url.includes("/transfers/28237")
        ? { status: 200, body: { status: "success", data: { id: 28237, reference: "SOMEONE-ELSE", status: "SUCCESSFUL" } } }
        : { status: 200, body: {} });
    const rawBody = JSON.stringify({ event: "transfer.completed", data: { id: 28237, reference: "wd-req-1", status: "SUCCESSFUL" } });
    const res = await provider(fetchImpl).verifyWebhook({ rawBody, signature: SECRET_HASH, secret: SECRET_HASH });
    assert.equal(res.ok, false);
  });

  it("a transfer webhook with a bad signature is rejected before any work", async () => {
    const { fetchImpl, calls } = fakeFetch(() => ({ status: 200, body: {} }));
    const rawBody = JSON.stringify({ event: "transfer.completed", data: { id: 28237, reference: "wd-req-1", status: "SUCCESSFUL" } });
    const res = await provider(fetchImpl).verifyWebhook({ rawBody, signature: "WRONG", secret: SECRET_HASH });
    assert.equal(res.ok, false);
    assert.equal(calls.length, 0);
  });
});
