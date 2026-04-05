import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import {
  listLinkedCareBookingsForUser,
  listLinkedCarePaymentsForUser,
} from "@/lib/care-sync";
import { isHiddenNotification } from "@/lib/notification-center";

const admin = () => createAdminSupabase();

async function getCareIdentity(userId: string) {
  const { data: profile } = await admin()
    .from("customer_profiles")
    .select("email, full_name, phone")
    .eq("id", userId)
    .maybeSingle();

  return {
    userId,
    email: profile?.email || null,
    fullName: profile?.full_name || null,
    phone: profile?.phone || null,
  };
}

// ─── Care ───
export async function getCareBookings(userId: string) {
  return listLinkedCareBookingsForUser(await getCareIdentity(userId));
}

export async function getCarePayments(userId: string) {
  return listLinkedCarePaymentsForUser(await getCareIdentity(userId));
}

export async function getCareReviews(userId: string) {
  const { data: activityRows } = await admin()
    .from("customer_activity")
    .select("reference_id")
    .eq("user_id", userId)
    .eq("division", "care")
    .eq("reference_type", "care_review")
    .limit(50);

  const reviewIds = (activityRows ?? [])
    .map((row) => String((row as { reference_id?: string | null }).reference_id || "").trim())
    .filter(Boolean);

  if (reviewIds.length === 0) {
    return [];
  }

  const { data } = await admin()
    .from("care_reviews")
    .select("*")
    .in("id", reviewIds)
    .order("created_at", { ascending: false })
    .limit(20);

  return data || [];
}

// ─── Marketplace ───
export async function getMarketplaceOrders(userId: string) {
  const { data } = await admin()
    .from("marketplace_orders")
    .select("*")
    .eq("user_id", userId)
    .order("placed_at", { ascending: false })
    .limit(20);
  return data || [];
}

export async function getMarketplaceDivisionSummary(userId: string) {
  const [
    ordersResult,
    disputesResult,
    applicationsResult,
    membershipsResult,
    payoutsResult,
  ] = await Promise.allSettled([
    admin()
      .from("marketplace_orders")
      .select("id, order_no, status, payment_status, grand_total, placed_at")
      .eq("user_id", userId)
      .order("placed_at", { ascending: false })
      .limit(12),
    admin()
      .from("marketplace_disputes")
      .select("id, dispute_no, status, order_no, updated_at")
      .eq("opened_by_user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(12),
    admin()
      .from("marketplace_vendor_applications")
      .select("id, status, store_name, submitted_at, review_note")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin()
      .from("marketplace_role_memberships")
      .select("role, scope_type, scope_id, is_active")
      .eq("user_id", userId)
      .eq("is_active", true),
    admin()
      .from("marketplace_payout_requests")
      .select("id, reference, amount, status, created_at")
      .eq("requested_by", userId)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const orders =
    ordersResult.status === "fulfilled" && !ordersResult.value.error ? ordersResult.value.data || [] : [];
  const disputes =
    disputesResult.status === "fulfilled" && !disputesResult.value.error ? disputesResult.value.data || [] : [];
  const application =
    applicationsResult.status === "fulfilled" && !applicationsResult.value.error
      ? applicationsResult.value.data || null
      : null;
  const memberships =
    membershipsResult.status === "fulfilled" && !membershipsResult.value.error
      ? membershipsResult.value.data || []
      : [];
  const payouts =
    payoutsResult.status === "fulfilled" && !payoutsResult.value.error ? payoutsResult.value.data || [] : [];

  return {
    orders,
    disputes,
    application,
    memberships,
    payouts,
    sellerActive: memberships.some((row) => String((row as { role?: string }).role || "") === "vendor"),
    issue:
      [ordersResult, disputesResult, applicationsResult, membershipsResult, payoutsResult].some(
        (result) => result.status === "rejected" || ("value" in result && result.value?.error)
      )
        ? "Some marketplace account modules are degraded."
        : null,
  };
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

  const records = (data || []).filter((record) => !isHiddenNotification(record as Record<string, unknown>));
  if (division !== "property") {
    return records
      .filter((record) => {
        const category = String(record.category || "");
        const recordDivision = String(record.division || "");
        return recordDivision === division || category === division;
      })
      .slice(0, 20);
  }

  return records
    .filter((record) => {
      const referenceType = String(record.reference_type || "");
      const actionUrl = String(record.action_url || "");
      const title = String(record.title || "").toLowerCase();
      return (
        referenceType.startsWith("property_") ||
        actionUrl.includes("/property") ||
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
