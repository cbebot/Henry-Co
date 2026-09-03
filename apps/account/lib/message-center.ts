import "server-only";

import type { AppLocale } from "@henryco/i18n";
import { resolveLocalizedDynamicField } from "@henryco/i18n/server";
import { getDivisionBrand } from "@/lib/branding";
import { createAdminSupabase } from "@/lib/supabase";
import {
  activityMessageHref,
  isHiddenNotification,
  notificationMessageHref,
  resolveSafeActionUrl,
} from "@/lib/notification-center";
import { resolveNotificationPresentationAsync } from "@/lib/notification-localization";
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

function resolveRelatedLabel(row: Record<string, unknown>): string {
  const division = asText(row.division).toLowerCase();
  const refType = asText(row.reference_type).toLowerCase();
  const category = asText(row.category).toLowerCase();

  if (refType === "care_booking") return "Open booking";
  if (refType === "support_thread" || category === "support") return "Open support thread";
  if (refType === "customer_invoice" || refType.includes("invoice")) return "View invoice";
  if (refType === "wallet_funding_request" || refType.includes("funding")) return "View funding request";
  if (refType === "wallet_withdrawal" || refType.includes("withdrawal")) return "View withdrawal";
  if (division === "wallet" || category === "wallet") return "Open wallet";
  if (division === "logistics" || refType.includes("shipment")) return "Track shipment";
  if (division === "marketplace" && refType === "order") return "View order";
  if (division === "marketplace" && refType === "dispute") return "View dispute";
  if (division === "marketplace" && refType === "payout_request") return "View payout";
  if (division === "marketplace") return "Open Marketplace";
  if (division === "jobs") return "View application";
  if (division === "property" && refType.includes("viewing")) return "View appointment";
  if (division === "property" && refType.includes("listing")) return "View listing";
  if (division === "property") return "Open Property";
  if (division === "studio") return "View project";
  if (division === "learn") return "Open course";
  if (division === "care") return "Open booking";
  return "Open dashboard";
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

async function localizeNotificationRow(row: Record<string, unknown>, locale?: AppLocale) {
  if (!locale) return row;
  const localized = await resolveNotificationPresentationAsync({ row, locale });
  return {
    ...row,
    title: localized.title,
    body: localized.body,
  };
}

/**
 * Wave 3 (account) — translate system-generated title/description on
 * customer_activity rows for the activity message-board surface. Mirrors the
 * helper in account-data.ts; only applied to rows that came from internal
 * sync helpers (NOT user-typed support messages).
 */
async function localizeActivityRow(row: Record<string, unknown>, locale?: AppLocale) {
  if (!locale || locale === "en") return row;
  const fallbackTitle = asText(row.title);
  const fallbackDescription = asText(row.description);
  const [title, description] = await Promise.all([
    fallbackTitle
      ? resolveLocalizedDynamicField({
          record: row,
          field: "title",
          locale,
          fallback: fallbackTitle,
          machineTranslate: true,
        })
      : Promise.resolve(fallbackTitle),
    fallbackDescription
      ? resolveLocalizedDynamicField({
          record: row,
          field: "description",
          locale,
          fallback: fallbackDescription,
          machineTranslate: true,
        })
      : Promise.resolve(fallbackDescription),
  ]);
  return { ...row, title, description };
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

  const notificationItems = await Promise.all(
    ((notificationsRes.data ?? []) as Array<Record<string, unknown>>)
      .filter((item) => !isHiddenNotification(item) && asText(item.id) !== excludeId)
      .map(async (item) => {
        const localized = await localizeNotificationRow(item, locale);
        return {
          id: asText(localized.id),
          title: asText(localized.title, "Notification"),
          body: asText(localized.body),
          createdAt: asText(localized.created_at),
          href: notificationMessageHref(asText(localized.id)),
          tone: !localized.is_read ? ("warn" as const) : ("neutral" as const),
          kind: "notification" as const,
        };
      }),
  );

  const activityItems = await Promise.all(
    ((activityRes.data ?? []) as Array<Record<string, unknown>>)
      .filter((item) => asText(item.id) !== excludeId)
      .map(async (item) => {
        const localized = await localizeActivityRow(item, locale);
        return {
          id: asText(localized.id),
          title: asText(localized.title, "Activity"),
          body: asText(localized.description),
          createdAt: asText(localized.created_at),
          href: activityMessageHref(asText(localized.id)),
          tone: buildTone(asNullableText(localized.status)),
          kind: "activity" as const,
        };
      }),
  );

  return [...notificationItems, ...activityItems]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);
}

export type HiddenNotificationReason = "archived" | "deleted";

export async function getHiddenNotificationReason(
  userId: string,
  notificationId: string,
): Promise<HiddenNotificationReason | null> {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("customer_notifications")
    .select("archived_at, deleted_at, priority")
    .eq("id", notificationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;

  const row = data as Record<string, unknown>;
  const priority = asText(row.priority).toLowerCase();

  if (asNullableText(row.deleted_at) || priority === "deleted") return "deleted";
  if (asNullableText(row.archived_at) || priority === "archived") return "archived";

  return null;
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

  const row = await localizeNotificationRow(data as Record<string, unknown>, locale);
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
      relatedLabel: resolveRelatedLabel(row),
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

  const row = await localizeActivityRow(data as Record<string, unknown>, locale);
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
      relatedLabel: resolveRelatedLabel(row),
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
  const filteredNotifications = ((notificationsRes.data ?? []) as Array<Record<string, unknown>>).filter(
    (row) => {
      if (isHiddenNotification(row)) return false;
      const title = asText(row.title).toLowerCase();
      const body = asText(row.body).toLowerCase();
      // Filter on the SOURCE EN copy before localization so security keywords
      // resolve regardless of the viewer's locale.
      return title.includes("security") || body.includes("security") || body.includes("login");
    },
  );
  const localizedHistory = await Promise.all(
    filteredNotifications.map(async (row) => {
      const localized = await localizeNotificationRow(row, locale);
      return {
        id: asText(localized.id),
        title: asText(localized.title, "Security notification"),
        body: asText(localized.body),
        createdAt: asText(localized.created_at),
        href: notificationMessageHref(asText(localized.id)),
        tone: buildTone(asNullableText(localized.priority)),
        kind: "notification" as const,
      };
    }),
  );
  const history = localizedHistory
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
