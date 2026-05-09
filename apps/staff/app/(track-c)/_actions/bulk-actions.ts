"use server";

import { revalidatePath } from "next/cache";
import { writeBulkAuditLog } from "@henryco/observability/audit-log";
import { createStaffSupabaseServer } from "@/lib/supabase/server";

/**
 * Track C bulk-action server actions.
 *
 * Each module's StaffQueueShell wraps an action handler that calls
 * one of these per-module functions. The handler:
 *   1. Validates the operator's authorization (the caller is already
 *      gated by the module role gate at layout time).
 *   2. Writes audit_log rows (one per row in the bulk), grouping under
 *      a shared correlation_id.
 *   3. Performs any inline state-change against the relevant table.
 *   4. Returns void on success or throws on error.
 *
 * The state-changing SQL portion is intentionally MINIMAL in this pass.
 * DASH-9 ships the audit-log + reason-capture flow; per-action × table
 * SQL state-changes wire in via follow-up sub-passes. The audit row is
 * the canonical record of intent.
 *
 * NOTE: every export from this file is async, per the Next.js
 * "use server" file-level requirement. Helper factories (sync) live
 * in `bulk-action-handlers.ts` (no "use server").
 */

type BulkActionMeta = {
  module: string;
  actionId: string;
  selectedIds: string[];
  reason: string | null;
  division: string | null;
  entityType: string;
};

async function recordBulkAction(meta: BulkActionMeta): Promise<string> {
  if (meta.selectedIds.length === 0) {
    throw new Error("recordBulkAction: no rows selected");
  }
  const supabase = await createStaffSupabaseServer();
  return writeBulkAuditLog(
    supabase as unknown as Parameters<typeof writeBulkAuditLog>[0],
    meta.selectedIds.map((entityId) => ({
      action: `${meta.module}.${meta.actionId}`,
      entityType: meta.entityType,
      entityId,
      reason: meta.reason,
      division: meta.division,
    })),
  );
}

/**
 * staff-care bulk-action server action.
 *
 * Per-action branches: assign-rider, request-payment, mark-pickup-attempted,
 * refund, cancel. Each is currently a no-op SQL stub — the audit log
 * row is canonical for DASH-9.
 */
export async function handleStaffCareBulkAction(
  actionId: string,
  selectedIds: string[],
  reason: string | null,
): Promise<void> {
  switch (actionId) {
    case "assign-rider":
    case "request-payment":
    case "mark-pickup-attempted":
    case "refund":
    case "cancel":
      // No-op SQL stub for DASH-9. The dispatcher / payment / refund
      // services claim each booking referenced by the audit_log row.
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

export async function handleStaffMarketplaceBulkAction(
  actionId: string,
  selectedIds: string[],
  reason: string | null,
): Promise<void> {
  await recordBulkAction({
    module: "staff-marketplace",
    actionId,
    selectedIds,
    reason,
    division: "marketplace",
    entityType: "marketplace_order",
  });
  revalidatePath("/modules/staff-marketplace");
}

export async function handleStaffPropertyBulkAction(
  actionId: string,
  selectedIds: string[],
  reason: string | null,
): Promise<void> {
  await recordBulkAction({
    module: "staff-property",
    actionId,
    selectedIds,
    reason,
    division: "property",
    entityType: "property_listing",
  });
  revalidatePath("/modules/staff-property");
}

export async function handleStaffStudioBulkAction(
  actionId: string,
  selectedIds: string[],
  reason: string | null,
): Promise<void> {
  await recordBulkAction({
    module: "staff-studio",
    actionId,
    selectedIds,
    reason,
    division: "studio",
    entityType: "studio_project",
  });
  revalidatePath("/modules/staff-studio");
}

export async function handleStaffJobsBulkAction(
  actionId: string,
  selectedIds: string[],
  reason: string | null,
): Promise<void> {
  await recordBulkAction({
    module: "staff-jobs",
    actionId,
    selectedIds,
    reason,
    division: "jobs",
    entityType: "jobs_application",
  });
  revalidatePath("/modules/staff-jobs");
}

export async function handleStaffLearnBulkAction(
  actionId: string,
  selectedIds: string[],
  reason: string | null,
): Promise<void> {
  await recordBulkAction({
    module: "staff-learn",
    actionId,
    selectedIds,
    reason,
    division: "learn",
    entityType: "learn_course",
  });
  revalidatePath("/modules/staff-learn");
}

export async function handleStaffLogisticsBulkAction(
  actionId: string,
  selectedIds: string[],
  reason: string | null,
): Promise<void> {
  await recordBulkAction({
    module: "staff-logistics",
    actionId,
    selectedIds,
    reason,
    division: "logistics",
    entityType: "logistics_shipment",
  });
  revalidatePath("/modules/staff-logistics");
}

export async function handleStaffSupportBulkAction(
  actionId: string,
  selectedIds: string[],
  reason: string | null,
): Promise<void> {
  await recordBulkAction({
    module: "staff-support",
    actionId,
    selectedIds,
    reason,
    division: null,
    entityType: "support_thread",
  });
  revalidatePath("/modules/staff-support");
}

export async function handleStaffModerationBulkAction(
  actionId: string,
  selectedIds: string[],
  reason: string | null,
): Promise<void> {
  await recordBulkAction({
    module: "staff-moderation",
    actionId,
    selectedIds,
    reason,
    division: null,
    entityType: "moderation_case",
  });
  revalidatePath("/modules/staff-moderation");
}

export async function handleStaffFinanceOperatorBulkAction(
  actionId: string,
  selectedIds: string[],
  reason: string | null,
): Promise<void> {
  await recordBulkAction({
    module: "staff-finance-operator",
    actionId,
    selectedIds,
    reason,
    division: "marketplace",
    entityType: "payout_request",
  });
  revalidatePath("/modules/staff-finance-operator");
}
