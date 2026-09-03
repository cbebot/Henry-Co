/**
 * Resolve OUR `payment_intents.id` (UUID) from a hosted-checkout return redirect,
 * provider-agnostically. This is the single seam the buyer's return surface uses
 * to know which intent to finalize.
 *
 * Each provider names the return param differently:
 *   - Paystack    → `?reference=<id>&trxref=<id>`
 *   - Flutterwave → `?status=<…>&tx_ref=<id>&transaction_id=<flwId>`  (V3-16)
 *
 * In every case the value IS our intent UUID, because the router records that UUID
 * as the provider reference at initiation (Paystack `reference`, Flutterwave
 * `tx_ref`). Flutterwave's `transaction_id` is the provider's OWN numeric id — it
 * is deliberately NOT a fallback here; using it as our reference would query the DB
 * with a key that does not exist.
 *
 * The shape is validated against the UUID grammar BEFORE the caller hits the DB, so
 * a malformed value can never reach a `uuid` cast. Returns the validated UUID, or
 * `null` when no usable reference is present.
 *
 * Regression context: V3-16 (PR #276) activated the Flutterwave adapter + the
 * webhook header (`verif-hash`) but left this return surface reading only Paystack's
 * `reference`/`trxref`. Every Flutterwave return therefore resolved to null → the
 * "couldn't find this payment" card → `finalize()` was never called → the intent
 * stranded at `pending`. This resolver closes that seam.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PaymentCallbackQuery {
  /** Paystack canonical return param. */
  reference?: string;
  /** Paystack legacy alias. */
  trxref?: string;
  /** Flutterwave return param — equals our intent UUID. */
  tx_ref?: string;
  /** Flutterwave's OWN numeric transaction id (NOT our reference). */
  transaction_id?: string;
  /** Flutterwave redirect status (spoofable — never trusted for money truth). */
  status?: string;
}

export function resolvePaymentCallbackReference(query: PaymentCallbackQuery): string | null {
  // reference-first: on a post-login bounce we re-emit `?reference=<uuid>`, so it is
  // the canonical normalized form. `tx_ref` is Flutterwave's first-hop param.
  const candidate = (query.reference ?? query.trxref ?? query.tx_ref ?? "").trim();
  if (!candidate || !UUID_RE.test(candidate)) return null;
  return candidate;
}
