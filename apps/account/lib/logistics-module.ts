import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import { getDivisionUrl } from "@henryco/config";

export type AccountLogisticsShipmentRow = {
  id: string;
  tracking_code: string;
  lifecycle_status: string;
  service_type: string;
  urgency: string;
  amount_quoted: number;
  currency: string;
  zone_label: string | null;
  created_at: string;
  updated_at: string;
};

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function getLogisticsShipmentsForAccountUser(userId: string, email: string | null) {
  const admin = createAdminSupabase();
  const norm = email ? email.trim().toLowerCase() : "";

  let query = admin
    .from("logistics_shipments")
    .select(
      "id, tracking_code, lifecycle_status, service_type, urgency, amount_quoted, pricing_breakdown, zone_label, created_at, updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(24);

  if (norm) {
    query = query.or(`customer_user_id.eq.${userId},normalized_email.eq.${norm}`);
  } else {
    query = query.eq("customer_user_id", userId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[account] logistics_shipments", error);
    return [] as AccountLogisticsShipmentRow[];
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const pricingBreakdown = asObject(row.pricing_breakdown);
    return {
      id: String(row.id || ""),
      tracking_code: String(row.tracking_code || ""),
      lifecycle_status: String(row.lifecycle_status || "pending"),
      service_type: String(row.service_type || "delivery"),
      urgency: String(row.urgency || "standard"),
      amount_quoted: Number(row.amount_quoted || 0),
      currency: String(pricingBreakdown.currency || "NGN"),
      zone_label: row.zone_label ? String(row.zone_label) : null,
      created_at: String(row.created_at || ""),
      updated_at: String(row.updated_at || ""),
    } satisfies AccountLogisticsShipmentRow;
  });
}

export function logisticsTrackUrl(trackingCode: string) {
  const base = getDivisionUrl("logistics").replace(/\/$/, "");
  return `${base}/track?code=${encodeURIComponent(trackingCode)}`;
}
