import "server-only";

import { writeAuditLog } from "@henryco/observability/audit-log";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3-57 — audit a business roster/context mutation.
 *
 * `add_audit_log_v2` is gated to staff/service-role and a service-role call has
 * auth.uid() = null, so actor_id records as system-level. To keep the human +
 * business actor unambiguous (the spec requirement), both ids are encoded in the
 * audit payload (newValues.actorUserId + entityId/businessId). Fire-and-forget:
 * writeAuditLog never throws and returns null on failure — call after the state
 * change succeeds; never gate the mutation on it.
 */
export async function auditBusinessAction(input: {
  action: string;
  businessId: string;
  actorUserId: string;
  targetUserId?: string | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = createAdminSupabase() as unknown as Parameters<typeof writeAuditLog>[0];
    await writeAuditLog(admin, {
      action: input.action,
      entityType: "business",
      entityId: input.businessId,
      division: "account",
      newValues: {
        businessId: input.businessId,
        actorUserId: input.actorUserId,
        ...(input.targetUserId ? { targetUserId: input.targetUserId } : {}),
        ...(input.details ?? {}),
      },
    });
  } catch {
    // audit is best-effort; never block the mutation on it
  }
}
