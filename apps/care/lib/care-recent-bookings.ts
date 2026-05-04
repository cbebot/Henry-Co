import "server-only";

import { isRecoverableSupabaseAuthError } from "@henryco/config";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";

export type CareRecentBooking = {
  trackingCode: string;
  serviceType: string;
  status: string;
  pickupDate: string | null;
  pickupSlot: string | null;
  pickupAddress: string | null;
  createdAt: string | null;
};

/**
 * CHROME-01B FIX 7: when an authenticated customer lands on /track in
 * Care, fetch their three most recent bookings so we can offer one-click
 * re-entry instead of treating a known customer as a stranger. Returns
 * an empty list when the visitor is unauthenticated or has no bookings
 * matching their session email.
 */
export async function getRecentCareBookingsForViewer(): Promise<CareRecentBooking[]> {
  const supabase = await createSupabaseServer();
  let userEmail: string | null = null;

  try {
    const auth = await supabase.auth.getUser();
    userEmail = auth.data.user?.email?.trim().toLowerCase() ?? null;
  } catch (error) {
    if (!isRecoverableSupabaseAuthError(error)) {
      throw error;
    }
  }

  if (!userEmail) return [];

  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("care_bookings")
      .select(
        "tracking_code, service_type, status, pickup_date, pickup_slot, pickup_address, created_at"
      )
      .ilike("email", userEmail)
      .order("created_at", { ascending: false })
      .limit(3);

    if (error || !Array.isArray(data)) return [];

    return data.map((row) => ({
      trackingCode: String(row.tracking_code ?? ""),
      serviceType: String(row.service_type ?? ""),
      status: String(row.status ?? ""),
      pickupDate: row.pickup_date ? String(row.pickup_date) : null,
      pickupSlot: row.pickup_slot ? String(row.pickup_slot) : null,
      pickupAddress: row.pickup_address ? String(row.pickup_address) : null,
      createdAt: row.created_at ? String(row.created_at) : null,
    }));
  } catch {
    return [];
  }
}
