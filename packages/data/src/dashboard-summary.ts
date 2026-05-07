import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import { createDataAdminClient, type TypedSupabaseClient } from "./client";

/**
 * @henryco/data/dashboard-summary — unified cross-division snapshot.
 *
 * Replaces and consolidates the three per-app implementations:
 *   - apps/account/lib/account-data.ts:getDashboardSummary
 *   - apps/hub/lib/owner-data.ts:getOwnerOverviewData
 *   - apps/staff/lib/intelligence-data.ts:getStaffIntelligenceSnapshot
 *
 * Returns a discriminated union keyed off viewer.kind so callers can
 * narrow with type-system safety:
 *
 *   const summary = await getDashboardSummary(viewer);
 *   if (summary.kind === "customer") {
 *     // summary.wallet typed as CustomerWalletSnapshot
 *   }
 *
 * SCHEMA NOTE: queries target the LIVE production schema as of
 * 2026-05-07 — `customer_activity` (not `customer_activity_log`),
 * `support_threads` (not `customer_support_threads`). The original
 * DASH-1 draft referenced names from the V2-NOT-02-A migration that
 * hadn't been applied; corrected to match the actual tables.
 *
 * DASH-1 ships:
 *   - Full `customer` implementation — eight Promise.all reads against
 *     real tables.
 *   - Stubbed `owner` and `staff` implementations — minimum viable
 *     summary plus `// TODO V2-DATA-02` for the full ports.
 *     apps/hub and apps/staff continue to use their existing readers
 *     until DASH-2/DASH-3 migrate them.
 */

export type CustomerWalletSnapshot = {
  balanceKobo: number;
  currency: string;
};

export type ActivityRow = {
  id: string;
  division: string;
  activityType: string;
  title: string;
  description: string | null;
  createdAt: string;
};

export type NotificationRow = {
  id: string;
  category: string;
  priority: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
};

export type SubscriptionRow = {
  id: string;
  status: string;
  planId: string | null;
};

export type InvoiceRow = {
  id: string;
  status: string;
  totalKobo: number;
  createdAt: string;
};

export type SupportThreadRow = {
  id: string;
  status: string;
  subject: string;
  division: string | null;
  createdAt: string;
};

export type CustomerSummary = {
  kind: "customer";
  wallet: CustomerWalletSnapshot;
  recentActivity: ReadonlyArray<ActivityRow>;
  recentNotifications: ReadonlyArray<NotificationRow>;
  unreadNotificationCount: number;
  unreadSupportCount: number;
  activeSubscriptions: ReadonlyArray<SubscriptionRow>;
  recentInvoices: ReadonlyArray<InvoiceRow>;
  pendingInvoiceCount: number;
  openSupportCount: number;
};

export type OwnerSummary = {
  kind: "owner";
  /** TODO V2-DATA-02: full port from apps/hub/lib/owner-data.ts:getOwnerOverviewData. */
  totalCustomers: number;
  totalActiveStaff: number;
  totalOpenIncidents: number;
};

export type StaffSummary = {
  kind: "staff";
  /** TODO V2-DATA-02: full port from apps/staff/lib/intelligence-data.ts:getStaffIntelligenceSnapshot. */
  myDivision: string | null;
  myOpenTasks: number;
  myUnreadNotifications: number;
};

export type DashboardSummary = CustomerSummary | OwnerSummary | StaffSummary;

/**
 * Build the dashboard summary for the viewer. Dispatches by
 * `viewer.kind`; each branch reads only the data it needs.
 */
export async function getDashboardSummary(viewer: UnifiedViewer): Promise<DashboardSummary> {
  const client = createDataAdminClient();
  switch (viewer.kind) {
    case "customer":
      return readCustomerSummary(client, viewer.user.id);
    case "owner":
      return readOwnerSummary(client, viewer.user.id);
    case "staff":
      return readStaffSummary(client, viewer);
  }
}

