import "server-only";

/**
 * @henryco/observability/health — shared /api/health helper.
 *
 * V3-10 S8 + A6. The helper exposes one entry point — `buildHealthResponse()` —
 * that 10 web-app route handlers call to produce a uniform health body.
 *
 * Spec (A6):
 *   - Supabase connection check via lightweight `select id limit 1`
 *     against `henry_events` (the table V3-01 already provisions in every
 *     environment; cross-app safe; RLS-readable as service role).
 *   - Critical env-var presence check (no values revealed).
 *   - Returns HTTP 200 only when all checks pass; otherwise 503.
 *   - Body shape:
 *       {
 *         ok: boolean,
 *         checks: { supabase: "ok"|"fail", env: "ok"|"fail" },
 *         version: string | null,
 *         deploy: string | null,
 *         checkedAt: string,                    // ISO-8601
 *       }
 *
 *   Failure detail (which env vars are missing, the raw probe error)
 *   is logged server-side only — the wire body never names secrets or
 *   echoes provider error text on this unauthenticated surface.
 *
 * Used by Vercel monitoring + future SLO tooling. The 503 signal is
 * what kicks off rollback-trigger evaluation (A1) during the 72-hour
 * soak window.
 *
 * Concurrency: the supabase ping has an internal 2s timeout — a hung
 * connection must not stall the health probe past Vercel's default
 * route timeout. On timeout we treat it as a failure (the alternative
 * is to lie about the connection state).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type HealthCheckOutcome = "ok" | "fail";

export type HealthCheckBody = {
  ok: boolean;
  checks: {
    supabase: HealthCheckOutcome;
    env: HealthCheckOutcome;
  };
  /** Commit SHA the host is running. `null` when not on Vercel. */
  version: string | null;
  /** Vercel deployment id. `null` outside Vercel. */
  deploy: string | null;
  /** ISO-8601 timestamp of the probe. */
  checkedAt: string;
};

/**
 * Env vars required for any web app to function. Apps may pass
 * additional names in `extraRequiredEnv` if they need division-specific
 * config validated by the health probe (e.g. payment provider keys).
 */
const CRITICAL_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const SUPABASE_PROBE_TIMEOUT_MS = 2000;

/**
 * Run the env-var presence check.
 * @returns Names of vars that are missing or empty.
 */
function checkEnv(extraRequired: readonly string[] = []): string[] {
  const required = [...CRITICAL_ENV_VARS, ...extraRequired];
  return required.filter((name) => {
    const v = process.env[name];
    return !v || v.trim().length === 0;
  });
}

/**
 * Run the Supabase liveness probe. Hits `henry_events` (a table that
 * exists in every environment that has V3-01 applied — every prod-like
 * environment we ship to). The query is keyed on the primary key column
 * and capped at one row to keep it cheap.
 */
async function probeSupabase(
  client: SupabaseClient,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SUPABASE_PROBE_TIMEOUT_MS);

  try {
    const { error } = await client
      .from("henry_events")
      .select("id", { count: "exact", head: true })
      .abortSignal(controller.signal)
      .limit(1);

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "supabase probe failed";
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Build the health-check response body. Caller decides the HTTP status
 * by inspecting `body.ok`.
 *
 * Apps can pass `extraRequiredEnv` if they want division-specific env
 * keys validated; pass `client` to inject a preconfigured Supabase
 * server client (recommended — saves the helper from rebuilding it
 * per request). When `client` is undefined we attempt to build one
 * from the standard env vars; if those are missing the env check
 * fails first and we never reach the supabase probe.
 */
export async function buildHealthResponse(opts: {
  /** Optional Supabase client. When omitted, one is built from env. */
  client?: SupabaseClient;
  /** Additional env-var names to require for this app. */
  extraRequiredEnv?: readonly string[];
} = {}): Promise<HealthCheckBody> {
  const checkedAt = new Date().toISOString();
  const version = process.env.VERCEL_GIT_COMMIT_SHA || null;
  const deploy = process.env.VERCEL_DEPLOYMENT_ID || null;

  const missingEnv = checkEnv(opts.extraRequiredEnv);
  const envOk = missingEnv.length === 0;

  // If env is broken we skip the supabase probe — there's nothing
  // sensible to connect to. The body still reports both check states
  // so the caller can see exactly which condition failed. The names of
  // the missing vars stay in server logs — never in the wire body.
  if (!envOk) {
    console.error("[health] env check failed — missing:", missingEnv.join(", "));
    return {
      ok: false,
      checks: { supabase: "fail", env: "fail" },
      version,
      deploy,
      checkedAt,
    };
  }

  const client =
    opts.client ??
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      // Use the service-role key for the health probe — RLS is irrelevant
      // for a count(*) head request on a table the service role owns.
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

  const probe = await probeSupabase(client);

  if (!probe.ok) {
    // Raw probe error text (provider wording, table names) stays in
    // server logs — the unauthenticated wire body only carries pass/fail.
    console.error("[health] supabase probe failed:", probe.error);
  }

  return {
    ok: probe.ok,
    checks: {
      supabase: probe.ok ? "ok" : "fail",
      env: "ok",
    },
    version,
    deploy,
    checkedAt,
  };
}

/**
 * HTTP status code to return alongside the body.
 *  - 200 when fully healthy.
 *  - 503 when any check failed.
 *
 * Helper exists so the route handler can stay one line.
 */
export function healthStatusCode(body: HealthCheckBody): 200 | 503 {
  return body.ok ? 200 : 503;
}
