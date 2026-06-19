import "server-only";

import { normalizeVerificationStatus, type SharedVerificationStatus } from "@henryco/trust";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * V3-57 — business data layer (server-only).
 *
 * Reads run through the caller's cookie-bound client so RLS is the authority
 * (a member only ever sees businesses they belong to). The service-role admin
 * client is used ONLY to resolve other members' display names/emails (their
 * customer_profiles rows aren't readable by a peer under RLS) — and only for the
 * roster of a business the caller has already been confirmed a member of.
 */

export type BusinessRole = "owner" | "admin" | "member";
export type BusinessStatus = "pending" | "active" | "suspended" | "closed";
export type BusinessPartnerType =
  | "marketplace_seller"
  | "service_provider"
  | "employer"
  | "studio_client"
  | "logistics_shipper";

export type BusinessRecord = {
  id: string;
  slug: string;
  legalName: string;
  tradingName: string | null;
  registration: string | null;
  country: string;
  partnerType: BusinessPartnerType;
  status: BusinessStatus;
  verifiedAt: string | null;
  createdAt: string;
};

export type BusinessMembership = { business: BusinessRecord; role: BusinessRole };

export type BusinessMemberRow = {
  userId: string;
  role: BusinessRole;
  joinedAt: string;
  displayName: string | null;
  email: string | null;
};

export type BusinessInvitationRow = {
  id: string;
  email: string;
  role: Exclude<BusinessRole, "owner">;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
};

type BusinessDbRow = {
  id: string;
  slug: string;
  legal_name: string;
  trading_name: string | null;
  business_registration: string | null;
  country: string;
  primary_partner_type: BusinessPartnerType;
  status: BusinessStatus;
  verified_at: string | null;
  created_at: string;
};

function mapBusiness(row: BusinessDbRow): BusinessRecord {
  return {
    id: row.id,
    slug: row.slug,
    legalName: row.legal_name,
    tradingName: row.trading_name,
    registration: row.business_registration,
    country: row.country,
    partnerType: row.primary_partner_type,
    status: row.status,
    verifiedAt: row.verified_at,
    createdAt: row.created_at,
  };
}

const BUSINESS_COLUMNS =
  "id, slug, legal_name, trading_name, business_registration, country, primary_partner_type, status, verified_at, created_at";

function isRole(value: unknown): value is BusinessRole {
  return value === "owner" || value === "admin" || value === "member";
}

/** Every business the caller belongs to, with their role. RLS-scoped read. */
export async function listMyBusinesses(): Promise<BusinessMembership[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("business_members")
    .select(`role, businesses!inner(${BUSINESS_COLUMNS})`)
    .order("joined_at", { ascending: true });
  if (error || !data) return [];
  const out: BusinessMembership[] = [];
  for (const row of data as Array<{ role: string; businesses: BusinessDbRow | BusinessDbRow[] }>) {
    const biz = Array.isArray(row.businesses) ? row.businesses[0] : row.businesses;
    if (biz && isRole(row.role)) out.push({ business: mapBusiness(biz), role: row.role });
  }
  return out;
}

/** The caller's membership of a business by slug, or null if they aren't a member. */
export async function getBusinessMembershipBySlug(
  slug: string,
): Promise<BusinessMembership | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("businesses")
    .select(BUSINESS_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  const business = mapBusiness(data as BusinessDbRow);

  const { data: me } = await supabase
    .from("business_members")
    .select("role")
    .eq("business_id", business.id)
    .maybeSingle();
  const role = (me as { role?: string } | null)?.role;
  if (!isRole(role)) return null;
  return { business, role };
}

/** Roster with display names/emails (admin read — caller must already be a member). */
export async function getBusinessMembers(businessId: string): Promise<BusinessMemberRow[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("business_members")
    .select("user_id, role, joined_at")
    .eq("business_id", businessId)
    .order("joined_at", { ascending: true });
  if (error || !data) return [];

  const rows = data as Array<{ user_id: string; role: string; joined_at: string }>;
  const ids = rows.map((r) => r.user_id);
  const profiles = await resolveProfiles(ids);

  return rows
    .filter((r): r is { user_id: string; role: BusinessRole; joined_at: string } => isRole(r.role))
    .map((r) => ({
      userId: r.user_id,
      role: r.role,
      joinedAt: r.joined_at,
      displayName: profiles.get(r.user_id)?.name ?? null,
      email: profiles.get(r.user_id)?.email ?? null,
    }));
}

