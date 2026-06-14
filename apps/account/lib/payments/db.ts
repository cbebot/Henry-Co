import "server-only";
import { Pool } from "pg";
import { SUPABASE_POOLER_CA } from "./supabase-pooler-ca";

/**
 * Pooled direct-Postgres access to the money RPCs (V3-15-S3).
 *
 * The money writers live in the NON-exposed `payments_private` schema, so
 * supabase-js / PostgREST cannot reach them by construction. The routes call them
 * here over the Supabase transaction pooler (server-only `PAYMENTS_DATABASE_URL`).
 *
 * TLS: VERIFIED by default. The Supabase pooler presents a self-signed chain
 * (Supabase Root 2021 CA, not in Node's default trust store), so we verify against
 * that root, bundled in ./supabase-pooler-ca. `PAYMENTS_DB_SSL_CA` overrides the
 * bundled root (e.g. after a Supabase CA rotation); `PAYMENTS_DB_SSL_INSECURE=true`
 * is an explicit, deliberate escape hatch (encrypt-only) — never the silent default.
 */
let pool: Pool | null = null;

function sslConfig(): { ca?: string; rejectUnauthorized: boolean } {
  const ca = process.env.PAYMENTS_DB_SSL_CA;
  if (ca) return { ca, rejectUnauthorized: true };
  if (process.env.PAYMENTS_DB_SSL_INSECURE === "true") return { rejectUnauthorized: false };
  // Verified-by-default: the Supabase pooler's chain roots at the bundled Supabase
  // Root 2021 CA, which isn't in Node's default trust store.
  return { ca: SUPABASE_POOLER_CA, rejectUnauthorized: true };
}

function getPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.PAYMENTS_DATABASE_URL;
  if (!connectionString) throw new Error("PAYMENTS_DATABASE_URL is not configured");
  pool = new Pool({
    connectionString,
    ssl: sslConfig(),
    max: 2, // small client-side cap; the transaction pooler owns real DB pooling
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  return pool;
}

export type PaymentRpc =
  | "apply_payment_webhook"
  | "advance_payment_intent"
  // V3-17 — the atomic wallet-top-up credit (balance + wallet log + double-entry
  // journal in one transaction). Also in payments_private; same pooled-pg path.
  | "credit_wallet_topup"
  // V3-19 — the refund lifecycle writers (claim+record+wallet-hold, provider-id
  // adoption, synchronous-reject revert, the provider-confirmed apply, and the
  // credit-note document writer). All payments_private; same pooled-pg path.
  | "initiate_payment_refund"
  | "set_refund_provider_reference"
  | "fail_payment_refund"
  | "apply_refund_webhook"
  | "record_customer_credit_note";

/**
 * Invoke a `payments_private` money RPC over the pooled direct-pg connection.
 * Returns a supabase-js-shaped `{ data, error }` so the route call sites stay
 * drop-in. `fn` is a constrained literal union (no injection); args are bound ($n).
 */
export async function callPaymentRpc<T = unknown>(
  fn: PaymentRpc,
  args: ReadonlyArray<string | null>,
): Promise<{ data: T | null; error: { message: string; code?: string } | null }> {
  const placeholders = args.map((_, i) => `$${i + 1}`).join(", ");
  try {
    const res = await getPool().query(`select payments_private.${fn}(${placeholders}) as result`, args as unknown[]);
    return { data: (res.rows[0]?.result ?? null) as T, error: null };
  } catch (e) {
    const err = e as { message?: string; code?: string };
    return { data: null, error: { message: err.message ?? "payment rpc failed", code: err.code } };
  }
}
