import "server-only";

import type { AppLocale } from "@henryco/i18n";
import { getDivisionBrand } from "@/lib/branding";
import { createAdminSupabase } from "@/lib/supabase";
import {
  activityMessageHref,
  isHiddenNotification,
  notificationMessageHref,
  resolveSafeActionUrl,
} from "@/lib/notification-center";
import { resolveNotificationPresentation } from "@/lib/notification-localization";
import { buildSecurityEventView } from "@/lib/security-events";

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

function resolveNotificationKey(row: Record<string, unknown>) {
  return (
    asNullableText(row.division) ||
    asNullableText(row.category) ||
    (asText(row.reference_type).startsWith("wallet_") ? "wallet" : null) ||
    "general"
  );
}

function buildTone(status?: string | null): MessageHistoryItem["tone"] {
  const value = asText(status).toLowerCase();
  if (value === "completed" || value === "verified" || value === "paid") return "good";
  if (value === "unread" || value === "pending" || value === "reviewing") return "warn";
  if (value === "rejected" || value === "failed" || value === "suspicious") return "danger";
  return "neutral";
}

export type MessageHistoryItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  href: string;
  tone: "good" | "warn" | "danger" | "neutral";
  kind: "notification" | "activity" | "security";
};

function localizeNotificationRow(row: Record<string, unknown>, locale?: AppLocale) {
  if (!locale) return row;
  const localized = resolveNotificationPresentation({ row, locale });
  return {
    ...row,
    title: localized.title,
    body: localized.body,
  };
}

async function buildRelatedHistory(
  userId: string,
  row: Record<string, unknown>,
  excludeId: string,
  locale?: AppLocale,
): Promise<MessageHistoryItem[]> {
  const admin = createAdminSupabase();
  const referenceType = asNullableText(row.reference_type);
  const referenceId = asNullableText(row.reference_id);
  const division = asNullableText(row.division);

  const [notificationsRes, activityRes] = await Promise.all([
    referenceType && referenceId
      ? admin
          .from("customer_notifications")
          .select("*")
          .eq("user_id", userId)
          .eq("reference_type", referenceType)
          .eq("reference_id", referenceId)
          .order("created_at", { ascending: false })
          .limit(6)
      : division
        ? admin
            .from("customer_notifications")
            .select("*")
            .eq("user_id", userId)
            .eq("division", division)
            .order("created_at", { ascending: false })
            .limit(6)
        : Promise.resolve({ data: [] }),
    referenceType && referenceId
      ? admin
          .from("customer_activity")
          .select("*")
          .eq("user_id", userId)
          .eq("reference_type", referenceType)
          .eq("reference_id", referenceId)
          .order("created_at", { ascending: false })
          .limit(6)
      : division
        ? admin
            .from("customer_activity")
            .select("*")
            .eq("user_id", userId)
            .eq("division", division)
            .order("created_at", { ascending: false })
            .limit(6)
        : Promise.resolve({ data: [] }),
  ]);

  return [
    ...((notificationsRes.data ?? []) as Array<Record<string, unknown>>)
      .filter((item) => !isHiddenNotification(item) && asText(item.id) !== excludeId)
      .map((item) => localizeNotificationRow(item, locale))
      .map((item) => ({
        id: asText(item.id),
        title: asText(item.title, "Notification"),
        body: asText(item.body),
        createdAt: asText(item.created_at),
        href: notificationMessageHref(asText(item.id)),
        tone: !item.is_read ? ("warn" as const) : ("neutral" as const),
        kind: "notification" as const,
      })),
    ...((activityRes.data ?? []) as Array<Record<string, unknown>>)
      .filter((item) => asText(item.id) !== excludeId)
      .map((item) => ({
        id: asText(item.id),
        title: asText(item.title, "Activity"),
        body: asText(item.description),
        createdAt: asText(item.created_at),
        href: activityMessageHref(asText(item.id)),
        tone: buildTone(asNullableText(item.status)),
        kind: "activity" as const,
      })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);
}

export async function getNotificationMessageBoard(
  userId: string,
  notificationId: string,
  locale?: AppLocale,
) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("customer_notifications")
    .select("*")
    .eq("id", notificationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data || isHiddenNotification(data as Record<string, unknown>)) {
    return null;
  }

  const row = localizeNotificationRow(data as Record<string, unknown>, locale);
  const source = await getDivisionBrand(resolveNotificationKey(row));
  const history = await buildRelatedHistory(userId, row, asText(row.id), locale);

  return {
    source,
    record: {
      id: asText(row.id),
      title: asText(row.title, "Notification"),
      body: asText(row.body),
      createdAt: asText(row.created_at),
      isRead: Boolean(row.is_read),
      priority: asText(row.priority, "normal"),
      relatedUrl: await resolveSafeActionUrl(row.action_url, source.key, source.primaryUrl),
      relatedLabel: "Go to related module",
    },
    history,
  };
}

export async function getActivityMessageBoard(
  userId: string,
  activityId: string,
  locale?: AppLocale,
) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("customer_activity")
    .select("*")
    .eq("id", activityId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const row = data as Record<string, unknown>;
  const source = await getDivisionBrand(asNullableText(row.division) || "account");
  const history = await buildRelatedHistory(userId, row, asText(row.id), locale);

  return {
    source,
    record: {
      id: asText(row.id),
      title: asText(row.title, "Activity"),
      body: asText(row.description),
      createdAt: asText(row.created_at),
      status: asNullableText(row.status),
      amountKobo: Number(row.amount_kobo) || 0,
      relatedUrl: await resolveSafeActionUrl(row.action_url, source.key, source.primaryUrl),
      relatedLabel: "Go to related module",
      metadata: asObject(row.metadata),
    },
    history,
  };
}

export async function getSecurityMessageBoard(
  userId: string,
  eventId: string,
  locale?: AppLocale,
) {
  const admin = createAdminSupabase();
  const { data: event } = await admin
    .from("customer_security_log")
    .select("*")
    .eq("id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!event) {
    return null;
  }

  const [source, notificationsRes] = await Promise.all([
    getDivisionBrand("security"),
    admin
      .from("customer_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const record = buildSecurityEventView(event as Record<string, unknown>);
  const history = ((notificationsRes.data ?? []) as Array<Record<string, unknown>>)
    .filter((row) => {
      if (isHiddenNotification(row)) return false;
      const title = asText(row.title).toLowerCase();
      const body = asText(row.body).toLowerCase();
      return title.includes("security") || body.includes("security") || body.includes("login");
    })
    .map((row) => localizeNotificationRow(row, locale))
    .map((row) => ({
      id: asText(row.id),
      title: asText(row.title, "Security notification"),
      body: asText(row.body),
      createdAt: asText(row.created_at),
      href: notificationMessageHref(asText(row.id)),
      tone: buildTone(asNullableText(row.priority)),
      kind: "notification" as const,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return {
    source,
    record: {
      ...record,
      relatedUrl: "/security",
      relatedLabel: "Return to security center",
    },
    history,
  };
}
