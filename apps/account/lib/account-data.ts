import "server-only";

import type { AppLocale } from "@henryco/i18n";
import { createAdminSupabase } from "@/lib/supabase";
import { getDivisionBrand, type DivisionBrand } from "@/lib/branding";
import {
  isHiddenNotification,
  notificationMessageHref,
  resolveSafeActionUrl,
} from "@/lib/notification-center";
import { resolveNotificationPresentation } from "@/lib/notification-localization";
import { getSharedPaymentRail } from "@/lib/payment-settings";
import {
  extractLegacyWithdrawalPinHash,
  isLegacyPayoutMethodRow,
  isLegacyWithdrawalPinRow,
  isMissingPostgrestResourceError,
  isPendingWithdrawalStatus,
  LEGACY_WALLET_TRANSACTION_PENDING_STATUS,
  LEGACY_WITHDRAWAL_REQUEST_REFERENCE_TYPE,
  mapLegacyPayoutMethod,
  mapLegacyWithdrawalRequest,
} from "@/lib/wallet-storage";

const admin = () => createAdminSupabase();

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableText(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function isMissingNotificationColumn(
  error: { message?: string | null; code?: string | null } | null | undefined,
  column: string
) {
  const message = asText(error?.message).toLowerCase();
  const code = asText(error?.code);
  return (
    message.includes(`customer_notifications.${column.toLowerCase()}`) ||
    message.includes(`${column.toLowerCase()} does not exist`) ||
    code === "42703"
  );
}

function resolveNotificationKey(row: Record<string, unknown>) {
  return (
    asNullableText(row.division) ||
    asNullableText(row.category) ||
    (asText(row.reference_type).startsWith("wallet_") ? "wallet" : null) ||
    "general"
  );
}

function localizeNotificationRow(row: Record<string, unknown>, locale?: AppLocale) {
  if (!locale) return row;
  const localized = resolveNotificationPresentation({ row, locale });
  return {
    ...row,
    title: localized.title,
    body: localized.body,
  };
}

export type EnrichedNotification = Record<string, unknown> & {
  source: DivisionBrand;
  message_href: string;
  related_url: string;
};

export type WalletFundingRequest = {
  id: string;
  created_at: string;
  amount_kobo: number;
  description: string;
  status: string;
  provider: string;
  reference: string | null;
  note: string | null;
  proof_url: string | null;
  proof_name: string | null;
  proof_public_id: string | null;
  proof_uploaded_at: string | null;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  instructions: string | null;
};

function mapFundingRequest(row: Record<string, unknown>): WalletFundingRequest {
  const metadata = asObject(row.metadata);
  const rawStatus = asText(row.status, LEGACY_WALLET_TRANSACTION_PENDING_STATUS);
  return {
    id: asText(row.id),
    created_at: asText(row.created_at),
    amount_kobo: Number(row.amount_kobo) || 0,
    description: asText(row.description),
    status:
      rawStatus === LEGACY_WALLET_TRANSACTION_PENDING_STATUS ? "pending_verification" : rawStatus,
    provider: asText(metadata.provider, "bank_transfer"),
    reference: asNullableText(metadata.reference),
    note: asNullableText(metadata.note),
    proof_url: asNullableText(metadata.proof_url),
    proof_name: asNullableText(metadata.proof_name),
    proof_public_id: asNullableText(metadata.proof_public_id),
    proof_uploaded_at: asNullableText(metadata.proof_uploaded_at),
    bank_name: asNullableText(metadata.bank_name),
    account_name: asNullableText(metadata.account_name),
    account_number: asNullableText(metadata.account_number),
    instructions: asNullableText(metadata.instructions),
  };
}

/** Newer dedicated funding-request rows */
function mapDedicatedFundingRequest(row: Record<string, unknown>): WalletFundingRequest {
  const metadata = asObject(row.metadata);
  const ref = asNullableText(row.payment_reference) || asNullableText(metadata.reference);
  return {
    id: asText(row.id),
    created_at: asText(row.created_at),
    amount_kobo: Number(row.amount_kobo) || 0,
    description: ref ? `Wallet funding — ${ref}` : "Wallet funding request",
    status: asText(row.status, "pending_verification"),
    provider: asText(row.provider, "bank_transfer"),
    reference: ref,
    note: asNullableText(row.note),
    proof_url: asNullableText(row.proof_url) || asNullableText(metadata.proof_url),
    proof_name: asNullableText(row.proof_name) || asNullableText(metadata.proof_name),
    proof_public_id: asNullableText(row.proof_public_id) || asNullableText(metadata.proof_public_id),
    proof_uploaded_at: asNullableText(metadata.proof_uploaded_at),
    bank_name: asNullableText(metadata.bank_name),
    account_name: asNullableText(metadata.account_name),
    account_number: asNullableText(metadata.account_number),
    instructions: asNullableText(metadata.instructions),
  };
}

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

  return ((data ?? []) as Array<Record<string, unknown>>).filter(
    (row) => !isHiddenNotification(row)
  );
}

