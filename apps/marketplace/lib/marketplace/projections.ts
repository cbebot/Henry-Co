import "server-only";

import { getDivisionUrl } from "@henryco/config";
import { normalizeEmail } from "@/lib/env";
import { createAdminSupabase } from "@/lib/supabase";

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

  await Promise.allSettled([
    admin.from("customer_activity").insert({
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
    } as never),
    admin.from("customer_notifications").insert({
      user_id: resolvedUserId,
      title: input.title,
      body: input.body,
      category: cleanText(input.category) || "marketplace",
      priority: cleanText(input.priority) || "normal",
      action_url: actionUrl,
      action_label: cleanText(input.actionLabel) || "Open Marketplace",
      division: "marketplace",
      reference_type: input.entityType ?? "marketplace",
      reference_id: input.entityId ?? null,
    } as never),
  ]);
}
