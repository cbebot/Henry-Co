import "server-only";

import { createAdminSupabase } from "@/lib/supabase";

const admin = () => createAdminSupabase();

// ─── Care ───
export async function getCareBookings(userId: string) {
  const { data } = await admin()
    .from("care_bookings")
    .select("*")
    .eq("customer_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  return data || [];
}

export async function getCarePayments(userId: string) {
  const { data } = await admin()
    .from("care_payments")
    .select("*")
    .eq("customer_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  return data || [];
}

export async function getCareReviews(userId: string) {
  const { data } = await admin()
    .from("care_reviews")
    .select("*")
    .eq("customer_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  return data || [];
}

// ─── Marketplace ───
export async function getMarketplaceOrders(userId: string) {
  const { data } = await admin()
    .from("orders")
    .select("*")
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  return data || [];
}

// ─── Cross-division activity by division ───
export async function getDivisionActivity(userId: string, division: string, limit = 20) {
  const { data } = await admin()
    .from("customer_activity")
    .select("*")
    .eq("user_id", userId)
    .eq("division", division)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

// ─── Division invoices ───
export async function getDivisionInvoices(userId: string, division: string) {
  const { data } = await admin()
    .from("customer_invoices")
    .select("*")
    .eq("user_id", userId)
    .eq("division", division)
    .order("created_at", { ascending: false })
    .limit(20);
  return data || [];
}

// ─── Division notifications ───
export async function getDivisionNotifications(userId: string, division: string) {
  const { data } = await admin()
    .from("customer_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const records = data || [];
  if (division !== "property") {
    return records.filter((record) => record.category === division).slice(0, 20);
  }

  return records
    .filter((record) => {
      const referenceType = String(record.reference_type || "");
      const actionUrl = String(record.action_url || "");
      const title = String(record.title || "").toLowerCase();
      return (
        referenceType.startsWith("property_") ||
        actionUrl.includes("/property") ||
        actionUrl.includes("/owner") ||
        actionUrl.includes("property.henrycogroup.com") ||
        title.includes("property")
      );
    })
    .slice(0, 20);
}

// ─── Division support threads ───
export async function getDivisionSupportThreads(userId: string, division: string) {
  const { data } = await admin()
    .from("support_threads")
    .select("*")
    .eq("user_id", userId)
    .eq("division", division)
    .order("updated_at", { ascending: false })
    .limit(10);
  return data || [];
}