/**
 * V2-NOT-02-A · N5a — recently-deleted page query.
 * Returns customer_notifications rows with deleted_at IS NOT NULL,
 * ordered by deletion time, scoped to the calling user.
 *
 * RLS already isolates own-only on `customer_notifications`, but we
 * filter explicitly on user_id as a defense-in-depth posture mirroring
 * every other account-data query.
 */
export async function getRecentlyDeletedNotifications(userId: string, limit = 50) {
  const { data, error } = await admin()
    .from("customer_notifications")
    .select("*")
    .eq("user_id", userId)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[notifications] recently-deleted query failed:", error.message);
    return [] as Array<Record<string, unknown>>;
  }
  return (data ?? []) as Array<Record<string, unknown>>;
}

export async function getRecentlyDeletedNotificationFeed(
  userId: string,
  limit = 50,
  locale?: AppLocale,
): Promise<EnrichedNotification[]> {
  const rows = await getRecentlyDeletedNotifications(userId, limit);
  return Promise.all(
    rows.map(async (row) => {
      const localized = localizeNotificationRow(row, locale);
      const source = await getDivisionBrand(resolveNotificationKey(localized));
      return {
        ...localized,
        source,
        message_href: notificationMessageHref(asText(localized.id)),
        related_url: await resolveSafeActionUrl(
          localized.action_url,
          source.key,
          source.primaryUrl,
        ),
      };
    }),
  );
}

export async function getNotificationFeed(
  userId: string,
  limit = 20,
  locale?: AppLocale,
): Promise<EnrichedNotification[]> {
  const notifications = (await getNotifications(userId, limit)) as Array<Record<string, unknown>>;
  return Promise.all(
    notifications.map(async (notification) => {
      const localizedNotification = localizeNotificationRow(notification, locale);
      const source = await getDivisionBrand(resolveNotificationKey(localizedNotification));
      return {
        ...localizedNotification,
        source,
        message_href: notificationMessageHref(asText(localizedNotification.id)),
        related_url: await resolveSafeActionUrl(
          localizedNotification.action_url,
          source.key,
          source.primaryUrl
        ),
      };
    })
  );
}

export async function getNotificationBellFeed(userId: string, limit = 8, locale?: AppLocale) {
  const [items, unreadCount] = await Promise.all([
    getNotificationFeed(userId, limit, locale),
    getUnreadNotificationCount(userId),
  ]);

  return {
    unreadCount,
    items,
  };
}

