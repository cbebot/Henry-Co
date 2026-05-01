import type { Division, PublishInput, PublishResult } from "./types";
import { validatePublishInput } from "./validate";
import { checkRate } from "./rate-limit";
import { resolveAdminClient } from "./supabase-admin";

// Guard: this module performs service-role inserts and must never be imported
// from client/browser code. Mirrors the `server-only` package's behavior
// without adding a workspace dep. Evaluated at module load.
if (typeof window !== "undefined") {
  throw new Error("@henryco/notifications/publish must only be imported from server code");
}

const LEGACY_DIVISION_BOOLEAN_COLUMN: Partial<Record<Division, string>> = {
  jobs: "notification_jobs",
  learn: "notification_learn",
  property: "notification_property",
  logistics: "notification_logistics",
};

type PreferencesShape = {
  muted_divisions?: string[] | null;
  muted_event_types?: string[] | null;
  notification_jobs?: boolean | null;
  notification_learn?: boolean | null;
  notification_property?: boolean | null;
  notification_logistics?: boolean | null;
};

function isMutedByPreferences(
  prefs: PreferencesShape | null,
  division: Division,
  eventType: string,
): boolean {
  if (!prefs) return false;

  const mutedDivisions = Array.isArray(prefs.muted_divisions) ? prefs.muted_divisions : [];
  if (mutedDivisions.includes(division)) return true;

  const mutedEvents = Array.isArray(prefs.muted_event_types) ? prefs.muted_event_types : [];
  if (mutedEvents.includes(eventType)) return true;

  const legacyColumn = LEGACY_DIVISION_BOOLEAN_COLUMN[division];
  if (legacyColumn) {
    const legacyValue = (prefs as Record<string, unknown>)[legacyColumn];
    if (legacyValue === false) return true;
  }

  return false;
}

async function writeAuditLog(params: {
  userId: string;
  notificationId: string | null;
  division: Division;
  eventType: string;
  publisher: string;
  actorUserId: string | null;
  requestId: string | null;
  status: "sent" | "rate_limited" | "validation_error" | "persistence_error";
  errorCode?: string;
  errorMessage?: string;
}): Promise<void> {
  const resolved = resolveAdminClient();
  if (!resolved.ok) return; // env missing — best-effort only.
  const { client } = resolved;
  const { error } = await client.from("notification_delivery_log").insert({
    user_id: params.userId,
    notification_id: params.notificationId,
    channel: "in_app",
    provider: "shim",
    status: params.status,
    division: params.division,
    event_name: params.eventType,
    publisher: params.publisher,
    actor_user_id: params.actorUserId,
    request_id: params.requestId,
    error_code: params.errorCode ?? null,
    error_message: params.errorMessage ?? null,
    metadata: {},
  } as never);

  if (error && process.env.NODE_ENV !== "production") {
    // Surface only in non-production to avoid leaking schema hints in prod logs.
    console.warn("[notifications] audit-log insert failed", error.message);
  }
}

export async function publishNotification(input: PublishInput): Promise<PublishResult> {
  const validation = validatePublishInput(input);
  if ("code" in validation) {
    return { ok: false, error: "validation", detail: validation.field };
  }

  const resolved = resolveAdminClient();
  if (!resolved.ok) {
    return { ok: false, error: "missing_env" };
  }
  const { client } = resolved;

  const rate = checkRate(validation.userId, validation.eventType);
  if (!rate.allowed) {
    await writeAuditLog({
      userId: validation.userId,
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

  const { data: prefsRow } = await client
    .from("customer_preferences")
    .select(
      "muted_divisions, muted_event_types, notification_jobs, notification_learn, notification_property, notification_logistics",
    )
    .eq("user_id", validation.userId)
    .maybeSingle();

  const muted = isMutedByPreferences(
    prefsRow as PreferencesShape | null,
    validation.division,
    validation.eventType,
  );

  const insertRow = {
    user_id: validation.userId,
    division: validation.division,
    category: validation.eventType,
    priority: validation.severity,
    title: validation.title,
    body: validation.body,
    action_url: validation.deepLink,
    detail_payload: validation.payload ?? {},
    reference_id: validation.relatedId,
    reference_type: validation.relatedType,
    actor_user_id: validation.actorUserId,
    publisher: validation.publisher,
    request_id: validation.requestId,
    is_read: false,
    metadata: muted ? { suppress_toast: true, suppress_sound: true } : {},
  };

  const { data: inserted, error: insertError } = await client
    .from("customer_notifications")
    .insert(insertRow as never)
    .select("id")
    .single();

  if (insertError || !inserted) {
    await writeAuditLog({
      userId: validation.userId,
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
    userId: validation.userId,
    notificationId: insertedId,
    division: validation.division,
    eventType: validation.eventType,
    publisher: validation.publisher,
    actorUserId: validation.actorUserId,
    requestId: validation.requestId,
    status: "sent",
  });

  return { ok: true, id: insertedId, muted };
}
