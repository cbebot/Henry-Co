import "server-only";

import { cache } from "react";
import { getStaffHqUrl } from "@henryco/config";
import { logOwnerSurfaceError } from "@/lib/owner-diagnostics";
import { createAdminSupabase } from "@/lib/supabase";
import { divisionColor, divisionLabel, formatCurrencyAmount } from "@/lib/format";
import type { WorkforceMember } from "@/lib/owner-workforce-catalog";
import { OWNER_DIVISION_SLUGS, WORKFORCE_PERMISSION_OPTIONS } from "@/lib/owner-workforce-catalog";
import {
  buildWorkforceIdentityMap,
  formatAuditActorDisplay,
  formatAuditEntityDisplay,
} from "@/lib/owner-identity";

export type {
  WorkforceMember,
  WorkforcePermissionOption,
  WorkforceRoleOption,
} from "@/lib/owner-workforce-catalog";
export {
  OWNER_DIVISION_SLUGS,
  WORKFORCE_PERMISSION_OPTIONS,
  WORKFORCE_ROLE_OPTIONS,
} from "@/lib/owner-workforce-catalog";

type JsonRecord = Record<string, unknown>;

type Filter =
  | { column: string; operator?: "eq" | "neq" | "gt" | "gte" | "lt" | "lte"; value: unknown }
  | { column: string; operator: "in"; value: unknown[] };

type QueryOptions = {
  filters?: Filter[];
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
};

type AuthUserRecord = {
  id: string;
  email: string | null;
  phone: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until?: string | null;
  app_metadata?: JsonRecord | null;
  user_metadata?: JsonRecord | null;
};

type DivisionSnapshot = {
  slug: string;
  label: string;
  displayName: string;
  accent: string;
  primaryUrl: string | null;
  subdomain: string | null;
  status: string;
  healthScore: number;
  healthLabel: string;
  revenueNaira: number;
  supportOpen: number;
  workOpen: number;
  alertCount: number;
  staffingCount: number;
  onboardingPending: number;
  recentActivityCount: number;
  recentActivity: {
    id: string;
    title: string;
    description: string;
    createdAt: string | null;
    status: string | null;
    source: string;
  }[];
  signals: OwnerSignal[];
};

export type OwnerSignal = {
  id: string;
  title: string;
  body: string;
  severity: "critical" | "warning" | "info" | "good";
  division: string | null;
  href: string;
  source: string;
  createdAt: string | null;
};

const DIVISION_ALIASES: Record<string, string> = {
  academy: "learn",
  learning: "learn",
  "buildings-interiors": "property",
  building: "property",
  buildings: "property",
};

function isMissingTableError(error: { message?: string } | null | undefined) {
  const message = String(error?.message || "");
  return (
    message.includes("Could not find the table") ||
    message.includes("relation") ||
    message.includes("does not exist")
  );
}

function toText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || "";
}

function toNullableText(value: unknown) {
  const text = toText(value);
  return text || null;
}

function toNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function toDate(value: unknown) {
  const text = toNullableText(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function hoursSince(value: unknown) {
  const date = toDate(value);
  if (!date) return Number.POSITIVE_INFINITY;
  return (Date.now() - date.getTime()) / 36e5;
}

function normalizeDivisionSlug(value: unknown) {
  const text = toText(value).toLowerCase();
  if (!text) return null;
  return DIVISION_ALIASES[text] || text;
}

function buildStaffWorkspaceHref(
  path: string,
  params?: Record<string, string | null | undefined>
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    const text = toText(value);
    if (text) {
      search.set(key, text);
    }
  }

  const query = search.toString();
  return getStaffHqUrl(query ? `${path}?${query}` : path);
}

function buildStaffQueueHref(path: string, queue: string, record?: string | null) {
  return buildStaffWorkspaceHref(path, {
    queue,
    record,
  });
}

function sumBy(rows: JsonRecord[], field: string, divisor = 1) {
  return rows.reduce((sum, row) => sum + toNumber(row[field]) / divisor, 0);
}

function isOpenStatus(value: unknown) {
  const text = toText(value).toLowerCase();
  return !["closed", "resolved", "delivered", "completed", "paid", "cancelled"].includes(text);
}

function isWalletFundingPendingStatus(value: unknown) {
  const text = toText(value).toLowerCase();
  return Boolean(
    text &&
      [
        "pending",
        "pending_verification",
        "awaiting_proof",
        "proof_uploaded",
        "review",
        "under_review",
        "submitted",
      ].includes(text)
  );
}

function isWalletWithdrawalPendingStatus(value: unknown) {
  const text = toText(value).toLowerCase();
  return Boolean(
    text &&
      !["completed", "verified", "processed", "paid", "rejected", "cancelled", "failed"].includes(
        text
      )
  );
}

function isWalletWithdrawalCompletedStatus(value: unknown) {
  const text = toText(value).toLowerCase();
  return ["completed", "verified", "processed", "paid"].includes(text);
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function isLegacyWalletFundingRow(row: JsonRecord) {
  return toText(row.reference_type).toLowerCase() === "wallet_funding_request";
}

function isLegacyWalletWithdrawalRow(row: JsonRecord) {
  return toText(row.reference_type).toLowerCase() === "wallet_withdrawal_request";
}

function mapLegacyWalletFundingRequest(row: JsonRecord): JsonRecord {
  const metadata = asRecord(row.metadata);
  const rawStatus = toText(row.status).toLowerCase();

  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at || row.created_at,
    amount_kobo: row.amount_kobo,
    status: rawStatus === "pending" ? "pending_verification" : rawStatus || "pending_verification",
    payment_reference: toNullableText(metadata.reference) || toNullableText(row.reference_id),
    provider: toNullableText(metadata.provider) || "bank_transfer",
    note: toNullableText(metadata.note),
    metadata,
  };
}

function mapLegacyWalletWithdrawalRequest(row: JsonRecord): JsonRecord {
  const metadata = asRecord(row.metadata);
  const rawStatus = toText(row.status).toLowerCase();

  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at || row.created_at,
    amount_kobo: row.amount_kobo,
    status: rawStatus === "pending" ? "pending_review" : rawStatus || "pending_review",
    payout_method_id: toNullableText(metadata.payout_method_id) || toNullableText(row.reference_id),
    payout_reference:
      toNullableText(metadata.payout_reference) ||
      toNullableText(metadata.payout_method_label) ||
      toNullableText(row.reference_id),
    metadata,
  };
}

function mergeUniqueRows(...groups: JsonRecord[][]) {
  const seen = new Set<string>();
  const merged: JsonRecord[] = [];

  for (const row of groups.flat()) {
    const key = toText(row.id);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(row);
  }

  return merged;
}

