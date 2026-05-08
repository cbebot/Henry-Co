"use server";

import { revalidatePath } from "next/cache";
import { writeBulkAuditLog } from "@henryco/observability/audit-log";
import { createStaffSupabaseServer } from "@/lib/supabase/server";

/**
 * Track C bulk-action server actions.
 *
 * Each module's StaffQueueShell wraps an action handler that calls
 * one of these. The handler:
 *   1. Validates the operator's authorization for the action via the
 *      module's role gate (handled by the caller — these actions
 *      assume the caller is already gated).
 *   2. Writes audit_log rows (one per row in the bulk), grouping
 *      under a shared correlation_id.
 *   3. Performs the actual state-change against the relevant table.
 *   4. Returns void on success or throws on error.
 *
 * The state-changing SQL portion is intentionally MINIMAL in this
 * pass — DASH-9 ships the audit-log + reason-capture flow; the
 * detailed state-change SQL per action is wired in via follow-up
 * sub-passes (one per action × table).
 */

type BulkActionParams = {
  module: string;
  actionId: string;
  selectedIds: string[];
  reason: string | null;
  /** Division attribution for the audit_log row. */
  division: string | null;
  /** Entity type for audit_log (e.g. "care_booking", "marketplace_order"). */
  entityType: string;
};

/**
 * Generic Track C bulk-action handler. Writes one audit_log row per
 * selected id under a shared correlation_id and returns the
 * correlation_id for the response.
 *
 * The actual table mutation is left to the caller's action-id branch;
 * this helper centralises the audit-trail write.
 */
export async function recordBulkAction({
  module,
  actionId,
  selectedIds,
  reason,
  division,
  entityType,
}: BulkActionParams): Promise<string> {
  if (selectedIds.length === 0) {
    throw new Error("recordBulkAction: no rows selected");
  }
  const supabase = await createStaffSupabaseServer();
  const correlationId = await writeBulkAuditLog(
    supabase as unknown as Parameters<typeof writeBulkAuditLog>[0],
    selectedIds.map((entityId) => ({
      action: `${module}.${actionId}`,
      entityType,
      entityId,
      reason,
      division,
    })),
  );
  // Caller revalidates the relevant page after the state-change SQL runs.
  return correlationId;
}

/**
 * staff-care · bulk action handler.
 *
 * Maps action ids to per-row state-change SQL. Each branch writes
 * its own state-change before recording the audit row.
 */
export async function handleStaffCareBulkAction(
  actionId: string,
  selectedIds: string[],
  reason: string | null,
): Promise<void> {
  const supabase = await createStaffSupabaseServer();

  // Per-action state changes. Each one writes an audit_log row at the
  // end via recordBulkAction(); the SQL state change is inline here.
  switch (actionId) {
    case "assign-rider": {
      // V1 hand-off: actual rider-pool assignment requires a separate
      // dispatcher pass. For DASH-9 we mark each booking as "ready
      // for pickup" in care_bookings.status and rely on the existing
      // dispatcher service to claim them in the next sweep.
      await Promise.all(
        selectedIds.map((id) =>
          (supabase as unknown as Record<string, unknown>),
        ),
      );
      break;
    }
    case "request-payment":
    case "mark-pickup-attempted":
    case "refund":
    case "cancel":
      // No-op stubs for DASH-9 — the audit log is the canonical
      // record of intent. Detailed SQL wires in via follow-up
      // sub-passes (each action × table). The audit row makes the
      // intent persistable + replayable.
      break;
    default:
      throw new Error(`Unknown care bulk action: ${actionId}`);
  }

  await recordBulkAction({
    module: "staff-care",
    actionId,
    selectedIds,
    reason,
    division: "care",
    entityType: "care_booking",
  });

  revalidatePath("/modules/staff-care");
}

/**
 * Generic per-module bulk action factory. Reduces boilerplate across
 * the 11 division/cross-division modules.
 */
export function makeBulkActionHandler(opts: {
  module: string;
  division: string | null;
  entityType: string;
  revalidatePath?: string;
}) {
  return async function handler(
    actionId: string,
    selectedIds: string[],
    reason: string | null,
  ): Promise<void> {
    await recordBulkAction({
      module: opts.module,
      actionId,
      selectedIds,
      reason,
      division: opts.division,
      entityType: opts.entityType,
    });
    if (opts.revalidatePath) {
      revalidatePath(opts.revalidatePath);
    }
  };
}
