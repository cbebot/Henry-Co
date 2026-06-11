/**
 * V3-19 integrated SEAM proof — the strongest honest stand-in for a live Paystack
 * test-mode refund without the merchant key.
 *
 * Drives the EXACT route path end-to-end on a real Postgres 17, with a REAL
 * HMAC-SHA512-signed Paystack-shape refund webhook:
 *
 *   1. Seed a succeeded charge + a recognised VATable sale on a fresh intent (the
 *      money the refund reverses) via the guarded RPCs.
 *   2. Claim the refund through `initiate_payment_refund` (the route's first DB
 *      call) → intent moves to refund_processing.
 *   3. Build a REAL `refund.processed` payload in Paystack's documented shape
 *      (STRING amount, transaction_reference), sign it HMAC-SHA512 over the RAW
 *      bytes (G1), and verify it through the ACTUAL PaystackProvider.verifyWebhook
 *      — exactly what the webhook route does.
 *   4. Map the resulting `refundEvent` to `apply_refund_webhook` arguments exactly
 *      as `apps/account/app/api/payments/webhooks/[provider]/route.ts` does, and
 *      call the RPC over pooled pg.
 *   5. Assert the full trail: succeeded → refund_processing → refunded; the
 *      reversing settlement + proportional VAT reversal posted; ledger balanced.
 *
 * The ONLY thing this does not exercise is Paystack actually moving money + POSTing
 * the webhook from its servers — the owner-gated FL step (needs the sk_test_ key +
 * a browser reauth session). Everything our code owns is proven here on real PG17
 * with a genuine signature.
 *
 * Run (after building the seam DB — see .codex-temp/v3-19-refunds/report.md):
 *   npx tsx apps/account/scripts/prove-refund-seam.mts
 */

import { createHmac } from "node:crypto";
import { Pool } from "pg";
import { PaystackProvider } from "@henryco/payment-router";

const DB_URL = process.env.SEAM_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:55432/v3_19_seam";
const SECRET = "sk_test_seamproof_0000000000000000000000";

const INTENT = "ffff0000-0000-0000-0000-00000000beef";
const USER = "000000ee-0000-0000-0000-0000000000ee";
const GROSS = 1075;
const OUTPUT_VAT = 75;

