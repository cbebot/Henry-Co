import type { StaffPublishInput, StaffPublishResult } from "./staff-types";
import { validateStaffPublishInput } from "./staff-validate";
import { checkRate } from "./rate-limit";
import { resolveAdminClient } from "./supabase-admin";

// Server-only guard. publishStaffNotification performs service-role inserts;
// it must never be imported from client/browser code. Mirrors the customer
// publisher's posture without taking on a `server-only` workspace dep.
if (typeof window !== "undefined") {
  throw new Error("@henryco/notifications/staff-publish must only be imported from server code");
}

/**
 * Compose the rate-limit bucket key. Direct-user targeting limits per
 * (recipient_user_id, event_type); broadcast targeting limits per
 * (broadcast scope, event_type) so one misbehaving caller cannot flood a
 * role/division audience even if rotating through scope variants.
 */
function rateBucketKey(input: {
  userId: string | null;
  role: string | null;
  division: string | null;
}): string {
  if (input.userId) return `staff:user:${input.userId}`;
  return `staff:broadcast:${input.division || "*"}:${input.role || "*"}`;
}

async function writeAuditLog(params: {
  recipientUserId: string | null;
  recipientRole: string | null;
  recipientDivision: string | null;
  notificationId: string | null;
  division: string;
  eventType: string;
  publisher: string;
  actorUserId: string | null;
  requestId: string | null;
  status: "sent" | "rate_limited" | "validation_error" | "persistence_error";
  errorCode?: string;
  errorMessage?: string;
}): Promise<void> {
  const resolved = resolveAdminClient();
  if (!resolved.ok) return;
  const { client } = resolved;

  // notification_delivery_log.user_id is NOT NULL with FK to auth.users.
  // For broadcasts (no recipient_user_id), there's no single authoritative
  // user to attribute the delivery audit to. We use the actor_user_id
  // when present; otherwise omit the audit log entry rather than fake a
  // user reference. The staff_notifications row itself is the canonical
  // record; the delivery log is supplementary.
  const auditUserId = params.recipientUserId || params.actorUserId;
  if (!auditUserId) return;

  const { error } = await client.from("notification_delivery_log").insert({
    user_id: auditUserId,
    notification_id: null, // staff_notifications has no FK from delivery_log; pin via metadata
    channel: "in_app_staff",
    provider: "shim",
    status: params.status,
    division: params.division,
    event_name: params.eventType,
    publisher: params.publisher,
    actor_user_id: params.actorUserId,
    request_id: params.requestId,
    error_code: params.errorCode ?? null,
    error_message: params.errorMessage ?? null,
    metadata: {
      audience: "staff",
      staff_notification_id: params.notificationId,
      recipient_role: params.recipientRole,
      recipient_division: params.recipientDivision,
    },
  } as never);

  if (error && process.env.NODE_ENV !== "production") {
    console.warn("[notifications/staff] audit-log insert failed", error.message);
  }
}

export async function publishStaffNotification(
  input: StaffPublishInput,
): Promise<StaffPublishResult> {
  const validation = validateStaffPublishInput(input);
  if ("code" in validation) {
    return { ok: false, error: "validation", detail: validation.field };
  }

  const resolved = resolveAdminClient();
  if (!resolved.ok) {
    return { ok: false, error: "missing_env" };
  }
  const { client } = resolved;

  const bucketKey = rateBucketKey(validation.recipient);
  const rate = checkRate(bucketKey, validation.eventType);
  if (!rate.allowed) {
    await writeAuditLog({
      recipientUserId: validation.recipient.userId,
      recipientRole: validation.recipient.role,
      recipientDivision: validation.recipient.division,
      notificationId: null,
      division: validation.division,
      eventType: validation.eventType,
      publisher: validation.publisher,
      actorUserId: validation.actorUserId,
      requestId: validation.requestId,
      status: "rate_limited",
      errorCode: rate.reason,
    });
    return { ok: false, error: "rate_limited", detail: rate.reason };
  }

  const insertRow = {
    recipient_user_id: validation.recipient.userId,
    recipient_role: validation.recipient.role,
    recipient_division: validation.recipient.division,
    division: validation.division,
    category: validation.eventType,
    priority: validation.severity,
    title: validation.title,
    body: validation.body,
    action_url: validation.deepLink,
    action_label: validation.actionLabel,
    detail_payload: validation.payload ?? {},
    reference_id: validation.relatedId,
    reference_type: validation.relatedType,
    actor_user_id: validation.actorUserId,
    publisher: validation.publisher,
    request_id: validation.requestId,
    metadata: {},
  };

  const { data: inserted, error: insertError } = await client
    .from("staff_notifications")
    .insert(insertRow as never)
    .select("id")
    .single();

  if (insertError || !inserted) {
    await writeAuditLog({
      recipientUserId: validation.recipient.userId,
      recipientRole: validation.recipient.role,
      recipientDivision: validation.recipient.division,
      notificationId: null,
      division: validation.division,
      eventType: validation.eventType,
      publisher: validation.publisher,
      actorUserId: validation.actorUserId,
      requestId: validation.requestId,
      status: "persistence_error",
      errorCode: insertError?.code ?? "unknown",
      errorMessage: insertError?.message ?? "insert returned no row",
    });
    return { ok: false, error: "persistence" };
  }

  const insertedId = (inserted as { id: string }).id;

  await writeAuditLog({
    recipientUserId: validation.recipient.userId,
    recipientRole: validation.recipient.role,
    recipientDivision: validation.recipient.division,
    notificationId: insertedId,
    division: validation.division,
    eventType: validation.eventType,
    publisher: validation.publisher,
    actorUserId: validation.actorUserId,
    requestId: validation.requestId,
    status: "sent",
  });

  return { ok: true, id: insertedId };
}
