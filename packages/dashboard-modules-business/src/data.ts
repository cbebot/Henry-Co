import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import { resolveActingContextForUser } from "@henryco/auth/server/acting-context";
import { createDataAdminClient } from "@henryco/data";

/**
 * Module-local data layer for the business (Henry Onyx Business) home
 * widgets. Mirrors the marketplace/wallet template: every read runs
 * through the typed admin client and nothing mutates state.
 *
 * The real surface (`apps/account/app/(account)/business/page.tsx`) is
 * gated only by `requireAccountUser()` — any authenticated viewer — and
 * lists businesses via `listMyBusinesses()`, which is itself RLS-scoped
 * (a viewer only ever sees businesses they belong to). This layer
 * reproduces that membership-scoped read against the same
 * `business_members → businesses` relationship, explicitly filtered to
 * `user_id = viewer.user.id`, so the admin client never widens what a
 * viewer can see beyond their own memberships.
 *
 * The acting context (personal vs business) is resolved through the
 * canonical `resolveActingContextForUser` from
 * `@henryco/auth/server/acting-context` — the same signed-cookie +
 * live-`business_members` re-check the page uses. The cookie carries
 * intent only; the role is re-derived server-side every call.
 *
 * `business_members` is not in the generated `Database` type, and the
 * generated `businesses` Row is a DIFFERENT (public marketing) table —
 * so both the table name and the embedded join are reached through an
 * `as never` cast, mirroring the untyped-table posture in
 * `dashboard-modules-wallet/src/data.ts`.
 */

export const BUSINESS_HOME_HREF = "/business";

export type BusinessRole = "owner" | "admin" | "member";
export type BusinessStatus = "pending" | "active" | "suspended" | "closed";

/** One business the viewer belongs to, with their role and the business's status. */
export type BusinessMembershipView = {
  id: string;
  slug: string;
  /** Trading name if set, else the registered legal name. */
  name: string;
  role: BusinessRole;
  status: BusinessStatus;
  verifiedAt: string | null;
};

/** The viewer's current acting context — personal, or acting on a business's behalf. */
export type BusinessActingView = {
  kind: "personal" | "business";
  businessId: string | null;
  /** Resolved from the viewer's membership list when acting as a business. */
  businessName: string | null;
  role: BusinessRole | null;
};

export type BusinessSnapshot = {
  businesses: ReadonlyArray<BusinessMembershipView>;
  businessesCount: number;
  acting: BusinessActingView;
};

function isRole(value: unknown): value is BusinessRole {
  return value === "owner" || value === "admin" || value === "member";
}

function normalizeStatus(value: unknown): BusinessStatus {
  return value === "active" || value === "suspended" || value === "closed"
    ? value
    : "pending";
}

type BusinessJoinRow = {
  id: string;
  slug: string;
  legal_name: string;
  trading_name: string | null;
  status: string | null;
  verified_at: string | null;
};

/**
 * Build the business snapshot for the current viewer. Returns null when
 * there is no authenticated user id (the rail renders nothing). A viewer
 * with no memberships returns a non-null snapshot with an empty list —
 * the widgets render the honest entry-point state, never a fake metric.
 */
export async function loadBusinessSnapshot(
  viewer: UnifiedViewer,
): Promise<BusinessSnapshot | null> {
  const userId = viewer.user.id;
  if (!userId) return null;

  const client = createDataAdminClient();

  const membersRes = await client
    .from("business_members" as never)
    .select(
      "role, joined_at, businesses!inner(id, slug, legal_name, trading_name, status, verified_at)",
    )
    .eq("user_id", userId)
    .order("joined_at", { ascending: true });

  const rows = ((membersRes as { data: unknown }).data ?? []) as Array<{
    role: string | null;
    joined_at: string | null;
    businesses: BusinessJoinRow | BusinessJoinRow[] | null;
  }>;

  const businesses: BusinessMembershipView[] = [];
  for (const row of rows) {
    const biz = Array.isArray(row.businesses) ? row.businesses[0] : row.businesses;
    if (!biz || !isRole(row.role)) continue;
    businesses.push({
      id: biz.id,
      slug: biz.slug,
      name: biz.trading_name || biz.legal_name,
      role: row.role,
      status: normalizeStatus(biz.status),
      verifiedAt: biz.verified_at,
    });
  }

  const acting = await readActingView(userId, businesses);

  return {
    businesses,
    businessesCount: businesses.length,
    acting,
  };
}

async function readActingView(
  userId: string,
  businesses: ReadonlyArray<BusinessMembershipView>,
): Promise<BusinessActingView> {
  let ctx: Awaited<ReturnType<typeof resolveActingContextForUser>>;
  try {
    ctx = await resolveActingContextForUser(userId);
  } catch {
    return { kind: "personal", businessId: null, businessName: null, role: null };
  }

  if (ctx.kind === "business") {
    const match = businesses.find((b) => b.id === ctx.businessId);
    return {
      kind: "business",
      businessId: ctx.businessId,
      businessName: match?.name ?? null,
      role: ctx.role,
    };
  }

  return { kind: "personal", businessId: null, businessName: null, role: null };
}
