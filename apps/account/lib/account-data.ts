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

export async function markNotificationsRead(userId: string, notificationIds?: string[]) {
  const ids = Array.from(new Set((notificationIds || []).map((value) => String(value || "").trim()).filter(Boolean)));
  let query = admin()
    .from("customer_notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (ids.length > 0) {
    query = query.in("id", ids);
  } else {
    query = query.eq("is_read", false);
  }

  await query;
}

export async function markNotificationReadState(
  userId: string,
  notificationId: string,
  isRead: boolean
) {
  await admin()
    .from("customer_notifications")
    .update({
      is_read: isRead,
      read_at: isRead ? new Date().toISOString() : null,
    })
    .eq("user_id", userId)
    .eq("id", notificationId);
}

export async function markNotificationsReadByReference(
  userId: string,
  referenceType: string,
  referenceId: string
) {
  await admin()
    .from("customer_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("reference_type", referenceType)
    .eq("reference_id", referenceId)
    .eq("is_read", false);
}

export async function markNotificationsReadByActionUrl(userId: string, actionUrl: string) {
  await admin()
    .from("customer_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("action_url", actionUrl)
    .eq("is_read", false);
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

export async function getSupportThreadById(userId: string, threadId: string) {
  const { data } = await admin()
    .from("support_threads")
    .select("*")
    .eq("user_id", userId)
    .eq("id", threadId)
    .maybeSingle();

  return data;
}

export async function getSupportMessages(threadId: string) {
  const { data } = await admin()
    .from("support_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  return data || [];
}

export async function markSupportThreadRead(userId: string, threadId: string) {
  const now = new Date().toISOString();

  // Update thread-level customer last read timestamp
  await admin()
    .from("support_threads")
    .update({ customer_last_read_at: now })
    .eq("id", threadId)
    .eq("user_id", userId);

  // Mark individual messages as read (messages not sent by customer)
  await admin()
    .from("support_messages")
    .update({ is_read: true, read_at: now })
    .eq("thread_id", threadId)
    .neq("sender_type", "customer")
    .eq("is_read", false);
}

export async function getUnreadSupportCount(userId: string) {
  // Count threads where there are messages newer than customer_last_read_at
  const { data: threads } = await admin()
    .from("support_threads")
    .select("id, customer_last_read_at")
    .eq("user_id", userId)
    .neq("status", "closed");

  if (!threads || threads.length === 0) return 0;

  let unreadCount = 0;
  for (const thread of threads) {
    const lastRead = thread.customer_last_read_at;
    let query = admin()
      .from("support_messages")
      .select("*", { count: "exact", head: true })
      .eq("thread_id", thread.id)
      .neq("sender_type", "customer")
      .eq("is_read", false);

    if (lastRead) {
      query = query.gt("created_at", lastRead);
    }

    const { count } = await query;
    if (count && count > 0) unreadCount++;
  }

  return unreadCount;
}

export async function getSubscriptions(userId: string) {
  const { data } = await admin()
    .from("customer_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getSubscriptionById(userId: string, subscriptionId: string) {
  const { data } = await admin()
    .from("customer_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("id", subscriptionId)
    .maybeSingle();

  return data;
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

export async function getInvoiceById(userId: string, invoiceId: string) {
  const { data } = await admin()
    .from("customer_invoices")
    .select("*")
    .eq("user_id", userId)
    .eq("id", invoiceId)
    .maybeSingle();

  return data;
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
  const [wallet, activity, notifications, subscriptions, invoices, supportThreads, unreadCount, unreadSupportCount] = await Promise.all([
    getWalletSummary(userId),
    getRecentActivity(userId, 5),
    getNotifications(userId, 5),
    getSubscriptions(userId),
    getInvoices(userId, 3),
    getSupportThreads(userId),
    getUnreadNotificationCount(userId),
    getUnreadSupportCount(userId),
  ]);

  const openSupportThreads = supportThreads.filter(
    (t) => !["closed", "resolved"].includes(String(t.status || "").toLowerCase())
  );

  const pendingInvoices = invoices.filter(
    (inv) => String(inv.status || "").toLowerCase() === "pending"
  );

  return {
    wallet,
    recentActivity: activity,
    recentNotifications: notifications,
    unreadNotificationCount: unreadCount,
    unreadSupportCount,
    activeSubscriptions: subscriptions.filter(
      (subscription) => String(subscription.status || "").trim().toLowerCase() === "active"
    ),
    recentInvoices: invoices,
    pendingInvoiceCount: pendingInvoices.length,
    openSupportCount: openSupportThreads.length,
  };
}
