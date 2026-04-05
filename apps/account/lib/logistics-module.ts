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

  return (data ?? []) as AccountLogisticsShipmentRow[];
}

export function logisticsTrackUrl(trackingCode: string) {
  const base = getDivisionUrl("logistics").replace(/\/$/, "");
  return `${base}/track?code=${encodeURIComponent(trackingCode)}`;
}
