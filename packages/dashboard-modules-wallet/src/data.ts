import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import { createDataAdminClient } from "@henryco/data";

/**
 * Module-local data layer for the wallet home widgets. Returns a single
 * typed snapshot that the widgets render against. Issues all reads in
 * parallel via the typed admin client; each branch handles its own
 * missing-row case so a single empty table doesn't cascade into a
 * widget-level error.
 *
 * Per V2 scope §"NOT permitted in DASH-3: New API surfaces — module
 * home widgets read existing API/DB." No new state-changing endpoints.
 *
 * Three tables this layer reads (`customer_wallet_funding_requests`,
 * `customer_wallet_withdrawal_requests`, `customer_payout_methods`) are
 * not in the generated `Database` type yet — the typed admin client's
 * `.from()` overloads don't list them. Calls use `as never` to bypass
 * the typed-table check, mirroring the same untyped-client posture
 * `apps/account/lib/account-data.ts` uses via `createAdminSupabase`.
 * A future Supabase types regeneration removes the casts.
 */

export type WalletTransactionRow = {
  id: string;
  amountKobo: number;
  direction: "credit" | "debit";
  type: string | null;
  status: string | null;
  description: string | null;
  division: string | null;
  createdAt: string;
};

export type WalletPayoutMethod = {
  id: string;
  type: string | null;
  label: string | null;
  bankName: string | null;
  lastFour: string | null;
  isDefault: boolean;
};

export type WalletSnapshot = {
  /** kobo — `customer_wallets.balance_kobo` minus pending withdrawal hold. */
  availableBalanceKobo: number;
  /** kobo — raw wallet balance (before withdrawal hold). */
  rawBalanceKobo: number;
  /** Display currency from the wallet row (typically NGN). */
  currency: string;
  /** Sum of pending funding-request amounts (status not in {completed, verified}). */
  pendingFundingKobo: number;
  /** Count of pending funding requests. */
  pendingFundingCount: number;
  /** kobo — sum of pending withdrawal amounts (under finance review). */
  pendingWithdrawalKobo: number;
  /** Recent transactions, newest first, capped at 5 for the home-widget surface. */
  recentTransactions: ReadonlyArray<WalletTransactionRow>;
  /** Active payout methods (deduped between the dedicated table + legacy). */
  payoutMethods: ReadonlyArray<WalletPayoutMethod>;
  /** Convenience — `payoutMethods.length`. */
  payoutMethodCount: number;
};

const PENDING_FUNDING_STATUSES = new Set([
  "pending",
  "pending_verification",
  "awaiting_proof",
  "submitted",
  "in_review",
]);

const PENDING_WITHDRAWAL_STATUSES = new Set([
  "pending",
  "pending_review",
  "awaiting_review",
  "in_review",
  "submitted",
]);

const CREDIT_TYPES = new Set(["credit", "refund", "bonus", "cashback"]);

/**
 * Build the wallet snapshot for the current viewer. Returns null when
 * the viewer is not eligible (e.g. owner/staff lanes). The customer-only
 * gate is enforced upstream in `getRoleGate`; this method's null is a
 * defensive net for direct callers.
 */