const pool = new Pool({ connectionString: DB_URL, max: 2 });
let failures = 0;
function check(label: string, cond: boolean, detail = "") {
  if (cond) console.log(`  ✓ ${label}`);
  else { failures += 1; console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`); }
}
async function q<T = Record<string, unknown>>(sql: string, args: unknown[] = []): Promise<T[]> {
  const r = await pool.query(sql, args);
  return r.rows as T[];
}
async function rpc<T = Record<string, unknown>>(fn: string, args: Array<string | null>): Promise<T> {
  const ph = args.map((_, i) => `$${i + 1}`).join(", ");
  const r = await pool.query(`select payments_private.${fn}(${ph}) as result`, args);
  return r.rows[0].result as T;
}

console.log("\n[seam] V3-19 refund webhook seam — real HMAC-SHA512 → real PaystackProvider → apply_refund_webhook → PG17\n");

// 1. Seed the confirmed charge + recognised sale (the money the refund reverses).
await q(`insert into auth.users (id) values ($1) on conflict do nothing`, [USER]);
await q(
  `insert into public.payment_intents (id,user_id,amount_minor,currency,country,method,status,idempotency_key,provider_reference)
   values ($1::uuid,$2::uuid,$3::bigint,'NGN','NG','card','processing',$4,$5)`,
  [INTENT, USER, String(GROSS), "seam-idem-1", INTENT],
);
// Confirm the charge through the real money path (dedup + status + settlement).
const charge = await rpc<{ applied?: boolean }>("apply_payment_webhook", ["paystack", "seam-charge-evt", INTENT, "succeeded", null, null]);
check("charge confirmed → succeeded (apply_payment_webhook)", charge.applied === true, JSON.stringify(charge));
await rpc("post_sale_revenue", [INTENT, String(GROSS), String(OUTPUT_VAT)]);

// 2. Claim the refund (the route's first DB call). Full refund (no amount = remainder).
const init = await rpc<{ initiated?: boolean; refund_id?: string; amount_minor?: number }>(
  "initiate_payment_refund", [INTENT, "11110000-0000-0000-0000-000000000abc", null, "seam full refund", USER],
);
check("initiate_payment_refund → claimed", init.initiated === true, JSON.stringify(init));
const statusAfterInit = (await q<{ status: string }>(`select status from public.payment_intents where id=$1`, [INTENT]))[0].status;
check("intent → refund_processing after claim (money NOT yet moved, Q3)", statusAfterInit === "refund_processing", statusAfterInit);

// 3. Build a REAL Paystack refund.processed payload (STRING amount, transaction_reference),
//    sign it HMAC-SHA512 over the raw bytes (G1), verify through the REAL adapter.
const rawBody = JSON.stringify({
  event: "refund.processed",
  data: {
    status: "processed",
    transaction_reference: INTENT, // adapter set provider_reference = intent id
    refund_reference: "seam_RFND_4815162342",
    amount: String(GROSS), // Paystack sends amount as a STRING
    currency: "NGN",
  },
});
const signature = createHmac("sha512", SECRET).update(rawBody).digest("hex");
const adapter = new PaystackProvider({ secretKey: SECRET });
const verified = await adapter.verifyWebhook({ rawBody, signature, secret: SECRET });
check("real HMAC-SHA512 webhook verifies (G1 raw-bytes)", verified.ok, verified.ok ? "" : JSON.stringify(verified));
if (!verified.ok) { console.log(`\n❌ seam aborted\n`); process.exit(1); }
check("adapter normalised refund.processed → refundEvent (not impliedStatus)", verified.value.impliedStatus === null && verified.value.refundEvent?.outcome === "processed");
check("string amount '1075' parsed to integer kobo 1075", verified.value.refundEvent?.amountMinor === 1075, String(verified.value.refundEvent?.amountMinor));

// Tamper detection: the same signature over a mutated body must FAIL (G1).
const tampered = await adapter.verifyWebhook({
  rawBody: rawBody.replace('"1075"', '"999999"'),
  signature,
  secret: SECRET,
});
check("tampered body with the original signature is REJECTED (G1 fail-closed)", !tampered.ok);

// 4. Map refundEvent → apply_refund_webhook EXACTLY as the webhook route does.
const re = verified.value.refundEvent!;
const applied = await rpc<{ applied?: boolean; intent_status?: string; vat_reversed_minor?: number; revenue_reversed_minor?: number }>(
  "apply_refund_webhook",
  ["paystack", INTENT, re.outcome, re.amountMinor != null ? String(re.amountMinor) : null, re.refundReference],
);
check("apply_refund_webhook applied the provider-confirmed refund", applied.applied === true, JSON.stringify(applied));
check("intent → refunded (full refund; ONLY now, provider-confirmed)", applied.intent_status === "refunded", String(applied.intent_status));
check("proportional output-VAT reversed = 75 (full)", applied.vat_reversed_minor === 75, String(applied.vat_reversed_minor));
check("revenue reversed = 1000 (full)", applied.revenue_reversed_minor === 1000, String(applied.revenue_reversed_minor));

// 5. Assert the ledger trail + global balance.
const persisted = (await q<{ status: string }>(`select status from public.payment_intents where id=$1`, [INTENT]))[0].status;
check("persisted intent status = refunded", persisted === "refunded", persisted);
const refundRow = (await q<{ status: string; provider_refund_receipt: string | null; settlement_posting_id: string | null }>(
  `select status, provider_refund_receipt, settlement_posting_id from public.payment_refunds where intent_id=$1`, [INTENT]))[0];
check("refund row → succeeded", refundRow.status === "succeeded", refundRow.status);
check("provider refund receipt recorded from the webhook", refundRow.provider_refund_receipt === "seam_RFND_4815162342", String(refundRow.provider_refund_receipt));
check("settlement reversal posting bound to the refund row", !!refundRow.settlement_posting_id);

// Redelivery of the SAME signed webhook → idempotent, one effect.
const replay = await rpc<{ applied?: boolean; reason?: string }>(
  "apply_refund_webhook",
  ["paystack", INTENT, re.outcome, re.amountMinor != null ? String(re.amountMinor) : null, re.refundReference],
);
check("redelivered webhook is an idempotent no-op (one effect)", replay.applied === false && replay.reason === "duplicate", JSON.stringify(replay));

const recon = await rpc<{ balanced?: boolean; delta_minor?: number }>("ledger_reconciliation", []);
check("ledger globally balanced after the full webhook-driven cycle (delta 0)", recon.balanced === true && recon.delta_minor === 0, JSON.stringify(recon));

await pool.end();
console.log(`\n${failures === 0 ? "✅ SEAM PROOF PASSED — real signed webhook → refunded, balanced, idempotent" : `❌ ${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
