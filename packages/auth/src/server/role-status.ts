import "server-only";

/**
 * V3-02 S3 — per-role status badges for the role chooser screen.
 *
 * Reads the active viewer's role memberships + per-role "needs your
 * attention" counts and returns a structured array the chooser can
 * render. Per Addendum A9 the endpoint serving this MUST gate to
 * the requesting user's own data — this helper is the single place
 * where that data shape is defined so the endpoint stays a thin
 * wrapper that only adds the authorization check.
 *
 * Counts come from:
 *   - customer: customer_notifications.is_read = false (existing
 *     `getUnreadNotificationCount` pattern in apps/account/lib/account-data)
 *   - staff: support_threads assigned to the operator + still open
 *   - owner: verification_submissions awaiting review (KYC queue)
 *
 * "Pending actions" differs from unread notifications — a
 * notification can be informational, a pending action is something
 * the user must do. The current shape conflates them only when the
 * underlying table doesn't distinguish; future work can split.
 *
 * "Last visited" uses cookies (`hc_visit_<key>`) written by the
 * dashboard layouts. When the cookie is absent the value is null
 * and the chooser falls back to "you haven't been here yet".
 */

import { cookies } from "next/headers";

import type { AccessSnapshot } from "../types";

export type RoleStatusKey = "customer" | "staff" | "owner";

export type RoleStatus = {
  key: RoleStatusKey;
  unreadCount: number;
  pendingActions: number;
  lastVisitedAt: number | null;
};

/**
 * Minimal Supabase client surface the helper needs — only the `from`
 * builder for read-only count queries. Mirrors how
 * `@henryco/observability/audit-log` keeps its dependency loose.
 */
export type RoleStatusSupabaseClient = {
  from: (table: string) => {
    select: (
      columns: string,
      options?: { count?: "exact" | "planned" | "estimated"; head?: boolean },
    ) => {
      eq: (column: string, value: unknown) => unknown;
      is?: (column: string, value: unknown) => unknown;
    };
  };
};

type CountQuery = (admin: AnyClient) => Promise<number>;

// We accept any client shape that supports the supabase-js read
// builder API. The narrow type above is for the public interface;
// internally we cast through `any` because chained builders are
// hard to model without coupling to the actual supabase-js types.
type AnyClient = ReturnType<RoleStatusSupabaseClient["from"]> extends infer R ? R : never;

async function safeCount(query: CountQuery, admin: unknown): Promise<number> {
  try {
    const result = await query(admin as AnyClient);
    return typeof result === "number" && Number.isFinite(result) && result >= 0 ? result : 0;
  } catch {
    return 0;
  }
}

async function customerUnread(admin: unknown, userId: string): Promise<number> {
  return safeCount(async () => {
    const builder = (admin as RoleStatusSupabaseClient)
      .from("customer_notifications")
      .select("id", { count: "exact", head: true });
    const filtered = (builder as unknown as { eq: (k: string, v: unknown) => unknown })
      .eq("user_id", userId);
    const final = (filtered as unknown as { eq: (k: string, v: unknown) => unknown })
      .eq("is_read", false);
    const { count } = (await (final as unknown as Promise<{ count: number | null }>)) ?? {
      count: 0,
    };
    return count ?? 0;
  }, admin);
}

async function staffOpenSupport(admin: unknown, userId: string): Promise<number> {
  return safeCount(async () => {
    const builder = (admin as RoleStatusSupabaseClient)
      .from("support_threads")
      .select("id", { count: "exact", head: true });
    const filtered = (builder as unknown as { eq: (k: string, v: unknown) => unknown })
      .eq("assigned_to", userId);
    const final = (filtered as unknown as { eq: (k: string, v: unknown) => unknown })
      .eq("status", "open");
    const { count } = (await (final as unknown as Promise<{ count: number | null }>)) ?? {
      count: 0,
    };
    return count ?? 0;
  }, admin);
}

async function ownerPendingKyc(admin: unknown): Promise<number> {
  return safeCount(async () => {
    const builder = (admin as RoleStatusSupabaseClient)
      .from("verification_submissions")
      .select("id", { count: "exact", head: true });
    const final = (builder as unknown as { eq: (k: string, v: unknown) => unknown })
      .eq("status", "pending");
    const { count } = (await (final as unknown as Promise<{ count: number | null }>)) ?? {
      count: 0,
    };
    return count ?? 0;
  }, admin);
}

function visitCookieName(key: RoleStatusKey): string {
  return `hc_visit_${key}`;
}

async function readLastVisited(key: RoleStatusKey): Promise<number | null> {
  const jar = await cookies();
  const raw = jar.get(visitCookieName(key))?.value;
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Derive the badge payload for the chooser. Returns one entry per
 * role the viewer holds access to, in the canonical chooser order
 * (owner → staff → customer).
 *
 * `admin` is the caller's Supabase client. The endpoint MUST scope
 * `customerUnread` / `staffOpenSupport` queries to the requester's
 * own user_id — this helper enforces that by accepting `userId`
 * directly and using it in the WHERE clause.
 *
 * The `pendingActions` count is currently:
 *   - customer: 0 (no per-customer action queue exists yet — V3-93
 *     privacy rights queue will surface here)
 *   - staff: 0 (the support thread queue counts as unread for now;
 *     SLA-overdue threads can populate this once V3-44 ships)
 *   - owner: pending KYC submissions
 */
export async function readRoleStatuses({
  access,
  userId,
  admin,
}: {
  access: AccessSnapshot;
  userId: string;
  admin: unknown;
}): Promise<RoleStatus[]> {
  const statuses: RoleStatus[] = [];

  if (access.hasOwnerAccess) {
    const [pendingActions, lastVisitedAt] = await Promise.all([
      ownerPendingKyc(admin),
      readLastVisited("owner"),
    ]);
    statuses.push({
      key: "owner",
      unreadCount: 0,
      pendingActions,
      lastVisitedAt,
    });
  }

  if (access.hasStaffAccess) {
    const [unreadCount, lastVisitedAt] = await Promise.all([
      staffOpenSupport(admin, userId),
      readLastVisited("staff"),
    ]);
    statuses.push({
      key: "staff",
      unreadCount,
      pendingActions: 0,
      lastVisitedAt,
    });
  }

  // Customer is always present — every authenticated user has the
  // personal account lane, regardless of staff/owner status.
  const [unreadCount, lastVisitedAt] = await Promise.all([
    customerUnread(admin, userId),
    readLastVisited("customer"),
  ]);
  statuses.push({
    key: "customer",
    unreadCount,
    pendingActions: 0,
    lastVisitedAt,
  });

  return statuses;
}

export const VISIT_COOKIE_PREFIX = "hc_visit_";
