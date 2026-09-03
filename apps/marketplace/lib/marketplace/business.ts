import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3-57 — public business profile reads for the marketplace storefront.
 *
 * The ONLY anonymous read path is the grant-locked SECURITY DEFINER RPC
 * get_business_public_profile(slug), which returns public columns of an ACTIVE
 * business only (pending/suspended/closed -> null -> 404). business_registration,
 * created_by and the member roster are never exposed here.
 */
export type PublicBusinessProfile = {
  id: string;
  slug: string;
  tradingName: string;
  legalName: string;
  country: string;
  verifiedAt: string | null;
  status: string;
};

export async function getPublicBusinessProfile(slug: string): Promise<PublicBusinessProfile | null> {
  let admin;
  try {
    admin = createAdminSupabase();
  } catch {
    return null;
  }
  const { data, error } = await admin.rpc("get_business_public_profile", { p_slug: slug });
  if (error || !data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  const r = row as {
    id: string;
    slug: string;
    trading_name: string;
    legal_name: string;
    country: string;
    verified_at: string | null;
    status: string;
  };
  return {
    id: r.id,
    slug: r.slug,
    tradingName: r.trading_name,
    legalName: r.legal_name,
    country: r.country,
    verifiedAt: r.verified_at,
    status: r.status,
  };
}

/**
 * Best-effort record of a public business-profile view into the shared
 * customer_activity event stream (so V3-57 insights can aggregate views).
 * Mirrors the envelope written by HenryEventNames.BUSINESS_PROFILE_VIEWED
 * (apps/account/lib/intelligence-rollout.ts) — kept self-contained so the
 * marketplace app needs no @henryco/intelligence dependency. Never throws.
 *
 * NOTE: fires per server render; view-event sampling/throttling is a future
 * hardening to avoid customer_activity write amplification at scale.
 */
const BUSINESS_PROFILE_VIEWED = "henry.business.profile.viewed";

export async function recordBusinessProfileView(input: {
  businessId: string;
  viewerUserId: string | null;
}): Promise<void> {
  try {
    const admin = createAdminSupabase();
    await admin.from("customer_activity").insert({
      user_id: input.viewerUserId,
      division: "account",
      activity_type: `intel:${BUSINESS_PROFILE_VIEWED}`,
      title: "Business profile viewed",
      description: "A public business profile was viewed.",
      status: "recorded",
      reference_type: "intel_event",
      reference_id: `business_profile_view:${input.businessId}`,
      metadata: {
        businessId: input.businessId,
        event_name: BUSINESS_PROFILE_VIEWED,
        anonymous: input.viewerUserId === null,
      },
    } as never);
  } catch {
    // telemetry is best-effort
  }
}
