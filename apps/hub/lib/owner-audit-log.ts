import "server-only";

import {
  writeAuditLog,
  writeBulkAuditLog,
  type AuditLogInput,
  type AuditLogSupabaseClient,
} from "@henryco/observability/audit-log";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * Track B / DASH-8 G8 — owner audit-log writer.
 *
 * Thin owner-specific wrapper around `@henryco/observability/audit-log`.
 * Every Track B mutation handler MUST go through this — V8/V14 gates
 * fail if any owner state-change lands without an audit_log row.
 *
 * Single-action vs bulk:
 *   - `writeOwnerAudit(input)` — for single-row mutations (one
 *     audit_log row, no correlationId).
 *   - `writeOwnerBulkAudit(inputs)` — for bulk operations like
 *     "approve 12 invoices". Emits one audit_log row per input
 *     sharing a single bulk correlation id, returned to the caller
 *     so it can surface the id in the UI for the operator (and so
 *     the V14 probe can group rows by correlation_id).
 *
 * Convention: action names use dot-separated paths under the owner.*
 * namespace — e.g. `owner.finance.invoice.mark-paid`,
 * `owner.staff.suspend`, `owner.operations.approval.approve`.
 *
 * Reason capture: actions marked `requiresReason` in the module's
 * `getBulkActions()` MUST pass `reason` through. The audit_log row
 * preserves the reason for compliance and post-hoc review.
 */
export async function writeOwnerAudit(input: AuditLogInput): Promise<string | null> {
  const admin = createAdminSupabase() as unknown as AuditLogSupabaseClient;
  return writeAuditLog(admin, input);
}

/**
 * Bulk variant — writes one audit_log row per input under a single
 * bulk correlation id. Used by the BulkActionBar action handlers.
 *
 * Returns the correlation id, which V14 verification probes by:
 *   `SELECT count(*), bulk_correlation_id FROM audit_log
 *      WHERE bulk_correlation_id = $1 GROUP BY bulk_correlation_id;`
 *
 * Expected result: count = inputs.length, single row.
 */
export async function writeOwnerBulkAudit(
  inputs: ReadonlyArray<AuditLogInput>,
  options?: { correlationId?: string },
): Promise<string> {
  const admin = createAdminSupabase() as unknown as AuditLogSupabaseClient;
  return writeBulkAuditLog(admin, inputs, options);
}
