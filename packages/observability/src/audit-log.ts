import "server-only";

import { logger } from "./logger";

/**
 * @henryco/observability/audit-log — Track C audit log writer.
 *
 * Wraps the SQL `public.add_audit_log_v2()` SECURITY DEFINER function.
 * Every state-changing Track C action MUST call this — V19 verification
 * gate ("Audit log on every state-changing action") fails if any
 * action lands without an audit_log row.
 *
 * The function is invoked via the caller's authenticated Supabase
 * client so `auth.uid()` resolves to the acting operator. Service-role
 * clients work too (the SECURITY DEFINER function reads auth.uid()
 * which is null for service-role; in that case actor_id will be NULL
 * which signals a system-level action).
 *
 * SHIPS WITH DASH-9.
 */

/**
 * Minimal Supabase client surface this helper needs. Accept any
 * client that exposes an `rpc()` method matching the supabase-js
 * shape — avoids hard-coupling @henryco/observability to a specific
 * supabase-js major.
 */
export type AuditLogSupabaseClient = {
  rpc: (
    name: "add_audit_log_v2",
    params: {
      p_action: string;
      p_entity_type: string;
      p_entity_id?: string | null;
      p_old_values?: unknown;
      p_new_values?: unknown;
      p_reason?: string | null;
      p_division?: string | null;
      p_correlation_id?: string | null;
    },
  ) => Promise<{ data: string | null; error: { message: string } | null }>;
};

/**
 * Input to writeAuditLog().
 */
export type AuditLogInput = {
  /** Stable action identifier — e.g. "staff.support.thread.assign". Use dot-separated path. */
  action: string;
  /** Entity type — e.g. "support_thread", "marketplace_order", "kyc_verification". */
  entityType: string;
  /** Entity id — UUID or string id. */
  entityId?: string | null;
  /** Optional snapshot of the entity before the action. */
  oldValues?: unknown;
  /** Optional snapshot of the entity after the action. */
  newValues?: unknown;
  /** Reason — required for sensitive actions (refund/suspend/ban/reverse-payout/release-payment). */
  reason?: string | null;
  /** Division attribution — e.g. "marketplace", "care". */
  division?: string | null;
  /** Bulk-operation correlation id — UUID. NULL for single-action writes. */
  correlationId?: string | null;
};

/**
 * Write a single audit_log row via add_audit_log_v2.
 *
 * Returns the new audit_log row id on success; null on failure (the
 * action proceeds — audit-log failure is logged but does NOT throw,
 * because blocking a state-change on an audit-log write would be a
 * worse failure mode than a missing audit row).
 *
 * The structured logger captures the failure — operators can spot
 * audit-log-write failures in the structured log stream without
 * crashing the action.
 */
export async function writeAuditLog(
  supabase: AuditLogSupabaseClient,
  input: AuditLogInput,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("add_audit_log_v2", {
      p_action: input.action,
      p_entity_type: input.entityType,
      p_entity_id: input.entityId ?? null,
      p_old_values: input.oldValues ?? null,
      p_new_values: input.newValues ?? null,
      p_reason: input.reason ?? null,
      p_division: input.division ?? null,
      p_correlation_id: input.correlationId ?? null,
    });
    if (error) {
      logger.warn("audit_log.write_failed", {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        error: error.message,
      });
      return null;
    }
    return data;
  } catch (e) {
    logger.warn("audit_log.write_threw", {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

/**
 * Write multiple audit_log rows under a shared correlation_id (bulk
 * operation grouping). Returns the correlation_id used.
 *
 * The caller may pass a pre-generated correlation_id (e.g. from a
 * server-side bulk-action handler that needs to thread the id back
 * to the response payload), or omit it to let this helper generate
 * one.
 *
 * This is the standard shape for BulkActionBar action handlers.
 */
export async function writeBulkAuditLog(
  supabase: AuditLogSupabaseClient,
  inputs: ReadonlyArray<AuditLogInput>,
  options?: { correlationId?: string },
): Promise<string> {
  const correlationId = options?.correlationId ?? crypto.randomUUID();
  await Promise.all(
    inputs.map((input) =>
      writeAuditLog(supabase, { ...input, correlationId }),
    ),
  );
  return correlationId;
}