function isTrue(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function mapSeverity(score: number) {
  if (score >= 80) return "good";
  if (score >= 60) return "info";
  if (score >= 40) return "warning";
  return "critical";
}

async function safeSelect(table: string, select = "*", options?: QueryOptions) {
  try {
    const admin = createAdminSupabase();
    let query = admin.from(table).select(select);

    for (const filter of options?.filters || []) {
      const operator = filter.operator || "eq";
      if (operator === "eq") query = query.eq(filter.column, filter.value);
      if (operator === "neq") query = query.neq(filter.column, filter.value);
      if (operator === "gt") query = query.gt(filter.column, filter.value);
      if (operator === "gte") query = query.gte(filter.column, filter.value);
      if (operator === "lt") query = query.lt(filter.column, filter.value);
      if (operator === "lte") query = query.lte(filter.column, filter.value);
      if (operator === "in") query = query.in(filter.column, filter.value as unknown[]);
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? false });
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) {
      if (isMissingTableError(error)) return [] as JsonRecord[];
      throw error;
    }

    return ((data ?? []) as unknown[]) as JsonRecord[];
  } catch (error) {
    logOwnerSurfaceError("lib/owner-data.safeSelect", error, { table, select });
    return [] as JsonRecord[];
  }
}

async function safeMaybeSingle(table: string, select = "*", options?: QueryOptions) {
  const rows = await safeSelect(table, select, { ...options, limit: 1 });
  return rows[0] ?? null;
}

async function listAuthUsers(): Promise<AuthUserRecord[]> {
  try {
    const admin = createAdminSupabase();
    const users: AuthUserRecord[] = [];
    let page = 1;

    while (page <= 5) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (error) break;

      const batch = ((data?.users as AuthUserRecord[] | undefined) ?? []).map((user) => ({
        id: user.id,
        email: toNullableText(user.email),
        phone: toNullableText(user.phone),
        created_at: toNullableText(user.created_at),
        last_sign_in_at: toNullableText(user.last_sign_in_at),
        email_confirmed_at: toNullableText(user.email_confirmed_at),
        banned_until: toNullableText(user.banned_until),
        app_metadata:
          user.app_metadata && typeof user.app_metadata === "object"
            ? (user.app_metadata as JsonRecord)
            : null,
        user_metadata:
          user.user_metadata && typeof user.user_metadata === "object"
            ? (user.user_metadata as JsonRecord)
            : null,
      }));

      users.push(...batch);
      if (batch.length < 200) break;
      page += 1;
    }

    return users;
  } catch {
    return [];
  }
}

const getOwnerBaseDataset = cache(async () => {
  const [
    companySettings,
    siteSettings,
    divisionRows,
    pageRows,
    peopleRows,
    ownerProfiles,
    staffAuditLogs,
    supportThreads,
    customerActivity,
    customerNotifications,
    customerInvoices,
    walletFundingRows,
    walletWithdrawalRows,
    walletTransactionRows,
    careBookings,
    carePayments,
    careExpenses,
    careNotificationQueue,
    marketplaceOrders,
    marketplaceVendorApplications,
    marketplaceDisputes,
    marketplacePaymentRecords,
    marketplacePayoutRequests,
    marketplaceNotificationQueue,
    marketplaceAutomationRuns,
    companies,
    auditLogs,
    authUsers,
  ] = await Promise.all([
    safeMaybeSingle("company_settings"),
    safeMaybeSingle("company_site_settings"),
    safeSelect("company_divisions", "*", { orderBy: "sort_order", ascending: true }),
    safeSelect("company_pages", "*", { orderBy: "sort_order", ascending: true }),
    safeSelect("company_people", "*", { orderBy: "sort_order", ascending: true }),
    safeSelect("owner_profiles", "*", { orderBy: "created_at", ascending: false }),
    safeSelect("staff_audit_logs", "*", { orderBy: "created_at", ascending: false, limit: 80 }),
    safeSelect("support_threads", "*", { orderBy: "updated_at", ascending: false, limit: 160 }),
    safeSelect("customer_activity", "*", { orderBy: "created_at", ascending: false, limit: 240 }),
    safeSelect("customer_notifications", "*", { orderBy: "created_at", ascending: false, limit: 160 }),
    safeSelect("customer_invoices", "*", { orderBy: "created_at", ascending: false, limit: 80 }),
    safeSelect("customer_wallet_funding_requests", "*", {
      orderBy: "created_at",
      ascending: false,
      limit: 120,
    }),
    safeSelect("customer_wallet_withdrawal_requests", "*", {
      orderBy: "created_at",
      ascending: false,
      limit: 120,
    }),
    safeSelect("customer_wallet_transactions", "*", {
      orderBy: "created_at",
      ascending: false,
      limit: 240,
    }),
    safeSelect("care_bookings", "*", { orderBy: "created_at", ascending: false, limit: 120 }),
    safeSelect("care_payments", "*", { orderBy: "created_at", ascending: false, limit: 120 }),
    safeSelect("care_expenses", "*", { orderBy: "created_at", ascending: false, limit: 120 }),
    safeSelect("care_notification_queue", "*", { orderBy: "created_at", ascending: false, limit: 120 }),
    safeSelect("marketplace_orders", "*", { orderBy: "placed_at", ascending: false, limit: 80 }),
    safeSelect("marketplace_vendor_applications", "*", {
      orderBy: "submitted_at",
      ascending: false,
      limit: 80,
    }),
    safeSelect("marketplace_disputes", "*", { orderBy: "updated_at", ascending: false, limit: 80 }),
    safeSelect("marketplace_payment_records", "*", { orderBy: "created_at", ascending: false, limit: 80 }),
    safeSelect("marketplace_payout_requests", "*", { orderBy: "created_at", ascending: false, limit: 80 }),
    safeSelect("marketplace_notification_queue", "*", {
      orderBy: "created_at",
      ascending: false,
      limit: 80,
    }),
    safeSelect("marketplace_automation_runs", "*", {
      orderBy: "started_at",
      ascending: false,
      limit: 32,
    }),
    safeSelect("companies", "*", { orderBy: "created_at", ascending: false, limit: 80 }),
    safeSelect("audit_logs", "*", { orderBy: "created_at", ascending: false, limit: 80 }),
    listAuthUsers(),
  ]);

  const legacyWalletFundingRequests = walletTransactionRows
    .filter(isLegacyWalletFundingRow)
    .map(mapLegacyWalletFundingRequest);
  const legacyWalletWithdrawalRequests = walletTransactionRows
    .filter(isLegacyWalletWithdrawalRow)
    .map(mapLegacyWalletWithdrawalRequest);
  const walletFundingRequests = mergeUniqueRows(walletFundingRows, legacyWalletFundingRequests);
  const walletWithdrawalRequests = mergeUniqueRows(
    walletWithdrawalRows,
    legacyWalletWithdrawalRequests
  );

  return {
    companySettings,
    siteSettings,
    divisionRows,
    pageRows,
    peopleRows,
    ownerProfiles,
    staffAuditLogs,
    supportThreads,
    customerActivity,
    customerNotifications,
    customerInvoices,
    walletFundingRequests,
    walletWithdrawalRequests,
    careBookings,
    carePayments,
    careExpenses,
    careNotificationQueue,
    marketplaceOrders,
    marketplaceVendorApplications,
    marketplaceDisputes,
    marketplacePaymentRecords,
    marketplacePayoutRequests,
    marketplaceNotificationQueue,
    marketplaceAutomationRuns,
    companies,
    auditLogs,
    authUsers,
  };
});

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function readNestedRecord(source: JsonRecord | null | undefined, key: string) {
  const value = source?.[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => toText(entry)).filter(Boolean);
}