export async function loadWalletSnapshot(
  viewer: UnifiedViewer,
): Promise<WalletSnapshot | null> {
  if (viewer.kind !== "customer") return null;
  const client = createDataAdminClient();
  const userId = viewer.user.id;

  // Tables not in the generated Database type — cast through `as never`
  // to bypass the typed-table overload check. See file-header note.
  const [walletRes, txRes, fundingRes, withdrawalRes, payoutRes, legacyPayoutRes] =
    await Promise.all([
      client
        .from("customer_wallets")
        .select("id, balance_kobo, currency, is_active")
        .eq("user_id", userId)
        .maybeSingle(),
      client
        .from("customer_wallet_transactions")
        .select(
          "id, amount_kobo, type, status, description, division, created_at, reference_type",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(40),
      client
        .from("customer_wallet_funding_requests" as never)
        .select("id, amount_kobo, status")
        .eq("user_id", userId),
      client
        .from("customer_wallet_withdrawal_requests" as never)
        .select("id, amount_kobo, status")
        .eq("user_id", userId),
      client
        .from("customer_payout_methods" as never)
        .select("id, type, label, bank_name, last_four, is_default")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("is_default", { ascending: false }),
      client
        .from("customer_payment_methods")
        .select("id, type, label, last_four, bank_name, is_default")
        .eq("user_id", userId),
    ]);

  const wallet = walletRes.data;
  const rawBalanceKobo = Number(wallet?.balance_kobo ?? 0);
  const currency = String(wallet?.currency ?? "NGN");

  const fundingRows = ((fundingRes as { data: unknown }).data ?? []) as Array<{
    amount_kobo: number | string | null;
    status: string | null;
  }>;
  const pendingFunding = fundingRows.filter((row) =>
    PENDING_FUNDING_STATUSES.has(String(row.status ?? "").toLowerCase()),
  );
  const pendingFundingKobo = pendingFunding.reduce(
    (sum, row) => sum + (Number(row.amount_kobo) || 0),
    0,
  );

  const withdrawalRows = ((withdrawalRes as { data: unknown }).data ?? []) as Array<{
    amount_kobo: number | string | null;
    status: string | null;
  }>;
  const pendingWithdrawalKobo = withdrawalRows
    .filter((row) =>
      PENDING_WITHDRAWAL_STATUSES.has(String(row.status ?? "").toLowerCase()),
    )
    .reduce((sum, row) => sum + (Number(row.amount_kobo) || 0), 0);

  const availableBalanceKobo = Math.max(0, rawBalanceKobo - pendingWithdrawalKobo);

  const txRows = (txRes.data ?? []) as Array<{
    id: string;
    amount_kobo: number | string | null;
    type: string | null;
    status: string | null;
    description: string | null;
    division: string | null;
    created_at: string;
    reference_type: string | null;
  }>;
  const recentTransactions: WalletTransactionRow[] = txRows
    .filter((row) => {
      // Hide pending funding-request mirror rows so the recent-list
      // doesn't double-count what `pendingFundingKobo` already shows.
      const status = String(row.status ?? "").toLowerCase();
      if (
        row.reference_type === "wallet_funding_request" &&
        status !== "completed" &&
        status !== "verified"
      ) {
        return false;
      }
      return true;
    })
    .slice(0, 5)
    .map((row) => {
      const amountKobo = Math.abs(Number(row.amount_kobo) || 0);
      const typeLower = String(row.type ?? "").toLowerCase();
      // Direction is derived from the `type` column (matches the
      // pattern in apps/account/app/(account)/wallet/page.tsx). The
      // schema does not have a `direction` column on
      // `customer_wallet_transactions`.
      const direction: "credit" | "debit" = CREDIT_TYPES.has(typeLower)
        ? "credit"
        : "debit";
      return {
        id: row.id,
        amountKobo,
        direction,
        type: row.type,
        status: row.status,
        description: row.description,
        division: row.division,
        createdAt: row.created_at,
      };
    });

  const payoutRows = ((payoutRes as { data: unknown }).data ?? []) as Array<{
    id: string;
    type: string | null;
    label: string | null;
    bank_name: string | null;
    last_four: string | null;
    is_default: boolean | null;
  }>;
  const legacyPayoutRows = (legacyPayoutRes.data ?? []) as Array<{
    id: string;
    type: string | null;
    label: string;
    last_four: string | null;
    bank_name: string | null;
    is_default: boolean | null;
  }>;

  // De-dupe by id between the dedicated payout table and legacy payment
  // table, mirroring `apps/account/lib/account-data.ts:getPayoutMethods`.
  // Dedicated rows win.
  const seenIds = new Set<string>();
  const dedupedPayouts: WalletPayoutMethod[] = [];
  for (const row of payoutRows) {
    seenIds.add(row.id);
    dedupedPayouts.push({
      id: row.id,
      type: row.type,
      label: row.label,
      bankName: row.bank_name,
      lastFour: row.last_four,
      isDefault: Boolean(row.is_default),
    });
  }
  for (const row of legacyPayoutRows) {
    if (seenIds.has(row.id)) continue;
    dedupedPayouts.push({
      id: row.id,
      type: row.type,
      label: row.label,
      bankName: row.bank_name,
      lastFour: row.last_four,
      isDefault: Boolean(row.is_default),
    });
  }

  return {
    availableBalanceKobo,
    rawBalanceKobo,
    currency,
    pendingFundingKobo,
    pendingFundingCount: pendingFunding.length,
    pendingWithdrawalKobo,
    recentTransactions,
    payoutMethods: dedupedPayouts,
    payoutMethodCount: dedupedPayouts.length,
  };
}

/**
 * SMART (2026-07-10) — trust-aware withdrawal nudge. True when the viewer is
 * NOT identity-verified: withdrawals are KYC-gated, so the wallet surfaces one
 * calm nudge with the exact unlock step instead of letting the viewer discover
 * the gate at the withdrawal form. Real profile state only; any read failure
 * suppresses the nudge (never fabricate urgency).
 */
export async function loadNeedsVerificationNudge(viewer: UnifiedViewer): Promise<boolean> {
  if (viewer.kind !== "customer") return false;
  const client = createDataAdminClient();
  try {
    const { data } = await client
      .from("customer_profiles")
      .select("verification_status, is_verified")
      .eq("id", viewer.user.id)
      .maybeSingle();
    const row = data as {
      verification_status?: string | null;
      is_verified?: boolean | null;
    } | null;
    if (!row) return false;
    const status = String(row.verification_status || "").toLowerCase();
    const verified = row.is_verified === true || status === "verified";
    return !verified;
  } catch {
    return false;
  }
}