export async function getUnreadNotificationCount(userId: string) {
  const modern = await admin()
    .from("customer_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)
    .is("archived_at", null)
    .is("deleted_at", null);

  if (!modern.error) {
    return modern.count ?? 0;
  }

  if (
    !isMissingNotificationColumn(modern.error, "archived_at") &&
    !isMissingNotificationColumn(modern.error, "deleted_at")
  ) {
    console.warn("[notifications] unread count query failed:", modern.error.message);
    return 0;
  }

  const legacy = await admin()
    .from("customer_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)
    .not("priority", "in", '("archived","deleted")');

  if (legacy.error) {
    console.warn("[notifications] legacy unread count query failed:", legacy.error.message);
    return 0;
  }

  return legacy.count ?? 0;
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
  // V2-ADDR-01: canonical user_addresses table.
  const { data } = await admin()
    .from("user_addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return data || [];
}

/**
 * V2-ADDR-01: helper for cross-division surfaces (care, logistics, marketplace
 * checkout) that need to load the user's address book server-side. Returns the
 * canonical row shape from public.user_addresses.
 */
export async function getCanonicalUserAddresses(userId: string) {
  const { data, error } = await admin()
    .from("user_addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }
  return data ?? [];
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

function collectSubscriptionReferenceKeys(subscription: Record<string, unknown>) {
  return Array.from(
    new Set(
      [
        subscription.id,
        subscription.reference_id,
        subscription.reference_code,
        subscription.external_id,
        subscription.external_reference,
        subscription.provider_reference,
        subscription.provider_subscription_id,
        subscription.subscription_id,
        subscription.payment_reference,
      ]
        .map(asNullableText)
        .filter(Boolean)
    )
  ) as string[];
}

function rowMatchesReference(
  row: Record<string, unknown>,
  referenceKeys: string[],
  rowFields: string[]
) {
  if (referenceKeys.length === 0) return false;
  const keySet = new Set(referenceKeys);

  return rowFields.some((field) => {
    const value = asNullableText(row[field]);
    return value ? keySet.has(value) : false;
  });
}

export async function getSubscriptionContext(userId: string, subscriptionId: string) {
  const [subscription, invoices, supportThreads] = await Promise.all([
    getSubscriptionById(userId, subscriptionId),
    getInvoices(userId, 50),
    getSupportThreads(userId),
  ]);

  if (!subscription) {
    return null;
  }

  const subscriptionRow = subscription as Record<string, unknown>;
  const division = asNullableText(subscriptionRow.division);
  const referenceKeys = collectSubscriptionReferenceKeys(subscriptionRow);
  const hasDivisionFilter = Boolean(division);

  const relatedInvoices = (invoices as Array<Record<string, unknown>>).filter((invoice) => {
    if (
      hasDivisionFilter &&
      asNullableText(invoice.division)?.toLowerCase() !== division?.toLowerCase()
    ) {
      return false;
    }

    return rowMatchesReference(invoice, referenceKeys, [
      "id",
      "reference_id",
      "payment_reference",
      "invoice_no",
    ]);
  });

  const relatedSupportThreads = (supportThreads as Array<Record<string, unknown>>).filter(
    (thread) => {
      if (
        hasDivisionFilter &&
        asNullableText(thread.division)?.toLowerCase() !== division?.toLowerCase()
      ) {
        return false;
      }

      return rowMatchesReference(thread, referenceKeys, ["id", "reference_id"]);
    }
  );

  return {
    subscription: subscriptionRow,
    relatedInvoices,
    relatedSupportThreads,
    referenceKeys,
  };
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

  return ((data ?? []) as Array<Record<string, unknown>>).filter(
    (row) => !isLegacyPayoutMethodRow(row) && !isLegacyWithdrawalPinRow(row)
  );
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

export async function getDashboardSummary(userId: string, locale?: AppLocale) {
  const [wallet, activity, notifications, subscriptions, invoices, supportThreads, unreadCount, unreadSupportCount] = await Promise.all([
    getWalletSummary(userId),
    getRecentActivity(userId, 5),
    getNotificationFeed(userId, 5, locale),
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

export async function getWalletFundingRequests(userId: string, limit = 12) {
  const [dedicatedRes, legacyRes] = await Promise.all([
    admin()
      .from("customer_wallet_funding_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    admin()
      .from("customer_wallet_transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("reference_type", "wallet_funding_request")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const dedicated = dedicatedRes.error
    ? []
    : ((dedicatedRes.data ?? []) as Array<Record<string, unknown>>).map(mapDedicatedFundingRequest);
  const legacyIds = new Set(dedicated.map((r) => r.id));
  const legacy = ((legacyRes.data ?? []) as Array<Record<string, unknown>>)
    .filter((row) => !legacyIds.has(asText(row.id)))
    .map(mapFundingRequest);

  return [...dedicated, ...legacy]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export async function getWalletFundingRequestById(userId: string, requestId: string) {
  const { data: dedicated, error: dedicatedError } = await admin()
    .from("customer_wallet_funding_requests")
    .select("*")
    .eq("id", requestId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!dedicatedError && dedicated) {
    return mapDedicatedFundingRequest(dedicated as Record<string, unknown>);
  }

  const { data: legacy } = await admin()
    .from("customer_wallet_transactions")
    .select("*")
    .eq("id", requestId)
    .eq("user_id", userId)
    .eq("reference_type", "wallet_funding_request")
    .maybeSingle();

  return legacy ? mapFundingRequest(legacy as Record<string, unknown>) : null;
}

export async function getWalletFundingContext(userId: string) {
  const [wallet, requests, rail] = await Promise.all([
    getWalletSummary(userId),
    getWalletFundingRequests(userId),
    getSharedPaymentRail(),
  ]);

  const pending = requests
    .filter((request) => request.status !== "completed" && request.status !== "verified")
    .reduce((sum, request) => sum + request.amount_kobo, 0);

  return {
    wallet,
    requests,
    rail,
    pending_kobo: pending,
  };
}

export async function getPayoutMethods(userId: string) {
  const { data, error } = await admin()
    .from("customer_payout_methods")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("is_default", { ascending: false });

  if (error && !isMissingPostgrestResourceError(error)) {
    console.error("[henryco/account] payout methods:", error);
    return [];
  }

  const { data: legacyRows, error: legacyError } = await admin()
    .from("customer_payment_methods")
    .select("id, type, label, last_four, bank_name, is_default, provider, metadata, created_at")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (legacyError) {
    console.error("[henryco/account] legacy payout methods:", legacyError);
    return data ?? [];
  }

  const legacy = ((legacyRows ?? []) as Array<Record<string, unknown>>)
    .filter((row) => isLegacyPayoutMethodRow(row))
    .map(mapLegacyPayoutMethod);

  if (error && isMissingPostgrestResourceError(error)) {
    return legacy;
  }

  return [...(data ?? []), ...legacy].filter(
    (item, index, list) => list.findIndex((entry) => String(entry.id) === String(item.id)) === index
  );
}

export async function getWithdrawalRequests(userId: string, limit = 40) {
  const { data, error } = await admin()
    .from("customer_wallet_withdrawal_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error && !isMissingPostgrestResourceError(error)) {
    console.error("[henryco/account] withdrawal requests:", error);
    return [];
  }

  const { data: legacyRows, error: legacyError } = await admin()
    .from("customer_wallet_transactions")
    .select("id, amount_kobo, status, created_at, metadata, reference_type")
    .eq("user_id", userId)
    .eq("reference_type", LEGACY_WITHDRAWAL_REQUEST_REFERENCE_TYPE)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (legacyError) {
    console.error("[henryco/account] legacy withdrawal requests:", legacyError);
    return data ?? [];
  }

  const legacy = ((legacyRows ?? []) as Array<Record<string, unknown>>).map(mapLegacyWithdrawalRequest);
  if (error && isMissingPostgrestResourceError(error)) {
    return legacy;
  }

  const dedicatedIds = new Set(((data ?? []) as Array<{ id?: string }>).map((item) => String(item.id || "")));
  const legacyOnly = legacy.filter((item) => !dedicatedIds.has(String((item as { id?: string }).id || "")));
  return [...(data ?? []), ...legacyOnly]
    .sort((left, right) => new Date(String(right.created_at)).getTime() - new Date(String(left.created_at)).getTime())
    .slice(0, limit);
}

export async function getWithdrawalPinConfigured(userId: string): Promise<boolean> {
  const { data, error } = await admin()
    .from("customer_preferences")
    .select("withdrawal_pin_hash")
    .eq("user_id", userId)
    .maybeSingle();

  if (error && !isMissingPostgrestResourceError(error)) return false;
  if (!error && data && asNullableText((data as { withdrawal_pin_hash?: string }).withdrawal_pin_hash)) {
    return true;
  }

  const { data: legacyRows, error: legacyError } = await admin()
    .from("customer_payment_methods")
    .select("type, provider, provider_token")
    .eq("user_id", userId);

  if (legacyError) return false;
  return Boolean(extractLegacyWithdrawalPinHash((legacyRows ?? []) as Array<Record<string, unknown>>));
}

export function getPendingWithdrawalHoldKobo(
  requests: Array<{ amount_kobo?: number; status?: string | null }>
) {
  return requests.reduce((sum, request) => {
    return isPendingWithdrawalStatus(request.status) ? sum + (Number(request.amount_kobo) || 0) : sum;
  }, 0);
}