/** Pending (unaccepted) invitations for a business. RLS-scoped (owner/admin). */
export async function getBusinessInvitations(
  businessId: string,
): Promise<BusinessInvitationRow[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("business_invitations")
    .select("id, email, role, invited_by, expires_at, created_at, accepted_at")
    .eq("business_id", businessId)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  const rows = data as Array<{
    id: string;
    email: string;
    role: string;
    invited_by: string;
    expires_at: string;
    created_at: string;
  }>;
  return rows
    .filter((r): r is typeof r & { role: "admin" | "member" } => r.role === "admin" || r.role === "member")
    .map((r) => ({
      id: r.id,
      email: r.email,
      role: r.role,
      invitedBy: r.invited_by,
      expiresAt: r.expires_at,
      createdAt: r.created_at,
    }));
}

/**
 * Verification fallback until KYC (V3-24) lands: a business is "verified" only
 * when status='active' AND verified_at is set; otherwise it is in manual review.
 * Mirrors the @henryco/trust state vocabulary so downstream gates compose.
 */
export function businessVerificationStatus(business: BusinessRecord): SharedVerificationStatus {
  if (business.status === "active" && business.verifiedAt) return "verified";
  if (business.status === "suspended" || business.status === "closed") return "rejected";
  return normalizeVerificationStatus(business.status === "active" ? "verified" : "pending");
}

export type BusinessInsights = {
  hasStream: boolean; // false => "no data yet" (V3-08 truth rule)
  orders: number;
  bookings: number;
  jobPosts: number;
  profileViews: number;
};

/**
 * Aggregate a business's activity from the @henryco/intelligence event stream
 * (customer_activity rows tagged with metadata.businessId). Brand-new businesses
 * have an empty stream -> hasStream=false so the surface shows the honest
 * "no data yet" state rather than a misleading zero.
 */
export async function getBusinessInsights(businessId: string): Promise<BusinessInsights> {
  const empty: BusinessInsights = {
    hasStream: false,
    orders: 0,
    bookings: 0,
    jobPosts: 0,
    profileViews: 0,
  };
  let admin;
  try {
    admin = createAdminSupabase();
  } catch {
    return empty;
  }
  const { data, error } = await admin
    .from("customer_activity")
    .select("activity_type, metadata")
    .filter("metadata->>businessId", "eq", businessId)
    .limit(2000);
  if (error || !data || data.length === 0) return empty;

  const rows = data as Array<{ activity_type: string | null; metadata: Record<string, unknown> | null }>;
  let orders = 0;
  let bookings = 0;
  let jobPosts = 0;
  let profileViews = 0;
  for (const row of rows) {
    const type = String(row.activity_type ?? "");
    if (type.includes("order")) orders += 1;
    else if (type.includes("booking")) bookings += 1;
    else if (type.includes("job")) jobPosts += 1;
    else if (type.endsWith("business.profile.viewed")) profileViews += 1;
  }
  return { hasStream: true, orders, bookings, jobPosts, profileViews };
}

async function resolveProfiles(
  userIds: string[],
): Promise<Map<string, { name: string | null; email: string | null }>> {
  const out = new Map<string, { name: string | null; email: string | null }>();
  if (userIds.length === 0) return out;
  let admin;
  try {
    admin = createAdminSupabase();
  } catch {
    return out;
  }
  const { data } = await admin
    .from("customer_profiles")
    .select("id, full_name, email")
    .in("id", userIds);
  for (const row of (data ?? []) as Array<{ id: string; full_name: string | null; email: string | null }>) {
    out.set(row.id, { name: row.full_name, email: row.email });
  }
  return out;
}
