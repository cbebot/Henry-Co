import "server-only";

import { createAdminSupabase } from "@/lib/supabase";

const admin = () => createAdminSupabase();

export async function getWalletSummary(userId: string) {
  const { data: wallet } = await admin()
    .from("customer_wallets")
    .select("id, balance_kobo, currency, is_active")
    .eq("user_id", userId)
    .maybeSingle();

  return wallet || { id: null, balance_kobo: 0, currency: "NGN", is_active: true };
}

export async function getWalletTransactions(userId: string, limit = 20) {
  const { data } = await admin()
    .from("customer_wallet_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
}

export async function getRecentActivity(userId: string, limit = 10) {
  const { data } = await admin()
    .from("customer_activity")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
}

export async function getNotifications(userId: string, limit = 20) {
  const { data } = await admin()
    .from("customer_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
}

export async function getUnreadNotificationCount(userId: string) {
  const { count } = await admin()
    .from("customer_notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  return count || 0;
}

export async function getAddresses(userId: string) {
  const { data } = await admin()
    .from("customer_addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getPreferences(userId: string) {
  const { data } = await admin()
    .from("customer_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return data;
}

export async function getProfile(userId: string) {
  const { data } = await admin()
    .from("customer_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return data;
}

export async function getSupportThreads(userId: string) {
  const { data } = await admin()
    .from("support_threads")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  return data || [];
}

export async function getSupportMessages(threadId: string) {
  const { data } = await admin()
    .from("support_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  return data || [];
}

export async function getSubscriptions(userId: string) {
  const { data } = await admin()
    .from("customer_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getInvoices(userId: string, limit = 20) {
  const { data } = await admin()
    .from("customer_invoices")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
}

export async function getDocuments(userId: string) {
  const { data } = await admin()
    .from("customer_documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getPaymentMethods(userId: string) {
  const { data } = await admin()
    .from("customer_payment_methods")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getSecurityLog(userId: string, limit = 20) {
  const { data } = await admin()
    .from("customer_security_log")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
}

export async function getDashboardSummary(userId: string) {
  const [wallet, activity, notifications, subscriptions, invoices] = await Promise.all([
    getWalletSummary(userId),
    getRecentActivity(userId, 5),
    getNotifications(userId, 5),
    getSubscriptions(userId),
    getInvoices(userId, 3),
  ]);

  const unreadCount = await getUnreadNotificationCount(userId);

  return {
    wallet,
    recentActivity: activity,
    recentNotifications: notifications,
    unreadNotificationCount: unreadCount,
    activeSubscriptions: subscriptions.filter((s) => s.status === "active"),
    recentInvoices: invoices,
  };
}