function readUserRole(user: AuthUserRecord, matchingPerson?: JsonRecord | null) {
  const henrycoMeta = readNestedRecord(user.app_metadata || null, "henryco");
  return (
    toText(henrycoMeta?.role) ||
    toText(user.app_metadata?.role) ||
    toText(user.user_metadata?.role) ||
    toText(matchingPerson?.role_label) ||
    toText(matchingPerson?.role_title) ||
    "staff"
  );
}

function readUserDivision(user: AuthUserRecord, matchingPerson?: JsonRecord | null) {
  const henrycoMeta = readNestedRecord(user.app_metadata || null, "henryco");
  return (
    normalizeDivisionSlug(henrycoMeta?.division) ||
    normalizeDivisionSlug(user.user_metadata?.division) ||
    normalizeDivisionSlug(matchingPerson?.division_slug) ||
    null
  );
}

function buildWorkforceMembers(dataset: Awaited<ReturnType<typeof getOwnerBaseDataset>>) {
  const peopleByEmail = new Map<string, JsonRecord>();

  for (const person of dataset.peopleRows) {
    const email = toText(person.email).toLowerCase();
    if (email && !peopleByEmail.has(email)) {
      peopleByEmail.set(email, person);
    }
  }

  const ownerUserIds = new Set(
    dataset.ownerProfiles
      .filter((row) => isTrue(row.is_active) || row.is_active == null)
      .map((row) => toText(row.user_id))
      .filter(Boolean)
  );

  return dataset.authUsers.map((user) => {
    const matchingPerson = user.email ? peopleByEmail.get(user.email.toLowerCase()) ?? null : null;
    const role = readUserRole(user, matchingPerson).toLowerCase();
    const division = readUserDivision(user, matchingPerson);
    const henrycoMeta = readNestedRecord(user.app_metadata || null, "henryco");
    const permissions = [
      ...readStringArray(henrycoMeta?.permissions),
      ...readStringArray(user.user_metadata?.permissions),
    ].filter((value, index, array) => array.indexOf(value) === index);
    const bannedUntil = toDate(user.banned_until);
    const suspended = bannedUntil ? bannedUntil.getTime() > Date.now() : false;
    const onboarding: WorkforceMember["onboarding"] = user.last_sign_in_at
      ? "live"
      : user.email_confirmed_at
        ? "confirmed"
        : "invited";

    return {
      id: user.id,
      fullName:
        toText(user.user_metadata?.full_name) ||
        toText(matchingPerson?.full_name) ||
        toText(user.email).split("@")[0] ||
        "Staff member",
      email: user.email,
      phone: toNullableText(user.user_metadata?.phone) || user.phone,
      role,
      division,
      permissions,
      status: suspended ? "suspended" : user.last_sign_in_at ? "active" : "pending",
      onboarding,
      createdAt: user.created_at,
      lastSeen: user.last_sign_in_at,
      isOwner:
        role === "owner" ||
        role === "super_owner" ||
        ownerUserIds.has(user.id) ||
        isTrue(matchingPerson?.is_owner),
      isManager:
        role.includes("manager") ||
        role.includes("lead") ||
        isTrue(matchingPerson?.is_manager),
    } satisfies WorkforceMember;
  });
}

