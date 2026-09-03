import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "./logger";

/**
 * persistEvent — best-effort dual-write of a HenryCo telemetry event
 * into the `henry_events` table (added by V3-01 slice 5b migration).
 *
 * The pairing with `emitEvent`:
 *   - `emitEvent`  → pino structured log + Sentry breadcrumb (durable
 *     for ops grep + Sentry timeline)
 *   - `persistEvent` → henry_events row (queryable for owner-facing
 *     tiles + retrospective analytics)
 *
 * Both are best-effort and silent on failure: telemetry persistence
 * must NEVER break the auth path. RLS denials, network blips, or a
 * missing table in a preview branch are all swallowed.
 *
 * The two writers share canonical event names — a downstream join
 * (e.g., Sentry breadcrumb timestamp + henry_events row id) is
 * trivial because the `name` field is identical.
 */
export type PersistEventInput = {
  /** Request-scoped or admin Supabase client. */
  supabase: SupabaseClient;
  /** Canonical event name — same string passed to `emitEvent`. */
  name: string;
  /**
   * The acting user's id when known. Required RLS predicate: writer
   * must match `auth.uid()` OR pass null for anonymous system events.
   * The migration enforces this in `henry_events_insert_own`.
   */
  actorId?: string | null;
  /** Optional payload. Stored as JSONB. Keep small + structured. */
  payload?: Record<string, unknown> | null;
};

export async function persistEvent(input: PersistEventInput): Promise<void> {
  try {
    const { error } = await input.supabase.from("henry_events").insert({
      name: input.name,
      actor_id: input.actorId ?? null,
      payload: input.payload ?? null,
    });
    if (error) {
      // Most likely cause: RLS rejection (actor mismatch) or table
      // absence in a preview branch. Log at debug so it doesn't
      // pollute prod stdout but is grep-able in dev.
      logger
        .child({ event: input.name })
        .debug(`persistEvent rejected: ${error.code ?? "unknown"}`, {
          code: error.code,
          message: error.message,
        });
    }
  } catch (err) {
    logger.child({ event: input.name }).debug("persistEvent threw", {
      err: err instanceof Error ? err.message : String(err),
    });
  }
}
