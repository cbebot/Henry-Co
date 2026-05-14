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
  zone_label: string | null;
  created_at: string;
  updated_at: string;
};

export async function getLogisticsShipmentsForAccountUser(userId: string, email: string | null) {
  const admin = createAdminSupabase();
  const norm = email ? email.trim().toLowerCase() : "";

  let query = admin
    .from("logistics_shipments")
    .select(
      "id, tracking_code, lifecycle_status, service_type, urgency, amount_quoted, zone_label, created_at, updated_at"
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

  // PASS 22 issue #4 — the row type declares lifecycle_status / service_type
  // as string but the underlying column allows NULL on legacy rows. The
  // logistics page calls .replaceAll(...) directly on these fields, which
  // throws when the value is null and bubbles into the account error
  // boundary. Coerce here so every consumer sees a stable string.
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id ?? ""),
    tracking_code: String(row.tracking_code ?? ""),
    lifecycle_status: typeof row.lifecycle_status === "string" ? row.lifecycle_status : "pending",
    service_type: typeof row.service_type === "string" ? row.service_type : "standard",
    urgency: typeof row.urgency === "string" ? row.urgency : "standard",
    amount_quoted: Number(row.amount_quoted) || 0,
    zone_label: typeof row.zone_label === "string" ? row.zone_label : null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  }));
}

export function logisticsTrackUrl(trackingCode: string) {
  const base = getDivisionUrl("logistics").replace(/\/$/, "");
  return `${base}/track?code=${encodeURIComponent(trackingCode)}`;
}
