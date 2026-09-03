import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import { SELLER_TIER_RANK, type SellerTier } from "./seller-tier-engine";

/**
 * V3-58 — resolve the public-facing seller tier for a marketplace vendor.
 *
 * seller_tiers is keyed on the V3-57 business identity and is RLS member-read, so a
 * PUBLIC (anonymous) storefront cannot read it directly. This server-only helper
 * bridges vendor → business via marketplace_vendors.owner_user_id ∈ business_members
 * and reads the tier with the service-role client. A vendor with no linked business
 * (the common case until businesses link to vendors) resolves to 'none' → no badge.
 *
 * Returns the HIGHEST tier among the owner's businesses. Fail-safe: any error
 * resolves to 'none' (logged, never thrown) so a storefront never breaks on it.
 */
export async function resolveSellerTierForVendor(
  vendorId: string | null | undefined,
): Promise<SellerTier> {
  if (!vendorId) return "none";
  let admin;
  try {
    admin = createAdminSupabase();
  } catch {
    // No service role configured (e.g. local/CI without secrets) — no badge.
    return "none";
  }
  try {
    const { data: vendor } = await admin
      .from("marketplace_vendors")
      .select("owner_user_id")
      .eq("id", vendorId)
      .maybeSingle();
    const ownerUserId = (vendor as { owner_user_id?: string | null } | null)?.owner_user_id;
    if (!ownerUserId) return "none";

    const { data: memberships } = await admin
      .from("business_members")
      .select("business_id")
      .eq("user_id", ownerUserId);
    const businessIds = ((memberships ?? []) as Array<{ business_id: string }>).map((r) => r.business_id);
    if (businessIds.length === 0) return "none";

    const { data: tiers } = await admin
      .from("seller_tiers")
      .select("tier")
      .in("business_id", businessIds);

    let best: SellerTier = "none";
    for (const row of (tiers ?? []) as Array<{ tier?: string }>) {
      const t = row.tier;
      if ((t === "bronze" || t === "silver" || t === "gold") && SELLER_TIER_RANK[t] > SELLER_TIER_RANK[best]) {
        best = t;
      }
    }
    return best;
  } catch (e) {
    console.warn("[seller-tier] resolveSellerTierForVendor failed", {
      vendorId,
      error: e instanceof Error ? e.message : String(e),
    });
    return "none";
  }
}
