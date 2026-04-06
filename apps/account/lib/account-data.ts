import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import { getDivisionBrand, type DivisionBrand } from "@/lib/branding";
import {
  isHiddenNotification,
  notificationMessageHref,
  resolveSafeActionUrl,
} from "@/lib/notification-center";
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

function resolveNotificationKey(row: Record<string, unknown>) {
  return (
    asNullableText(row.division) ||
    asNullableText(row.category) ||
    (asText(row.reference_type).startsWith("wallet_") ? "wallet" : null) ||
    "general"
  );
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

export async function getNotificationFeed(userId: string, limit = 20): Promise<EnrichedNotification[]> {
  const notifications = (await getNotifications(userId, limit)) as Array<Record<string, unknown>>;
  return Promise.all(
    notifications.map(async (notification) => {
      const source = await getDivisionBrand(resolveNotificationKey(notification));
      return {
        ...notification,
        source,
        message_href: notificationMessageHref(asText(notification.id)),
        related_url: await resolveSafeActionUrl(
          notification.action_url,
          source.key,
          source.primaryUrl
        ),
      };
    })
  );
}

export async function getNotificationBellFeed(userId: string, limit = 8) {
  const [items, unreadCount] = await Promise.all([
    getNotificationFeed(userId, limit),
    getUnreadNotificationCount(userId),
  ]);

  return {
    unreadCount,
    items,
  };
}

export async function getUnreadNotificationCount(userId: string) {
  const notifications = await getNotifications(userId, 200);
  return notifications.filter((item) => !item.is_read).length;
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

export async function getDashboardSummary(userId: string) {
  const [wallet, activity, notifications, subscriptions, invoices] = await Promise.all([
    getWalletSummary(userId),
    getRecentActivity(userId, 5),
    getNotificationFeed(userId, 5),
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

  return [...(data ?? []), ...legacy]
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
