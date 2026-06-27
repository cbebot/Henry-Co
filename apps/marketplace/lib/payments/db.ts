import "server-only";
import { Pool } from "pg";
import { SUPABASE_POOLER_CA } from "./supabase-pooler-ca";

/**
 * Pooled direct-Postgres access to the money RPCs — the marketplace sibling of
 * apps/account/lib/payments/db.ts (V3-DIVISION-CHECKOUT-01).
 *
 * The money writers live in the NON-exposed `payments_private` schema, so
 * supabase-js / PostgREST cannot reach them by construction. The card-sale
 * reconciler calls them here over the Supabase transaction pooler (server-only
 * `PAYMENTS_DATABASE_URL`). Marketplace reuses the SAME guarded RPCs the account
 * rail uses — it mints no money function of its own.
 *
 * TLS: VERIFIED by default against the bundled Supabase Root 2021 CA (the pooler's
 * self-signed chain is not in Node's trust store). `PAYMENTS_DB_SSL_CA` overrides
 * the bundled root (e.g. after a Supabase CA rotation); `PAYMENTS_DB_SSL_INSECURE=true`
 * is an explicit, deliberate encrypt-only escape hatch — never the silent default.
 */
let pool: Pool | null = null;

function sslConfig(): { ca?: string; rejectUnauthorized: boolean } {
  const ca = process.env.PAYMENTS_DB_SSL_CA;
  if (ca) return { ca, rejectUnauthorized: true };
  if (process.env.PAYMENTS_DB_SSL_INSECURE === "true") return { rejectUnauthorized: false };
  return { ca: SUPABASE_POOLER_CA, rejectUnauthorized: true };
}

/** True iff the pooled money path is configured (PAYMENTS_DATABASE_URL present). */
export function isPaymentDbConfigured(): boolean {
  return Boolean(process.env.PAYMENTS_DATABASE_URL);
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

/**
 * The shared `@henryco/payments-db` executor — re-exported so AI billing across the company
 * uses ONE canonical rail (`getPaymentsSqlExecutor`) instead of a per-app copy. Marketplace's
 * AI actions call `createPgBillingPort(getPaymentsSqlExecutor())` against the same guarded
 * `payments_private` RPCs over the same verified pooled connection.
 */
export { getPaymentsSqlExecutor } from "@henryco/payments-db";

/**
 * The constrained set of `payments_private` RPCs the division card-sale path
 * calls. NO new money function — these all exist (V3-VAT-01 / V3-18) and are
 * granted to service_role only:
 *   - post_sale_revenue        — clearing→revenue+output-VAT allocation (the sale edge)
 *   - record_customer_receipt  — the ledger-tied HO-RCT receipt writer
 */
export type PaymentRpc = "post_sale_revenue" | "record_customer_receipt";

/**
 * Invoke a `payments_private` money RPC over the pooled direct-pg connection.
 * Returns a supabase-js-shaped `{ data, error }` so call sites stay drop-in.
 * `fn` is a constrained literal union (no injection); args are bound ($n).
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
    // Log the pg error AND the configured DB host:port FIRST (the log viewer
    // truncates the line, and the host is what we need to diagnose
    // ENOTFOUND/reachability). Host/port only — never the user, password, or
    // full connection string.
    let dbHost = "unparseable";
    try {
      const u = new URL(process.env.PAYMENTS_DATABASE_URL ?? "");
      dbHost = `${u.hostname}:${u.port || "5432"}`;
    } catch {
      /* leave as unparseable */
    }
    console.error(`[mkt-paydb ${dbHost}] ${fn} failed`, { code: err.code, message: err.message });
    return { data: null, error: { message: err.message ?? "payment rpc failed", code: err.code } };
  }
}
