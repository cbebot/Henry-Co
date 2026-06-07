import "server-only";
import { Pool } from "pg";

/**
 * Pooled direct-Postgres access to the money RPCs (V3-15-S3).
 *
 * The money writers live in the NON-exposed `payments_private` schema, so
 * supabase-js / PostgREST cannot reach them by construction. The routes call them
 * here over the Supabase transaction pooler (server-only `PAYMENTS_DATABASE_URL`).
 *
 * TLS: secure by default (`rejectUnauthorized: true`). The Supabase pooler presents
 * a self-signed chain, so set `PAYMENTS_DB_SSL_CA` to the project CA (public, from
 * Settings → Database → SSL) for verified TLS in production. `PAYMENTS_DB_SSL_INSECURE=true`
 * is an explicit, deliberate escape hatch (encrypt-only) — never the silent default.
 */
let pool: Pool | null = null;

function sslConfig(): { ca?: string; rejectUnauthorized: boolean } {
  const ca = process.env.PAYMENTS_DB_SSL_CA;
  if (ca) return { ca, rejectUnauthorized: true };
  if (process.env.PAYMENTS_DB_SSL_INSECURE === "true") return { rejectUnauthorized: false };
  return { rejectUnauthorized: true };
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
  | "credit_wallet_topup";

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
