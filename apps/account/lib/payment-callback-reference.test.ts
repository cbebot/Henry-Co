import { test } from "node:test";
import assert from "node:assert/strict";

import { resolvePaymentCallbackReference } from "./payment-callback-reference";

const UUID = "8f14e45f-ceea-4e0c-9f2b-1a2b3c4d5e6f";

/* -------------------------------------------------------------------------- */
/*  resolvePaymentCallbackReference — provider-agnostic return-param resolver  */
/* -------------------------------------------------------------------------- */

test("flutterwave: resolves the intent UUID from tx_ref (the V3-16 regression)", () => {
  // Flutterwave's hosted checkout returns the buyer with these params — NOT
  // reference/trxref. Before the fix this yielded null → the error card → finalize
  // was never called → the intent stranded at pending.
  assert.equal(
    resolvePaymentCallbackReference({ status: "successful", tx_ref: UUID, transaction_id: "10292954" }),
    UUID,
  );
});

test("paystack: resolves from reference", () => {
  assert.equal(resolvePaymentCallbackReference({ reference: UUID, trxref: UUID }), UUID);
});

test("paystack: resolves from trxref when reference is absent", () => {
  assert.equal(resolvePaymentCallbackReference({ trxref: UUID }), UUID);
});

test("transaction_id (the provider's OWN numeric id) is NEVER used as our reference", () => {
  // tx_ref absent: transaction_id must not be borrowed as the reference — it is
  // Flutterwave's id, not our payment_intents.id.
  assert.equal(resolvePaymentCallbackReference({ status: "successful", transaction_id: "10292954" }), null);
});

test("absent params → null", () => {
  assert.equal(resolvePaymentCallbackReference({}), null);
});

test("malformed (non-UUID) reference → null (shape-guarded before any DB cast)", () => {
  assert.equal(resolvePaymentCallbackReference({ tx_ref: "not-a-uuid" }), null);
  assert.equal(resolvePaymentCallbackReference({ reference: "12345" }), null);
});

test("surrounding whitespace is trimmed", () => {
  assert.equal(resolvePaymentCallbackReference({ tx_ref: `  ${UUID}  ` }), UUID);
});

test("precedence: Paystack reference wins when both reference and tx_ref are present", () => {
  // Defensive determinism only — a real return carries one provider's params. On a
  // post-login bounce we re-emit ?reference=<uuid>, so reference-first is canonical.
  const other = "00000000-0000-4000-8000-000000000000";
  assert.equal(resolvePaymentCallbackReference({ reference: UUID, tx_ref: other }), UUID);
});
