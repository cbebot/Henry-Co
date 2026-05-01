import "server-only";

import { getDivisionUrl } from "@henryco/config";
import { publishNotification, type Severity } from "@henryco/notifications";
import { normalizeEmail } from "@/lib/env";
import { createAdminSupabase } from "@/lib/supabase";

// Map the freeform `priority` strings the marketplace dispatcher passes
// ("normal" / "high" / "critical" / etc.) onto the publisher's typed
// Severity enum. Unknown values fall back to "info".
function severityFromPriority(priority: string | null | undefined): Severity {
  const value = String(priority || "").trim().toLowerCase();
  if (value === "high" || value === "urgent" || value === "critical") return "urgent";
  if (value === "warning") return "warning";
  if (value === "success") return "success";
  if (value === "security") return "security";
  return "info";
}

// `entityType` from the marketplace dispatcher (e.g. "order", "dispute",
// "vendor_application") needs to satisfy the shim's relatedType shape:
// lowercase + digits + underscores, max 64 chars. The dispatcher uses
// snake_case for these values already, but defensive normalization here
// keeps the shim contract clean.
function safeRelatedType(value: string | null | undefined): string | undefined {
  const trimmed = String(value || "").trim().toLowerCase();
  if (!trimmed) return undefined;
  if (!/^[a-z0-9_]+$/.test(trimmed)) return undefined;
  if (trimmed.length > 64) return undefined;
  return trimmed;
}

// `entityId` is expected to be a UUID for first-class entities (order,
// dispute, payout_request) — but a few legacy paths pass non-UUID slugs.
// The shim rejects non-UUID relatedId, so we drop non-UUID values here
// instead of failing the publish silently.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function safeUuid(value: string | null | undefined): string | undefined {
  const trimmed = String(value || "").trim();
  return UUID_RE.test(trimmed) ? trimmed : undefined;
}

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

function buildMarketplaceActionUrl(entityType?: string | null, entityId?: string | null, fallbackPath = "/account") {
  const baseUrl = getDivisionUrl("marketplace");
  const type = cleanText(entityType);
  const id = cleanText(entityId);

  if (type === "order" && id) return `${baseUrl}/account/orders/${id}`;
  if (type === "order_group" && id) return `${baseUrl}/vendor/orders`;
  if (type === "dispute" && id) return `${baseUrl}/account/disputes`;
  if (type === "payout_request" && id) return `${baseUrl}/vendor/payouts`;
  if (type === "product" && id) return `${baseUrl}/vendor/products`;
  if (type === "vendor_application" && id) return `${baseUrl}/account/seller-application`;
  if (type === "support_thread" && id) return `${baseUrl}/help`;
  return `${baseUrl}${fallbackPath.startsWith("/") ? fallbackPath : `/${fallbackPath}`}`;
}

export async function resolveSharedAccountUserId(userId?: string | null, normalizedEmailValue?: string | null) {
  if (userId) return userId;

  const normalized = normalizeEmail(normalizedEmailValue);
  if (!normalized) return null;

  try {
    const admin = createAdminSupabase();
    const { data } = await admin
      .from("customer_profiles")
      .select("id")
      .eq("email", normalized)
      .maybeSingle();

    return data?.id ? String(data.id) : null;
  } catch {
    return null;
  }
}

export async function syncMarketplaceAccountProjection(input: {
  userId?: string | null;
  normalizedEmail?: string | null;
  title: string;
  body: string;
  category?: string | null;
  priority?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  amountKobo?: number | null;
  metadata?: Record<string, unknown>;
  actionUrl?: string | null;
  actionLabel?: string | null;
  status?: string | null;
}) {
  const resolvedUserId = await resolveSharedAccountUserId(input.userId, input.normalizedEmail);
  if (!resolvedUserId) return;

  const admin = createAdminSupabase();
  const actionUrl =
    cleanText(input.actionUrl) ||
    buildMarketplaceActionUrl(input.entityType, input.entityId);

  const metadata = {
    ...(input.metadata ?? {}),
    source: "marketplace",
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    normalizedEmail: normalizeEmail(input.normalizedEmail) ?? null,
  };

  // The customer_activity insert and the notification publish are
  // independent persistence concerns: activity is the audit log of "user
  // received this projection," notification is the inbox message itself.
  // Run both concurrently. The notification path goes through the shim
  // (validation, rate limit, audit log); activity stays a direct insert
  // because the publisher contract is for cross-division notifications,
  // not generic activity rows.
  const activityWrite = admin.from("customer_activity").insert({
    user_id: resolvedUserId,
    division: "marketplace",
    activity_type: cleanText(input.category) || "marketplace_update",
    title: input.title,
    description: input.body,
    status: cleanText(input.status) || "active",
    reference_type: input.entityType ?? "marketplace",
    reference_id: input.entityId ?? null,
    amount_kobo: input.amountKobo ?? null,
    metadata,
    action_url: actionUrl,
  } as never);

  const notificationPublish = publishNotification({
    userId: resolvedUserId,
    division: "marketplace",
    eventType: "marketplace.order.update",
    severity: severityFromPriority(input.priority),
    title: input.title,
    body: cleanText(input.body) || undefined,
    deepLink: actionUrl,
    actionLabel: cleanText(input.actionLabel) || "Open Marketplace",
    relatedType: safeRelatedType(input.entityType ?? "marketplace"),
    relatedId: safeUuid(input.entityId),
    publisher: "bridge:apps/marketplace/lib/marketplace/projections.ts",
  });

  const [, publishResult] = await Promise.allSettled([activityWrite, notificationPublish]);

  if (
    publishResult.status === "fulfilled" &&
    !publishResult.value.ok &&
    process.env.NODE_ENV !== "production"
  ) {
    console.warn(
      "[marketplace:projection] shim rejected publish",
      publishResult.value.error,
      publishResult.value.detail,
    );
  }
}
