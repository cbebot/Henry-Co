import "server-only";
import { Pool } from "pg";
import { SUPABASE_POOLER_CA } from "./supabase-pooler-ca";

/**
 * The COMPANY-WIDE shared money rail: one pooled, TLS-verified direct-Postgres connection
 * to the `payments_private` RPCs over the Supabase transaction pooler (`PAYMENTS_DATABASE_URL`).
 *
 * The money writers live in the NON-PostgREST-exposed `payments_private` schema, so
 * supabase-js cannot reach them by construction — every division calls them here, over the
 * SAME pooled connection, with the SAME verified TLS. This replaces the per-app copies of
 * `lib/payments/db.ts` so there is one rail to audit and keep to standard.
 *
 * TLS: VERIFIED by default against the bundled Supabase Root 2021 CA (the pooler's
 * self-signed chain is not in Node's trust store). `PAYMENTS_DB_SSL_CA` overrides the bundled
 * root (e.g. after a Supabase CA rotation); `PAYMENTS_DB_SSL_INSECURE=true` is an explicit,
 * deliberate encrypt-only escape hatch — never the silent default.
 */
let pool: Pool | null = null;

function sslConfig(): { ca?: string; rejectUnauthorized: boolean } {
  const ca = process.env.PAYMENTS_DB_SSL_CA;
  if (ca) return { ca, rejectUnauthorized: true };
  if (process.env.PAYMENTS_DB_SSL_INSECURE === "true") return { rejectUnauthorized: false };
  return { ca: SUPABASE_POOLER_CA, rejectUnauthorized: true };
}

/** True iff the pooled money path is configured (`PAYMENTS_DATABASE_URL` present). A division
 *  can use this to degrade gracefully (e.g. fall back to a free/heuristic path) when the rail
 *  isn't wired in an environment, rather than throwing. */
export function isPaymentsDbConfigured(): boolean {
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

/** A minimal `{ query }` executor — exactly what `@henryco/ai-gateway`'s `createPgBillingPort`
 *  expects. A division wires metered AI billing with `createPgBillingPort(getPaymentsSqlExecutor())`.
 *  Lazily connects, so importing it on a path with the AI flag OFF never opens a connection. */
export function getPaymentsSqlExecutor(): {
  query<T = Record<string, unknown>>(text: string, params: unknown[]): Promise<{ rows: T[] }>;
} {
  return {
    query: (text, params) => getPool().query(text, params as unknown[]) as Promise<{ rows: never[] }>,
  };
}

/**
 * Invoke a `payments_private` money RPC over the shared pooled connection. Returns a
 * supabase-js-shaped `{ data, error }` so existing call sites stay drop-in. `fn` is a literal
 * the caller constrains (no injection); args are bound positionally ($1..$n). The host/port
 * (never the user/password/full URL) is logged on failure for reachability diagnosis.
 */
export async function callPaymentRpc<T = unknown>(
  fn: string,
  args: ReadonlyArray<string | null>,
): Promise<{ data: T | null; error: { message: string; code?: string } | null }> {
  const placeholders = args.map((_, i) => `$${i + 1}`).join(", ");
  try {
    const res = await getPool().query(`select payments_private.${fn}(${placeholders}) as result`, args as unknown[]);
    return { data: (res.rows[0]?.result ?? null) as T, error: null };
  } catch (e) {
    const err = e as { message?: string; code?: string };
    let dbHost = "unparseable";
    try {
      const u = new URL(process.env.PAYMENTS_DATABASE_URL ?? "");
      dbHost = `${u.hostname}:${u.port || "5432"}`;
    } catch {
      /* leave as unparseable */
    }
    console.error(`[payments-db ${dbHost}] ${fn} failed`, { code: err.code, message: err.message });
    return { data: null, error: { message: err.message ?? "payment rpc failed", code: err.code } };
  }
}
