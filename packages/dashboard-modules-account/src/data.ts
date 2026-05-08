import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import { createDataAdminClient, getDashboardSummary, type CustomerSummary } from "@henryco/data";

/**
 * Module-local data layer. Returns a single typed snapshot the
 * widgets render against. The cross-division reads come from
 * `@henryco/data`'s `getDashboardSummary`; everything that's not yet
 * in `@henryco/data` (wallet funding context, saved items count,
 * derived trust tier) is read directly here via the typed admin
 * client.
 *
 * Server-only — Next.js will fail the build if a client component
 * imports anything below.
 */

export type CustomerOverviewSnapshot = {
  /** Discriminated to avoid leaking owner/staff variants. */
  summary: CustomerSummary;
  /** Pending wallet-funding kobo (sum of pending verification rows). */
  pendingFundingKobo: number;
  /** Active saved-items count for `WishlistShortcut` reuse + WelcomeBack widget hint. */
  savedItemsCount: number;
  /** Coarse trust band derived from `customer_profiles.verification_status` + `is_verified`. */
  trustTier: TrustTier;
  /** Numeric trust progress (0-100) — used as the metric's context number. */
  trustScore: number;
  /** Human label for the trust tier — e.g. "Trusted member". */
  trustLabel: string;
  /** Whether the user has any documents on file (gates the next-tier copy). */
  hasDocuments: boolean;
};

export type TrustTier = "unverified" | "verified" | "trusted" | "premium";

const TRUST_LABELS: Record<TrustTier, string> = {
  unverified: "Unverified",
  verified: "Verified",
  trusted: "Trusted member",
  premium: "Premium member",
};

/**
 * Derive a coarse trust band from the live `customer_profiles` row
 * plus document count. The full `apps/account/lib/trust.ts` resolver
 * has 12 inputs and computes a 0-100 score; the module's metric
 * card surfaces a simplified band that maps to the same display
 * vocabulary the existing `TrustTierCard` uses.
 */
function deriveTrustTier(opts: {
  verificationStatus: string | null | undefined;
  isVerified: boolean | null | undefined;
  documentCount: number;
  walletPositive: boolean;
  hasOrders: boolean;
}): { tier: TrustTier; score: number } {
  const status = String(opts.verificationStatus ?? "").toLowerCase();
  const verified = Boolean(opts.isVerified) || status === "approved" || status === "verified";

  // Score: 0-100 from 4 binary signals + verification.
  let score = 0;
  if (verified) score += 40;
  if (opts.documentCount >= 1) score += 20;
  if (opts.documentCount >= 3) score += 10;
  if (opts.walletPositive) score += 15;
  if (opts.hasOrders) score += 15;

  let tier: TrustTier = "unverified";
  if (score >= 90) tier = "premium";
  else if (score >= 65) tier = "trusted";
  else if (score >= 35) tier = "verified";

  return { tier, score: Math.min(score, 100) };
}

/**
 * Build the snapshot the customer-overview widgets render against.
 * Issues all reads in parallel; each branch handles its own missing-
 * row case so a single empty table doesn't cascade into a widget-
 * level error.
 */
export async function loadCustomerOverviewSnapshot(
  viewer: UnifiedViewer,
): Promise<CustomerOverviewSnapshot | null> {
  if (viewer.kind !== "customer") return null;
  const client = createDataAdminClient();
  const userId = viewer.user.id;

  const [summary, fundingRes, savedRes, profileRes, documentsRes] = await Promise.all([
    getDashboardSummary(viewer),
    client
      .from("customer_wallet_transactions")
      .select("amount_kobo, status")
      .eq("user_id", userId)
      .eq("reference_type", "wallet_funding_request"),
    client
      .from("saved_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active"),
    client
      .from("customer_profiles")
      .select("verification_status, is_verified")
      .eq("id", userId)
      .maybeSingle(),
    client
      .from("customer_documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  if (summary.kind !== "customer") return null;

  const pendingFundingKobo = (fundingRes.data ?? [])
    .filter((row) => {
      const status = String(row.status ?? "").toLowerCase();
      return status === "pending" || status === "pending_verification";
    })
    .reduce((acc, row) => acc + (Number(row.amount_kobo) || 0), 0);

  const documentCount = documentsRes.count ?? 0;
  const { tier, score } = deriveTrustTier({
    verificationStatus: profileRes.data?.verification_status,
    isVerified: profileRes.data?.is_verified,
    documentCount,
    walletPositive: summary.wallet.balanceKobo > 0,
    hasOrders: summary.recentInvoices.length > 0,
  });

  return {
    summary,
    pendingFundingKobo,
    savedItemsCount: savedRes.count ?? 0,
    trustTier: tier,
    trustScore: score,
    trustLabel: TRUST_LABELS[tier],
    hasDocuments: documentCount > 0,
  };
}