async function readCustomerSummary(
  client: TypedSupabaseClient,
  userId: string,
): Promise<CustomerSummary> {
  const [wallet, activity, notifications, subscriptions, invoices, supportThreads, unreadCount, unreadSupportCount] =
    await Promise.all([
      readWallet(client, userId),
      readRecentActivity(client, userId, 5),
      readRecentNotifications(client, userId, 5),
      readSubscriptions(client, userId),
      readRecentInvoices(client, userId, 3),
      readSupportThreads(client, userId),
      readUnreadNotificationCount(client, userId),
      readUnreadSupportCount(client, userId),
    ]);

  const openSupportThreads = supportThreads.filter(
    (t) => !["closed", "resolved"].includes(t.status.toLowerCase()),
  );
  const pendingInvoices = invoices.filter((inv) => inv.status.toLowerCase() === "pending");

  return {
    kind: "customer",
    wallet,
    recentActivity: activity,
    recentNotifications: notifications,
    unreadNotificationCount: unreadCount,
    unreadSupportCount,
    activeSubscriptions: subscriptions.filter(
      (s) => s.status.toLowerCase().trim() === "active",
    ),
    recentInvoices: invoices,
    pendingInvoiceCount: pendingInvoices.length,
    openSupportCount: openSupportThreads.length,
  };
}

async function readOwnerSummary(
  _client: TypedSupabaseClient,
  _userId: string,
): Promise<OwnerSummary> {
  return {
    kind: "owner",
    totalCustomers: 0,
    totalActiveStaff: 0,
    totalOpenIncidents: 0,
  };
}

async function readStaffSummary(
  _client: TypedSupabaseClient,
  _viewer: UnifiedViewer,
): Promise<StaffSummary> {
  return {
    kind: "staff",
    myDivision: null,
    myOpenTasks: 0,
    myUnreadNotifications: 0,
  };
}

// ---------- Customer sub-readers ----------

async function readWallet(client: TypedSupabaseClient, userId: string): Promise<CustomerWalletSnapshot> {
  const { data } = await client
    .from("customer_wallets")
    .select("balance_kobo, currency")
    .eq("user_id", userId)
    .maybeSingle();
  return {
    balanceKobo: data?.balance_kobo ?? 0,
    currency: data?.currency ?? "NGN",
  };
}

async function readRecentActivity(
  client: TypedSupabaseClient,
  userId: string,
  limit: number,
): Promise<ActivityRow[]> {
  const { data } = await client
    .from("customer_activity")
    .select("id, division, activity_type, title, description, created_at")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => ({
    id: row.id,
    division: row.division,
    activityType: row.activity_type,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
  }));
}

async function readRecentNotifications(
  client: TypedSupabaseClient,
  userId: string,
  limit: number,
): Promise<NotificationRow[]> {
  const { data } = await client
    .from("customer_notifications")
    .select("id, category, priority, title, body, is_read, created_at")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => ({
    id: row.id,
    category: row.category,
    priority: row.priority,
    title: row.title,
    body: row.body,
    isRead: row.is_read ?? false,
    createdAt: row.created_at,
  }));
}

async function readSubscriptions(
  client: TypedSupabaseClient,
  userId: string,
): Promise<SubscriptionRow[]> {
  const { data } = await client
    .from("customer_subscriptions")
    .select("id, status, plan_id")
    .eq("user_id", userId);
  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    planId: row.plan_id,
  }));
}

async function readRecentInvoices(
  client: TypedSupabaseClient,
  userId: string,
  limit: number,
): Promise<InvoiceRow[]> {
  const { data } = await client
    .from("customer_invoices")
    .select("id, status, total_kobo, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    totalKobo: row.total_kobo,
    createdAt: row.created_at,
  }));
}

async function readSupportThreads(
  client: TypedSupabaseClient,
  userId: string,
): Promise<SupportThreadRow[]> {
  const { data } = await client
    .from("support_threads")
    .select("id, status, subject, division, created_at")
    .eq("user_id", userId);
  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    subject: row.subject,
    division: row.division,
    createdAt: row.created_at,
  }));
}

async function readUnreadNotificationCount(
  client: TypedSupabaseClient,
  userId: string,
): Promise<number> {
  const { count } = await client
    .from("customer_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)
    .is("deleted_at", null);
  return count ?? 0;
}

async function readUnreadSupportCount(
  client: TypedSupabaseClient,
  userId: string,
): Promise<number> {
  const { count } = await client
    .from("support_threads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .neq("status", "closed")
    .neq("status", "resolved");
  return count ?? 0;
}
