import "server-only";

import { getAccountUrl } from "@henryco/config";
import { createStaffAdminSupabase } from "@/lib/supabase/admin";

function toText(value: unknown) {
  return String(value ?? "").trim();
}

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export type FundingRequest = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amountKobo: number;
  status: string;
  createdAt: string;
  proofUrl: string | null;
  href: string;
};

export type WithdrawalRequest = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amountKobo: number;
  status: string;
  payoutMethodLabel: string;
  createdAt: string;
  href: string;
};

export type FinanceSummary = {
  pendingFunding: number;
  pendingFundingCount: number;
  pendingWithdrawals: number;
  pendingWithdrawalCount: number;
  recentFunding: FundingRequest[];
  recentWithdrawals: WithdrawalRequest[];
};

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const admin = createStaffAdminSupabase();

  const [fundingRes, withdrawalRes] = await Promise.all([
    admin
      .from("customer_wallet_transactions")
      .select("id, user_id, amount_kobo, status, reference_type, metadata, created_at")
      .eq("reference_type", "wallet_funding_request")
      .in("status", ["pending_verification", "pending", "submitted"])
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("customer_wallet_transactions")
      .select("id, user_id, amount_kobo, status, reference_type, metadata, created_at")
      .eq("reference_type", "withdrawal_request")
      .in("status", ["pending", "processing"])
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const funding = (fundingRes.data ?? []) as Array<Record<string, unknown>>;
  const withdrawals = (withdrawalRes.data ?? []) as Array<Record<string, unknown>>;

  // Resolve user names in bulk.
  const allUserIds = [
    ...new Set([
      ...funding.map((r) => toText(r.user_id)),
      ...withdrawals.map((r) => toText(r.user_id)),
    ]),
  ].filter(Boolean);

  const { data: profiles } = allUserIds.length
    ? await admin
        .from("customer_profiles")
        .select("id, full_name, email")
        .in("id", allUserIds)
    : { data: [] as Array<Record<string, unknown>> };

  const profileMap = new Map(
    (profiles || []).map((p: Record<string, unknown>) => [
      toText(p.id),
      { name: toText(p.full_name), email: toText(p.email) },
    ])
  );

  const pendingFunding = funding.reduce(
    (sum, r) => sum + toNumber(r.amount_kobo),
    0
  );
  const pendingWithdrawals = withdrawals.reduce(
    (sum, r) => sum + Math.abs(toNumber(r.amount_kobo)),
    0
  );

  return {
    pendingFunding,
    pendingFundingCount: funding.length,
    pendingWithdrawals,
    pendingWithdrawalCount: withdrawals.length,
    recentFunding: funding.slice(0, 20).map((r) => {
      const uid = toText(r.user_id);
      const profile = profileMap.get(uid);
      const metadata = (r.metadata as Record<string, unknown>) || {};
      return {
        id: toText(r.id),
        userId: uid,
        userEmail: profile?.email || "",
        userName: profile?.name || "User",
        amountKobo: toNumber(r.amount_kobo),
        status: toText(r.status),
        createdAt: toText(r.created_at),
        proofUrl: toText(metadata.proof_url) || null,
        href: getAccountUrl(`/wallet/funding/${toText(r.id)}`),
      };
    }),
    recentWithdrawals: withdrawals.slice(0, 20).map((r) => {
      const uid = toText(r.user_id);
      const profile = profileMap.get(uid);
      const metadata = (r.metadata as Record<string, unknown>) || {};
      return {
        id: toText(r.id),
        userId: uid,
        userEmail: profile?.email || "",
        userName: profile?.name || "User",
        amountKobo: Math.abs(toNumber(r.amount_kobo)),
        status: toText(r.status),
        payoutMethodLabel: toText(metadata.payout_label) || "Bank transfer",
        createdAt: toText(r.created_at),
        href: getAccountUrl(`/wallet/withdrawals?request=${encodeURIComponent(toText(r.id))}`),
      };
    }),
  };
}