function buildOwnerSignals(
  dataset: Awaited<ReturnType<typeof getOwnerBaseDataset>>,
  workforce: WorkforceMember[]
) {
  const signals: OwnerSignal[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const openSupport = dataset.supportThreads.filter((thread) => isOpenStatus(thread.status));
  const staleSupport = openSupport.filter((thread) => hoursSince(thread.updated_at) >= 12);
  const urgentSupport = openSupport.filter((thread) => {
    const priority = toText(thread.priority).toLowerCase();
    return priority === "urgent" || priority === "high";
  });

  if (openSupport.length) {
    signals.push({
      id: "support-open",
      title: "Support pressure is active across the company",
      body: `${openSupport.length} support threads still need movement, with ${staleSupport.length} already stale.`,
      severity: staleSupport.length >= 5 ? "critical" : "warning",
      division: null,
      href: buildStaffWorkspaceHref("/support", {
        status: "open",
      }),
      source: "support_threads",
      createdAt: toNullableText(openSupport[0]?.updated_at),
    });
  }

  if (urgentSupport.length) {
    signals.push({
      id: "support-urgent",
      title: "Urgent customer issues are waiting",
      body: `${urgentSupport.length} urgent or high-priority threads require immediate owner visibility.`,
      severity: "critical",
      division: null,
      href: buildStaffWorkspaceHref("/support", {
        thread: toText(urgentSupport[0]?.id),
      }),
      source: "support_threads",
      createdAt: toNullableText(urgentSupport[0]?.updated_at),
    });
  }

  const overdueCareBookings = dataset.careBookings.filter((booking) => {
    const pickupDate = toDate(booking.pickup_date);
    if (!pickupDate) return false;
    pickupDate.setHours(0, 0, 0, 0);
    return pickupDate < today && isOpenStatus(booking.status);
  });

  if (overdueCareBookings.length) {
    signals.push({
      id: "care-overdue",
      title: "Care bookings are running overdue",
      body: `${overdueCareBookings.length} care bookings are past the promised day without a resolved state.`,
      severity: overdueCareBookings.length >= 10 ? "critical" : "warning",
      division: "care",
      href: buildStaffQueueHref("/care", "overdue-bookings"),
      source: "care_bookings",
      createdAt: toNullableText(overdueCareBookings[0]?.updated_at),
    });
  }

  const pendingMarketplacePayouts = dataset.marketplacePayoutRequests.filter((request) =>
    ["requested", "review", "pending"].includes(toText(request.status).toLowerCase())
  );
  if (pendingMarketplacePayouts.length) {
    signals.push({
      id: "marketplace-payouts",
      title: "Marketplace payouts are waiting",
      body: `${pendingMarketplacePayouts.length} marketplace payout requests are still sitting in the review backlog.`,
      severity: pendingMarketplacePayouts.length >= 2 ? "critical" : "warning",
      division: "marketplace",
      href: buildStaffQueueHref("/marketplace", "marketplace-payouts"),
      source: "marketplace_payout_requests",
      createdAt: toNullableText(pendingMarketplacePayouts[0]?.updated_at),
    });
  }

  const pendingMarketplaceApplications = dataset.marketplaceVendorApplications.filter((row) =>
    ["submitted", "review", "pending"].includes(toText(row.status).toLowerCase())
  );
  if (pendingMarketplaceApplications.length) {
    signals.push({
      id: "marketplace-applications",
      title: "Marketplace seller onboarding needs decisions",
      body: `${pendingMarketplaceApplications.length} vendor applications are waiting for trust and moderation review.`,
      severity: "warning",
      division: "marketplace",
      href: buildStaffQueueHref("/marketplace", "vendor-review"),
      source: "marketplace_vendor_applications",
      createdAt: toNullableText(pendingMarketplaceApplications[0]?.submitted_at),
    });
  }

  const pendingInvoices = dataset.customerInvoices.filter((invoice) =>
    ["pending", "overdue"].includes(toText(invoice.status).toLowerCase())
  );
  if (pendingInvoices.length) {
    signals.push({
      id: "pending-invoices",
      title: "Cross-division invoices are still pending",
      body: `${pendingInvoices.length} customer invoices remain unpaid or unresolved across the shared platform.`,
      severity: "warning",
      division: null,
      href: buildStaffQueueHref("/finance", "pending-invoices"),
      source: "customer_invoices",
      createdAt: toNullableText(pendingInvoices[0]?.created_at),
    });
  }

  const walletFundingReview = dataset.walletFundingRequests.filter((row) =>
    isWalletFundingPendingStatus(row.status)
  );
  if (walletFundingReview.length) {
    const amountNaira = sumBy(walletFundingReview, "amount_kobo", 100);
    signals.push({
      id: "wallet-funding-review",
      title: "Wallet funding proofs are waiting for verification",
      body: `${walletFundingReview.length} wallet funding request(s) totaling ${formatCurrencyAmount(amountNaira)} still need finance confirmation.`,
      severity: walletFundingReview.length >= 3 ? "critical" : "warning",
      division: "wallet",
      href: "/owner/finance",
      source: "customer_wallet_funding_requests",
      createdAt: toNullableText(
        walletFundingReview[0]?.updated_at || walletFundingReview[0]?.created_at
      ),
    });
  }

  const walletWithdrawalsPending = dataset.walletWithdrawalRequests.filter((row) =>
    isWalletWithdrawalPendingStatus(row.status)
  );
  if (walletWithdrawalsPending.length) {
    const amountNaira = sumBy(walletWithdrawalsPending, "amount_kobo", 100);
    signals.push({
      id: "wallet-withdrawals-review",
      title: "Wallet withdrawals are waiting for payout review",
      body: `${walletWithdrawalsPending.length} withdrawal request(s) totaling ${formatCurrencyAmount(amountNaira)} are still pending finance action.`,
      severity:
        walletWithdrawalsPending.length >= 2 || amountNaira >= 250000 ? "critical" : "warning",
      division: "wallet",
      href: "/owner/finance",
      source: "customer_wallet_withdrawal_requests",
      createdAt: toNullableText(
        walletWithdrawalsPending[0]?.updated_at || walletWithdrawalsPending[0]?.created_at
      ),
    });
  }

  const failedDeliveryQueue = [...dataset.careNotificationQueue, ...dataset.marketplaceNotificationQueue].filter(
    (entry) => toText(entry.status).toLowerCase() === "failed"
  );
  if (failedDeliveryQueue.length) {
    signals.push({
      id: "messaging-failures",
      title: "Owner notification delivery is failing",
      body: `${failedDeliveryQueue.length} notification queue item(s) failed delivery. Open the messaging queue to read provider diagnostics — do not rely on raw errors in summaries.`,
      severity: "critical",
      division: normalizeDivisionSlug(failedDeliveryQueue[0].division) || "marketplace",
      href:
        normalizeDivisionSlug(failedDeliveryQueue[0].division) === "care"
          ? buildStaffQueueHref("/care", "delivery-failures")
          : buildStaffQueueHref("/marketplace", "delivery-failures"),
      source: "notification_queue",
      createdAt: toNullableText(
        failedDeliveryQueue[0].updated_at || failedDeliveryQueue[0].created_at
      ),
    });
  }

  const skippedWhatsApp = [...dataset.careNotificationQueue, ...dataset.marketplaceNotificationQueue].filter(
    (entry) =>
      toText(entry.channel).toLowerCase() === "whatsapp" &&
      toText(entry.status).toLowerCase() === "skipped"
  );
  if (skippedWhatsApp.length) {
    signals.push({
      id: "whatsapp-coverage",
      title: "WhatsApp alert coverage is incomplete",
      body: `${skippedWhatsApp.length} WhatsApp alerts were skipped because recipient contact data was missing.`,
      severity: "warning",
      division: null,
      href: buildStaffQueueHref("/operations", "delivery-failures"),
      source: "notification_queue",
      createdAt: toNullableText(skippedWhatsApp[0]?.updated_at || skippedWhatsApp[0]?.created_at),
    });
  }

  const automationRunsWithFailures = dataset.marketplaceAutomationRuns.filter((run) => {
    const summary = (run.summary as JsonRecord | null) ?? null;
    return (
      isTrue(summary?.blocked) ||
      toNumber(summary?.notificationRetryFailures) > 0 ||
      readStringArray(summary?.errors).length > 0
    );
  });
  if (automationRunsWithFailures.length) {
    signals.push({
      id: "automation-failures",
      title: "Automation sweeps are surfacing delivery risk",
      body: "Recent automation runs reported retry failures or blocked execution states.",
      severity: "warning",
      division: "marketplace",
      href: buildStaffQueueHref("/marketplace", "delivery-failures"),
      source: "marketplace_automation_runs",
      createdAt: toNullableText(automationRunsWithFailures[0]?.started_at),
    });
  }

  const studioPendingDeposits = dataset.customerActivity.filter(
    (row) =>
      normalizeDivisionSlug(row.division) === "studio" &&
      ["requested", "pending_deposit"].includes(toText(row.status).toLowerCase())
  );
  if (studioPendingDeposits.length) {
    signals.push({
      id: "studio-deposits",
      title: "Studio work is waiting on deposit confirmation",
      body: `${studioPendingDeposits.length} studio payment or project records are still sitting in pending-deposit states.`,
      severity: "warning",
      division: "studio",
      href: buildStaffQueueHref("/studio", "deposit-control"),
      source: "customer_activity",
      createdAt: toNullableText(studioPendingDeposits[0]?.created_at),
    });
  }

  const propertySubmissionQueue = dataset.supportThreads.filter(
    (thread) =>
      normalizeDivisionSlug(thread.division) === "property" &&
      toText(thread.category).toLowerCase().includes("listing") &&
      isOpenStatus(thread.status)
  );
  if (propertySubmissionQueue.length) {
    signals.push({
      id: "property-submissions",
      title: "Property submission review queue is active",
      body: `${propertySubmissionQueue.length} property listing submissions are still awaiting reply or triage.`,
      severity: "warning",
      division: "property",
      href: buildStaffQueueHref("/property", "listing-review"),
      source: "support_threads",
      createdAt: toNullableText(propertySubmissionQueue[0]?.updated_at),
    });
  }

  const pendingStaff = workforce.filter((member) => member.status === "pending");
  if (pendingStaff.length) {
    signals.push({
      id: "staff-onboarding",
      title: "Staff onboarding is incomplete",
      body: `${pendingStaff.length} staff accounts have been created or invited but have not become active yet.`,
      severity: "info",
      division: null,
      href: buildStaffQueueHref("/workforce", "pending-onboarding"),
      source: "supabase_auth",
      createdAt: pendingStaff[0]?.createdAt ?? null,
    });
  }

  return signals.sort((left, right) => {
    const severityOrder = { critical: 0, warning: 1, info: 2, good: 3 };
    return (
      severityOrder[left.severity] - severityOrder[right.severity] ||
      hoursSince(left.createdAt) - hoursSince(right.createdAt)
    );
  });
}

function buildDivisionSnapshots(
  dataset: Awaited<ReturnType<typeof getOwnerBaseDataset>>,
  workforce: WorkforceMember[],
  signals: OwnerSignal[]
) {
  const divisionRegistry = new Map<string, JsonRecord>();

  for (const row of dataset.divisionRows) {
    const slug = normalizeDivisionSlug(row.slug);
    if (slug) {
      divisionRegistry.set(slug, row);
    }
  }

  const liveDivisionSlugs = new Set<string>(OWNER_DIVISION_SLUGS);
  for (const row of [...dataset.customerActivity, ...dataset.customerNotifications, ...dataset.supportThreads]) {
    const slug = normalizeDivisionSlug(row.division);
    if (slug) liveDivisionSlugs.add(slug);
  }

  const snapshots: DivisionSnapshot[] = [];

  for (const slug of [...liveDivisionSlugs]) {
    const registry = divisionRegistry.get(slug) ?? null;
    const divisionSignals = signals.filter((signal) => signal.division === slug);
    const divisionActivity = dataset.customerActivity.filter(
      (row) => normalizeDivisionSlug(row.division) === slug
    );
    const divisionNotifications = dataset.customerNotifications.filter(
      (row) => normalizeDivisionSlug(row.division) === slug
    );
    const divisionSupport = dataset.supportThreads.filter(
      (row) => normalizeDivisionSlug(row.division) === slug && isOpenStatus(row.status)
    );

    let revenueNaira = 0;
    let workOpen = divisionSupport.length;

    if (slug === "care") {
      revenueNaira = sumBy(dataset.carePayments, "amount");
      workOpen += dataset.careBookings.filter((row) => isOpenStatus(row.status)).length;
    }
    if (slug === "marketplace") {
      revenueNaira = dataset.marketplacePaymentRecords
        .filter((row) => toText(row.status).toLowerCase() === "verified")
        .reduce((sum, row) => sum + toNumber(row.amount), 0);
      workOpen += dataset.marketplaceOrders.filter((row) => isOpenStatus(row.status)).length;
      workOpen += dataset.marketplaceVendorApplications.filter((row) =>
        ["submitted", "review", "pending"].includes(toText(row.status).toLowerCase())
      ).length;
      workOpen += dataset.marketplaceDisputes.filter((row) => isOpenStatus(row.status)).length;
    }
    if (slug === "learn") {
      revenueNaira = dataset.customerInvoices
        .filter(
          (row) =>
            normalizeDivisionSlug(row.division) === "learn" &&
            toText(row.status).toLowerCase() === "paid"
        )
        .reduce((sum, row) => sum + toNumber(row.total_kobo) / 100, 0);
      workOpen += dataset.customerInvoices.filter(
        (row) =>
          normalizeDivisionSlug(row.division) === "learn" &&
          ["pending", "overdue"].includes(toText(row.status).toLowerCase())
      ).length;
    }
    if (slug === "jobs") {
      workOpen += dataset.companies.length;
    }
    if (slug === "studio") {
      workOpen += divisionActivity.filter((row) =>
        ["pending_deposit", "requested", "accepted", "in_progress"].includes(
          toText(row.status).toLowerCase()
        )
      ).length;
    }
    if (slug === "property") {
      workOpen += divisionSupport.filter((row) =>
        toText(row.category).toLowerCase().includes("listing")
      ).length;
    }

    const divisionWorkforce = workforce.filter((member) => member.division === slug);
    const recentActivity = [
      ...divisionActivity.map((row) => ({
        id: `activity-${toText(row.id)}`,
        title: toText(row.title) || toText(row.activity_type) || "Activity update",
        description: toText(row.description) || "New activity was recorded.",
        createdAt: toNullableText(row.created_at),
        status: toNullableText(row.status),
        source: "activity",
      })),
      ...divisionSupport.map((row) => ({
        id: `support-${toText(row.id)}`,
        title: toText(row.subject) || "Support thread",
        description: `${toText(row.category) || "General"} · ${toText(row.status) || "open"}`,
        createdAt: toNullableText(row.updated_at || row.created_at),
        status: toNullableText(row.status),
        source: "support",
      })),
      ...divisionNotifications.map((row) => ({
        id: `notification-${toText(row.id)}`,
        title: toText(row.title) || "Notification",
        description: toText(row.body) || "Customer-facing update generated.",
        createdAt: toNullableText(row.created_at),
        status: toNullableText(row.priority),
        source: "notification",
      })),
    ]
      .sort((left, right) => hoursSince(left.createdAt) - hoursSince(right.createdAt))
      .slice(0, 6);

    const livePressure = workOpen + divisionSignals.length * 2 + divisionSupport.length;
    const healthScore = clamp(
      recentActivity.length || revenueNaira || workOpen
        ? 88 - divisionSignals.filter((signal) => signal.severity === "critical").length * 24
            - divisionSignals.filter((signal) => signal.severity === "warning").length * 12
            - Math.min(18, divisionSupport.length * 2)
            - Math.min(14, Math.max(0, livePressure - 8))
        : 34,
      18,
      96
    );

    snapshots.push({
      slug,
      label: divisionLabel(slug),
      displayName: toText(registry?.name) || divisionLabel(slug),
      accent: toText(registry?.accent) || divisionColor(slug),
      primaryUrl: toNullableText(registry?.primary_url),
      subdomain: toNullableText(registry?.subdomain),
      status: toText(registry?.status) || (recentActivity.length ? "live" : "building"),
      healthScore,
      healthLabel:
        healthScore >= 80
          ? "Stable"
          : healthScore >= 60
            ? "Watch"
            : healthScore >= 40
              ? "Pressured"
              : "Critical",
      revenueNaira,
      supportOpen: divisionSupport.length,
      workOpen,
      alertCount: divisionSignals.length,
      staffingCount: divisionWorkforce.length,
      onboardingPending: divisionWorkforce.filter((member) => member.status === "pending").length,
      recentActivityCount: recentActivity.length,
      recentActivity,
      signals: divisionSignals,
    });
  }

  return snapshots.sort((left, right) => {
    const preferredOrder = OWNER_DIVISION_SLUGS.indexOf(left.slug as (typeof OWNER_DIVISION_SLUGS)[number]);
    const preferredOther = OWNER_DIVISION_SLUGS.indexOf(right.slug as (typeof OWNER_DIVISION_SLUGS)[number]);
    return (preferredOrder === -1 ? 99 : preferredOrder) - (preferredOther === -1 ? 99 : preferredOther);
  });
}

export type OwnerBriefing = {
  headline: string;
  focus: string;
  nextSteps: { title: string; href: string; reason: string; severity: OwnerSignal["severity"] }[];
  divisionPressure: { slug: string; label: string; healthScore: number; note: string }[];
  commsHealth: {
    failedDeliveries: number;
    skippedWhatsApp: number;
    openSupportThreads: number;
    queuedNotifications: number;
  };
};

function buildOwnerBriefing(
  signals: OwnerSignal[],
  divisions: DivisionSnapshot[],
  dataset: Awaited<ReturnType<typeof getOwnerBaseDataset>>
): OwnerBriefing {
  const critical = signals.filter((s) => s.severity === "critical");
  const warnings = signals.filter((s) => s.severity === "warning");
  const pressured = divisions.filter((d) => d.healthScore < 62).slice(0, 6);

  const headline =
    critical.length > 0
      ? `${critical.length} critical issue(s) need owner attention now.`
      : warnings.length > 0
        ? `${warnings.length} warning(s) are active — schedule time to clear the backlog.`
        : "Operations look steady across tracked divisions.";

  const focus =
    critical[0]?.body ||
    warnings[0]?.body ||
    "No urgent signals fired on the latest dataset pull. Spot-check divisions with low telemetry to confirm data is flowing.";

  const nextSteps = signals.slice(0, 6).map((s) => ({
    title: s.title,
    href: s.href,
    reason: s.body,
    severity: s.severity,
  }));

  const failedDeliveries = [...dataset.careNotificationQueue, ...dataset.marketplaceNotificationQueue].filter(
    (entry) => toText(entry.status).toLowerCase() === "failed"
  ).length;
  const skippedWhatsApp = [...dataset.careNotificationQueue, ...dataset.marketplaceNotificationQueue].filter(
    (entry) =>
      toText(entry.channel).toLowerCase() === "whatsapp" &&
      toText(entry.status).toLowerCase() === "skipped"
  ).length;
  const openSupportThreads = dataset.supportThreads.filter((thread) => isOpenStatus(thread.status)).length;
  const queuedNotifications =
    dataset.careNotificationQueue.length + dataset.marketplaceNotificationQueue.length;

  return {
    headline,
    focus,
    nextSteps,
    divisionPressure: pressured.map((d) => ({
      slug: d.slug,
      label: d.label,
      healthScore: d.healthScore,
      note:
        d.signals[0]?.body ||
        (d.recentActivityCount
          ? `${d.recentActivityCount} recent events logged.`
          : "Limited recent activity in telemetry."),
    })),
    commsHealth: {
      failedDeliveries,
      skippedWhatsApp,
      openSupportThreads,
      queuedNotifications,
    },
  };
}

function buildHelperInsights(signals: OwnerSignal[]) {
  const insights: {
    id: string;
    title: string;
    body: string;
    href: string;
    severity: OwnerSignal["severity"];
  }[] = [];

  for (const signal of signals) {
    if (signal.id === "messaging-failures") {
      insights.push({
        id: "fix-owner-email-sender",
        title: "Stabilize notification delivery",
        body: "Open the messaging queue, identify the failing channel (email, SMS, WhatsApp), and fix configuration or templates. Provider details stay in the queue rows — resolve at source rather than masking.",
        href: signal.href,
        severity: "critical",
      });
    }
    if (signal.id === "staff-onboarding") {
      insights.push({
        id: "close-open-invites",
        title: "Finish dormant staff onboarding",
        body: "Some invited people have not completed their first sign-in. Review division assignment and re-send invitations before expanding the team further.",
        href: signal.href,
        severity: "info",
      });
    }
    if (signal.id === "care-overdue") {
      insights.push({
        id: "care-sla-recovery",
        title: "Run a care SLA recovery sweep",
        body: "Overdue care bookings are visible in the live booking table. Focus on status progression, payment closure, and customer reassurance before queue age increases further.",
        href: signal.href,
        severity: "warning",
      });
    }
    if (signal.id === "wallet-funding-review") {
      insights.push({
        id: "wallet-proof-review",
        title: "Clear wallet proof verification backlog",
        body: "Open the finance center, confirm bank-transfer proofs, and resolve the oldest wallet requests before customers assume their balance is available.",
        href: "/owner/finance",
        severity: "critical",
      });
    }
    if (signal.id === "wallet-withdrawals-review") {
      insights.push({
        id: "wallet-payout-review",
        title: "Release pending wallet withdrawals deliberately",
        body: "Review payout-account validity, confirm the withdrawable balance trail, and either process or reject each pending withdrawal with a documented reason.",
        href: "/owner/finance",
        severity: "critical",
      });
    }
  }

  return insights.filter(
    (insight, index, items) => items.findIndex((item) => item.id === insight.id) === index
  );
}

export async function getOwnerOverviewData() {
  const dataset = await getOwnerBaseDataset();
  const workforce = buildWorkforceMembers(dataset);
  const signals = buildOwnerSignals(dataset, workforce);
  const divisions = buildDivisionSnapshots(dataset, workforce, signals);
  const totalRevenueNaira = divisions.reduce((sum, division) => sum + division.revenueNaira, 0);
  const totalExpenseNaira = dataset.careExpenses
    .filter((row) => toText(row.approval_status).toLowerCase() !== "voided")
    .reduce((sum, row) => sum + toNumber(row.amount), 0);
  const activeStaff = workforce.filter((member) => member.status === "active").length;
  const queuedNotifications = [...dataset.careNotificationQueue, ...dataset.marketplaceNotificationQueue].length;
  const companyTitle = toText(dataset.companySettings?.brand_title) || "Henry & Co.";
  const briefing = buildOwnerBriefing(signals, divisions, dataset);

  return {
    companyTitle,
    companyName: toText(dataset.companySettings?.company_name) || companyTitle,
    dataHealthNote:
      "Workforce profiles, audit history, and sign-in activity are synchronized from your live HenryCo account records. If a metric looks stale, refresh after the person completes their latest sign-in.",
    metrics: {
      divisionsLive: divisions.filter((division) => division.status !== "building").length,
      totalRevenueNaira,
      totalExpenseNaira,
      openSupport: dataset.supportThreads.filter((thread) => isOpenStatus(thread.status)).length,
      activeStaff,
      queuedNotifications,
      criticalSignals: signals.filter((signal) => signal.severity === "critical").length,
    },
    executiveDigest:
      signals[0]?.severity === "critical"
        ? `Immediate owner attention is required. ${signals[0].title}. ${signals[0].body}`
        : `The central command center is live across ${divisions.length} tracked divisions with ${signals.length} current operational signals.`,
    signals: signals.slice(0, 8),
    divisions,
    recentAudit: (() => {
      const wf = buildWorkforceMembers(dataset);
      const byId = buildWorkforceIdentityMap(wf);
      return [...dataset.staffAuditLogs, ...dataset.auditLogs]
        .map((row) => {
          const rec = row as JsonRecord;
          return {
            id: toText(row.id),
            action: toText(row.action || row.event_type || row.entity || "system.event"),
            actor: formatAuditActorDisplay(rec, byId),
            createdAt: toNullableText(row.created_at),
          };
        })
        .slice(0, 8);
    })(),
    helperInsights: buildHelperInsights(signals),
    briefing,
  };
}

export async function getDivisionCenterData() {
  const dataset = await getOwnerBaseDataset();
  const workforce = buildWorkforceMembers(dataset);
  const signals = buildOwnerSignals(dataset, workforce);
  const divisions = buildDivisionSnapshots(dataset, workforce, signals);

  return {
    divisions,
    companySignals: signals,
    liveDivisions: divisions.filter((division) => division.status !== "building").length,
    totalRevenueNaira: divisions.reduce((sum, division) => sum + division.revenueNaira, 0),
  };
}

export async function getDivisionDetailData(slugInput: string) {
  const dataset = await getOwnerBaseDataset();
  const workforce = buildWorkforceMembers(dataset);
  const signals = buildOwnerSignals(dataset, workforce);
  const divisions = buildDivisionSnapshots(dataset, workforce, signals);
  const slug = normalizeDivisionSlug(slugInput) || slugInput;
  const division = divisions.find((entry) => entry.slug === slug);

  if (!division) {
    return null;
  }

  const relatedInvoices = dataset.customerInvoices.filter(
    (row) => normalizeDivisionSlug(row.division) === slug
  );
  const relatedSupport = dataset.supportThreads.filter(
    (row) => normalizeDivisionSlug(row.division) === slug
  );
  const relatedNotifications = dataset.customerNotifications.filter(
    (row) => normalizeDivisionSlug(row.division) === slug
  );

  return {
    division,
    finance: {
      revenueNaira: division.revenueNaira,
      pendingInvoices: relatedInvoices.filter((row) =>
        ["pending", "overdue"].includes(toText(row.status).toLowerCase())
      ).length,
      pendingValueNaira: relatedInvoices
        .filter((row) => ["pending", "overdue"].includes(toText(row.status).toLowerCase()))
        .reduce((sum, row) => sum + toNumber(row.total_kobo) / 100, 0),
    },
    workforce: workforce.filter((member) => member.division === slug),
    supportThreads: relatedSupport.slice(0, 12),
    notifications: relatedNotifications.slice(0, 12),
    auditTail: [...dataset.staffAuditLogs, ...dataset.auditLogs]
      .filter((row) => normalizeDivisionSlug(row.division) === slug || toText(row.entity) === slug)
      .slice(0, 12),
  };
}

export async function getOperationsCenterData() {
  const dataset = await getOwnerBaseDataset();
  const workforce = buildWorkforceMembers(dataset);
  const signals = buildOwnerSignals(dataset, workforce);
  const divisions = buildDivisionSnapshots(dataset, workforce, signals);

  return {
    metrics: {
      openSupport: dataset.supportThreads.filter((thread) => isOpenStatus(thread.status)).length,
      staleSupport: dataset.supportThreads.filter(
        (thread) => isOpenStatus(thread.status) && hoursSince(thread.updated_at) >= 12
      ).length,
      openCareBookings: dataset.careBookings.filter((row) => isOpenStatus(row.status)).length,
      marketplaceQueues:
        dataset.marketplaceVendorApplications.filter((row) =>
          ["submitted", "review", "pending"].includes(toText(row.status).toLowerCase())
        ).length +
        dataset.marketplaceDisputes.filter((row) => isOpenStatus(row.status)).length,
      pendingInvoices: dataset.customerInvoices.filter((row) =>
        ["pending", "overdue"].includes(toText(row.status).toLowerCase())
      ).length,
    },
    alerts: signals.filter((signal) => signal.severity !== "good"),
    recentActivity: dataset.customerActivity.slice(0, 16),
    divisions,
  };
}

export async function getFinanceCenterData() {
  const dataset = await getOwnerBaseDataset();
  const workforce = buildWorkforceMembers(dataset);
  const signals = buildOwnerSignals(dataset, workforce);
  const divisions = buildDivisionSnapshots(dataset, workforce, signals);
  const pendingWalletFundingRequests = dataset.walletFundingRequests.filter((row) =>
    isWalletFundingPendingStatus(row.status)
  );
  const pendingWalletWithdrawals = dataset.walletWithdrawalRequests.filter((row) =>
    isWalletWithdrawalPendingStatus(row.status)
  );
  const completedWalletWithdrawals = dataset.walletWithdrawalRequests.filter((row) =>
    isWalletWithdrawalCompletedStatus(row.status)
  );
  const totalRevenueNaira = divisions.reduce((sum, division) => sum + division.revenueNaira, 0);
  const totalExpenseNaira =
    dataset.careExpenses
      .filter((row) => toText(row.approval_status).toLowerCase() !== "voided")
      .reduce((sum, row) => sum + toNumber(row.amount), 0) +
    sumBy(completedWalletWithdrawals, "amount_kobo", 100);

  const revenueByDivision = divisions.map((division) => ({
    slug: division.slug,
    label: division.label,
    valueNaira: division.revenueNaira,
  }));

  return {
    revenueByDivision,
    pendingInvoices: dataset.customerInvoices.filter((row) =>
      ["pending", "overdue"].includes(toText(row.status).toLowerCase())
    ),
    pendingPayouts: dataset.marketplacePayoutRequests.filter((row) =>
      ["requested", "review", "pending"].includes(toText(row.status).toLowerCase())
    ),
    recentPayments: [
      ...dataset.carePayments.map((row) => ({
        id: `care-${toText(row.id)}`,
        division: "care",
        label: toText(row.payment_no) || "Care payment",
        amountNaira: toNumber(row.amount),
        status: "received",
        createdAt: toNullableText(row.created_at),
      })),
      ...dataset.marketplacePaymentRecords.map((row) => ({
        id: `marketplace-${toText(row.id)}`,
        division: "marketplace",
        label: toText(row.reference) || toText(row.order_no) || "Marketplace payment",
        amountNaira: toNumber(row.amount),
        status: toText(row.status) || "unknown",
        createdAt: toNullableText(row.created_at),
      })),
      ...dataset.customerInvoices.map((row) => ({
        id: `invoice-${toText(row.id)}`,
        division: normalizeDivisionSlug(row.division) || "learn",
        label: toText(row.invoice_no) || "Invoice",
        amountNaira: toNumber(row.total_kobo) / 100,
        status: toText(row.status) || "unknown",
        createdAt: toNullableText(row.created_at),
      })),
      ...dataset.walletFundingRequests.map((row) => ({
        id: `wallet-funding-${toText(row.id)}`,
        division: "wallet",
        label: toText(row.payment_reference) || "Wallet funding request",
        amountNaira: toNumber(row.amount_kobo) / 100,
        status: toText(row.status) || "unknown",
        createdAt: toNullableText(row.updated_at || row.created_at),
      })),
      ...dataset.walletWithdrawalRequests.map((row) => ({
        id: `wallet-withdrawal-${toText(row.id)}`,
        division: "wallet",
        label: toText(row.payout_reference) || "Wallet withdrawal request",
        amountNaira: toNumber(row.amount_kobo) / 100,
        status: toText(row.status) || "unknown",
        createdAt: toNullableText(row.updated_at || row.created_at),
      })),
    ]
      .sort((left, right) => hoursSince(left.createdAt) - hoursSince(right.createdAt))
      .slice(0, 18),
    pendingWalletFundingRequests,
    pendingWalletWithdrawals,
    moneyMovement: {
      recognizedRevenueNaira: totalRevenueNaira,
      recordedOutflowNaira: totalExpenseNaira,
      walletFundingPendingNaira: sumBy(pendingWalletFundingRequests, "amount_kobo", 100),
      walletWithdrawalPendingNaira: sumBy(pendingWalletWithdrawals, "amount_kobo", 100),
    },
    alerts: signals.filter((signal) =>
      [
        "marketplace-payouts",
        "pending-invoices",
        "messaging-failures",
        "wallet-funding-review",
        "wallet-withdrawals-review",
      ].includes(signal.id)
    ),
  };
}

export async function getWorkforceCenterData() {
  const dataset = await getOwnerBaseDataset();
  const workforce = buildWorkforceMembers(dataset);
  const divisionSummary = OWNER_DIVISION_SLUGS.map((slug) => ({
    slug,
    label: divisionLabel(slug),
    active: workforce.filter((member) => member.division === slug && member.status === "active").length,
    pending: workforce.filter((member) => member.division === slug && member.status === "pending").length,
    suspended: workforce.filter((member) => member.division === slug && member.status === "suspended").length,
  }));

  return {
    members: workforce,
    divisionSummary,
    audit: dataset.staffAuditLogs.slice(0, 20),
    peopleRows: dataset.peopleRows,
    ownerProfiles: dataset.ownerProfiles,
    permissionOptions: WORKFORCE_PERMISSION_OPTIONS,
    metrics: {
      total: workforce.length,
      active: workforce.filter((member) => member.status === "active").length,
      pending: workforce.filter((member) => member.status === "pending").length,
      suspended: workforce.filter((member) => member.status === "suspended").length,
      owners: workforce.filter((member) => member.isOwner).length,
      managers: workforce.filter((member) => member.isManager).length,
    },
    dataHealthNote:
      "Role and permission updates are saved to each member’s HenryCo account profile and recorded in the workforce audit log for traceability.",
  };
}

export async function getMessagingCenterData() {
  const dataset = await getOwnerBaseDataset();
  const queues = [...dataset.careNotificationQueue, ...dataset.marketplaceNotificationQueue].map((row) => ({
    id: toText(row.id),
    channel: toText(row.channel) || "unknown",
    division:
      normalizeDivisionSlug(row.division) ||
      (toText(row.template_key).includes("market") ? "marketplace" : "care"),
    recipient: toText(row.recipient) || "unknown",
    subject: toText(row.subject) || toText(row.template_key) || "Notification",
    status: toText(row.status) || "queued",
    error: toText(row.last_error || row.error_message),
    createdAt: toNullableText(row.created_at),
    updatedAt: toNullableText(row.updated_at || row.created_at),
  }));

  return {
    queues,
    automationRuns: dataset.marketplaceAutomationRuns,
    alerts: queues.filter((row) => ["failed", "skipped"].includes(row.status.toLowerCase())),
    metrics: {
      total: queues.length,
      failed: queues.filter((row) => row.status.toLowerCase() === "failed").length,
      skipped: queues.filter((row) => row.status.toLowerCase() === "skipped").length,
      sent: queues.filter((row) => row.status.toLowerCase() === "sent").length,
    },
  };
}

export async function getBrandCenterData() {
  const dataset = await getOwnerBaseDataset();
  return {
    companySettings: dataset.companySettings,
    siteSettings: dataset.siteSettings,
    divisions: dataset.divisionRows,
    pages: dataset.pageRows,
  };
}

export async function getHelperCenterData() {
  const dataset = await getOwnerBaseDataset();
  const workforce = buildWorkforceMembers(dataset);
  const signals = buildOwnerSignals(dataset, workforce);
  const divisions = buildDivisionSnapshots(dataset, workforce, signals);

  return {
    signals,
    insights: buildHelperInsights(signals),
    briefing: buildOwnerBriefing(signals, divisions, dataset),
    scorecards: divisions.map((division) => ({
      slug: division.slug,
      label: division.label,
      severity: mapSeverity(division.healthScore),
      healthScore: division.healthScore,
      summary:
        division.signals[0]?.body ||
        (division.recentActivityCount
          ? `${division.recentActivityCount} recent events are already flowing into the central graph.`
          : "No live operational telemetry detected yet."),
    })),
  };
}

export async function getAuditHistoryPageData(options?: {
  limit?: number;
  view?: "risk" | "all";
  q?: string;
}) {
  const limit = Math.min(400, Math.max(60, options?.limit ?? 200));
  const view = options?.view === "all" ? "all" : "risk";
  const q = (options?.q || "").trim().toLowerCase();

  const [staffAuditLogs, auditLogs, navAudit] = await Promise.all([
    safeSelect("staff_audit_logs", "*", { orderBy: "created_at", ascending: false, limit }),
    safeSelect("audit_logs", "*", { orderBy: "created_at", ascending: false, limit }),
    safeSelect("staff_navigation_audit", "*", { orderBy: "created_at", ascending: false, limit: 80 }),
  ]);

  type AuditRow = JsonRecord & { _source?: string };
  const staff: AuditRow[] = (staffAuditLogs as AuditRow[]).map((row) => ({
    ...(row as JsonRecord),
    _source: "staff",
  }));
  const general: AuditRow[] = (auditLogs as AuditRow[]).map((row) => ({
    ...(row as JsonRecord),
    _source: "platform",
  }));
  const nav = (navAudit as AuditRow[]).map((row) => ({
    ...(row as JsonRecord),
    _source: "navigation" as const,
  }));

  const merged = [...staff, ...general].sort(
    (a, b) =>
      new Date(toText(b.created_at)).getTime() - new Date(toText(a.created_at)).getTime()
  );

  const isRiskRow = (row: AuditRow) => {
    const action = toText(row.action || row.event_type).toLowerCase();
    return (
      action.includes("permission") ||
      action.includes("role") ||
      action.includes("security") ||
      action.includes("owner") ||
      action.includes("payout") ||
      action.includes("wallet")
    );
  };

  let rows: AuditRow[] = view === "risk" ? merged.filter(isRiskRow) : merged;
  if (q) {
    rows = rows.filter((row) => {
      const blob = `${row.action || ""} ${row.event_type || ""} ${row.entity || ""} ${row.entity_id || ""} ${row.actor_role || ""} ${row.reason || ""}`.toLowerCase();
      return blob.includes(q);
    });
  }

  const dataset = await getOwnerBaseDataset();
  const workforce = buildWorkforceMembers(dataset);
  const identityByUserId = buildWorkforceIdentityMap(workforce);

  type AuditHistoryRow = AuditRow & { actorLabel: string; entityLabel: string };

  const enriched: AuditHistoryRow[] = rows.slice(0, limit).map((row) => {
    const rec = row as JsonRecord;
    return {
      ...row,
      actorLabel: formatAuditActorDisplay(rec, identityByUserId),
      entityLabel: formatAuditEntityDisplay(rec, identityByUserId),
    };
  });

  return {
    rows: enriched,
    navigationTail: nav as Array<JsonRecord & { _source: "navigation" }>,
    view,
    query: options?.q || "",
  };
}

export async function getWorkforceMemberById(userId: string): Promise<WorkforceMember | null> {
  const dataset = await getOwnerBaseDataset();
  const workforce = buildWorkforceMembers(dataset);
  return workforce.find((m) => m.id === userId) ?? null;
}

export async function getSecurityCenterData() {
  const dataset = await getOwnerBaseDataset();
  const workforce = buildWorkforceMembers(dataset);
  const riskyAuditEvents = [...dataset.staffAuditLogs, ...dataset.auditLogs].filter((row) => {
    const action = toText(row.action || row.event_type).toLowerCase();
    return (
      action.includes("permission") ||
      action.includes("role") ||
      action.includes("security") ||
      action.includes("owner")
    );
  });

  return {
    metrics: {
      owners: dataset.ownerProfiles.length,
      suspendedUsers: workforce.filter((member) => member.status === "suspended").length,
      pendingInvites: workforce.filter((member) => member.status === "pending").length,
      riskyEvents: riskyAuditEvents.length,
    },
    ownerProfiles: dataset.ownerProfiles,
    riskyAuditEvents: riskyAuditEvents.slice(0, 24),
    staffAudit: dataset.staffAuditLogs.slice(0, 24),
  };
}
