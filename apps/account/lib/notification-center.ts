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
