import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import { getDivisionBrand } from "@/lib/branding";

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableText(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function toComparablePath(url: URL) {
  return `${url.pathname}${url.search}${url.hash}`;
}

function isInternalOnlyDestination(url: URL) {
  const host = url.hostname.toLowerCase();
  const path = url.pathname.toLowerCase();

  return (
    host.startsWith("hq.") ||
    host.startsWith("workspace.") ||
    host.startsWith("staffhq.") ||
    path.startsWith("/owner") ||
    path.startsWith("/workspace")
  );
}

export function notificationMessageHref(notificationId: string) {
  return `/messages/notification/${encodeURIComponent(notificationId)}`;
}

export function activityMessageHref(activityId: string) {
  return `/messages/activity/${encodeURIComponent(activityId)}`;
}

export function securityMessageHref(eventId: string) {
  return `/messages/security/${encodeURIComponent(eventId)}`;
}

export function isHiddenNotification(row: Record<string, unknown>) {
  const priority = asText(row.priority).toLowerCase();
  return Boolean(
    asNullableText(row.archived_at) ||
      asNullableText(row.deleted_at) ||
      priority === "archived" ||
      priority === "deleted"
  );
}

export async function resolveSafeActionUrl(
  actionUrl: unknown,
  divisionKey?: string | null,
  fallback?: string | null
) {
  const brand = await getDivisionBrand(divisionKey);
  const safeFallback = fallback || brand.primaryUrl || "/notifications";
  const clean = asNullableText(actionUrl);

  if (!clean) {
    return safeFallback;
  }

  try {
    const parsed = /^https?:\/\//i.test(clean)
      ? new URL(clean)
      : new URL(clean, "https://account.henryco.local");

    if (isInternalOnlyDestination(parsed)) {
      return safeFallback;
    }

    return /^https?:\/\//i.test(clean) ? parsed.toString() : toComparablePath(parsed);
  } catch {
    return safeFallback;
  }
}

async function updateNotificationWithFallback(
  notificationId: string,
  userId: string,
  payloads: Array<Record<string, unknown>>
) {
  const admin = createAdminSupabase();

  for (const payload of payloads) {
    const { error } = await admin
      .from("customer_notifications")
      .update(payload)
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (!error) {
      return null;
    }
  }

  return "Notification update could not be completed.";
}

export async function restoreNotification(input: {
  notificationId: string;
  userId: string;
}) {
  const admin = createAdminSupabase();
  const { data: existing, error } = await admin
    .from("customer_notifications")
    .select("id, deleted_at, archived_at, division, title, reference_id")
    .eq("id", input.notificationId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (error) {
    return { ok: false as const, status: 500, error: error.message };
  }
  if (!existing) {
    return { ok: false as const, status: 404, error: "Notification not found." };
  }

  const row = existing as Record<string, unknown>;
  if (!asNullableText(row.deleted_at)) {
    // Idempotent restore — if already not deleted, nothing to do.
    return { ok: true as const };
  }

  // Restore by clearing deleted_at. Leave archived_at intact: an archived-then-
  // deleted notification returns to archived state when restored, mirroring
  // the iOS Mail mental model. is_read is also preserved.
  const { error: updateError } = await admin
    .from("customer_notifications")
    .update({ deleted_at: null })
    .eq("id", input.notificationId)
    .eq("user_id", input.userId);

  if (updateError) {
    return { ok: false as const, status: 500, error: updateError.message };
  }

  await admin.from("customer_activity").insert({
    user_id: input.userId,
    division: asNullableText(row.division) || "account",
    activity_type: "notification_restore",
    title: "Notification restored",
    description: asNullableText(row.title) || "Notification restored from recently-deleted.",
    status: "restored",
    reference_type: "customer_notification",
    reference_id: asNullableText(row.reference_id) || asText(row.id),
    action_url: notificationMessageHref(asText(row.id)),
    metadata: {
      notificationId: asText(row.id),
      lifecycleAction: "restore",
      updatedAt: new Date().toISOString(),
    },
  } as never);

  return { ok: true as const };
}

export async function purgeNotification(input: {
  notificationId: string;
  userId: string;
}) {
  const admin = createAdminSupabase();
  const { data: existing, error } = await admin
    .from("customer_notifications")
    .select("id, deleted_at, division, title, reference_id, category")
    .eq("id", input.notificationId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (error) {
    return { ok: false as const, status: 500, error: error.message };
  }
  if (!existing) {
    return { ok: false as const, status: 404, error: "Notification not found." };
  }

  const row = existing as Record<string, unknown>;

  // Purge is only available on already-soft-deleted rows. Front-end never
  // exposes this on the main inbox; defense-in-depth guard so a forged
  // request cannot bypass the recently-deleted UX.
  if (!asNullableText(row.deleted_at)) {
    return {
      ok: false as const,
      status: 409,
      error: "Move this notification to recently-deleted before permanent removal.",
    };
  }

  const { error: deleteError } = await admin
    .from("customer_notifications")
    .delete()
    .eq("id", input.notificationId)
    .eq("user_id", input.userId);

  if (deleteError) {
    return { ok: false as const, status: 500, error: deleteError.message };
  }

  // Audit-log the hard-delete via notification_delivery_log. The row id is
  // captured in metadata since the FK target no longer exists.
  await admin.from("notification_delivery_log").insert({
    user_id: input.userId,
    notification_id: null,
    channel: "audit",
    provider: "user_action",
    status: "purged",
    division: asNullableText(row.division) || "account",
    event_name: asNullableText(row.category) || "notification.purge",
    publisher: "user:account/notifications/recently-deleted",
    purged_at: new Date().toISOString(),
    metadata: {
      audience: "customer",
      purged_table: "customer_notifications",
      purged_id: input.notificationId,
      trigger: "user_action",
    },
  } as never);

  return { ok: true as const };
}

export async function updateNotificationLifecycle(input: {
  notificationId: string;
  userId: string;
  action: "read" | "unread" | "archive" | "delete";
}) {
  const admin = createAdminSupabase();
  const { data: existing, error } = await admin
    .from("customer_notifications")
    .select("*")
    .eq("id", input.notificationId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (error) {
    return { ok: false as const, status: 500, error: error.message };
  }

  if (!existing || isHiddenNotification(existing as Record<string, unknown>)) {
    return { ok: false as const, status: 404, error: "Notification not found." };
  }

  const now = new Date().toISOString();

  if (input.action === "delete") {
    const softDeleteError = await updateNotificationWithFallback(input.notificationId, input.userId, [
      { deleted_at: now },
      { priority: "deleted", is_read: true },
    ]);

    if (!softDeleteError) {
      return { ok: true as const };
    }

    const { error: deleteError } = await admin
      .from("customer_notifications")
      .delete()
      .eq("id", input.notificationId)
      .eq("user_id", input.userId);

    return deleteError
      ? { ok: false as const, status: 500, error: deleteError.message }
      : { ok: true as const };
  }

  const payloads =
    input.action === "read"
      ? [{ is_read: true, read_at: now }, { is_read: true }]
      : input.action === "unread"
        ? [{ is_read: false, read_at: null }, { is_read: false }]
        : [
            { archived_at: now, is_read: true, read_at: now },
            { priority: "archived", is_read: true },
          ];

  const updateError = await updateNotificationWithFallback(
    input.notificationId,
    input.userId,
    payloads
  );

  if (updateError) {
    return { ok: false as const, status: 500, error: updateError };
  }

  const row = existing as Record<string, unknown>;
  const metadata = asObject(row.metadata);
  const referenceId = asNullableText(row.reference_id);

  await admin.from("customer_activity").insert({
    user_id: input.userId,
    division: asNullableText(row.division) || "account",
    activity_type: `notification_${input.action}`,
    title:
      input.action === "archive"
        ? "Notification archived"
        : input.action === "unread"
          ? "Notification marked unread"
          : "Notification updated",
    description: asNullableText(row.title) || "Notification lifecycle updated.",
    status: input.action,
    reference_type: "customer_notification",
    reference_id: referenceId || asText(row.id),
    action_url: notificationMessageHref(asText(row.id)),
    metadata: {
      ...metadata,
      notificationId: asText(row.id),
      lifecycleAction: input.action,
      updatedAt: now,
    },
  } as never);

  return { ok: true as const };
}
