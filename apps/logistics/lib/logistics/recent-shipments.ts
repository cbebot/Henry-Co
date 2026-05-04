import "server-only";

import { isRecoverableSupabaseAuthError } from "@henryco/config";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";

export type LogisticsRecentShipment = {
  trackingCode: string;
  serviceType: string;
  lifecycleStatus: string;
  zoneLabel: string | null;
  recipientName: string | null;
  scheduledDeliveryAt: string | null;
  createdAt: string | null;
  senderPhone: string | null;
  recipientPhone: string | null;
};

/**
 * CHROME-01B FIX 7: when an authenticated logistics customer hits /track,
 * load their three most recent shipments so we can present clickable
 * cards above the manual lookup field. Lookup priority:
 *   1. customer_user_id matches the auth.user
 *   2. normalized_email matches the auth.user.email (covers shipments
 *      booked before the customer linked their account)
 */
export async function getRecentLogisticsShipmentsForViewer(): Promise<LogisticsRecentShipment[]> {
  const supabase = await createSupabaseServer();
  let userId: string | null = null;
  let userEmail: string | null = null;

  try {
    const auth = await supabase.auth.getUser();
    userId = auth.data.user?.id ?? null;
    userEmail = auth.data.user?.email?.trim().toLowerCase() ?? null;
  } catch (error) {
    if (!isRecoverableSupabaseAuthError(error)) {
      throw error;
    }
  }

  if (!userId && !userEmail) return [];

  try {
    const admin = createAdminSupabase();
    const orFilters: string[] = [];
    if (userId) orFilters.push(`customer_user_id.eq.${userId}`);
    if (userEmail) {
      orFilters.push(`normalized_email.eq.${userEmail}`);
    }

    if (!orFilters.length) return [];

    const { data, error } = await admin
      .from("logistics_shipments")
      .select(
        "tracking_code, service_type, lifecycle_status, zone_label, recipient_name, scheduled_delivery_at, created_at, sender_phone, recipient_phone"
      )
      .or(orFilters.join(","))
      .order("created_at", { ascending: false })
      .limit(3);

    if (error || !Array.isArray(data)) return [];

    return data.map((row) => ({
      trackingCode: String(row.tracking_code ?? ""),
      serviceType: String(row.service_type ?? ""),
      lifecycleStatus: String(row.lifecycle_status ?? ""),
      zoneLabel: row.zone_label ? String(row.zone_label) : null,
      recipientName: row.recipient_name ? String(row.recipient_name) : null,
      scheduledDeliveryAt: row.scheduled_delivery_at
        ? String(row.scheduled_delivery_at)
        : null,
      createdAt: row.created_at ? String(row.created_at) : null,
      senderPhone: row.sender_phone ? String(row.sender_phone) : null,
      recipientPhone: row.recipient_phone ? String(row.recipient_phone) : null,
    }));
  } catch {
    return [];
  }
}
