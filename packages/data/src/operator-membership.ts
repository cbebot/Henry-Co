import "server-only";

import {
  filterGrantedMemberships,
  getDivisionUrl,
  normalizeEmail,
  type MembershipGrantRow,
} from "@henryco/config";

import { createDataAdminClient } from "./client";

/**
 * Shared operator-window membership read (AWARE-SP4).
 *
 * The dashboard is the RECORD; the division workspace is the TOOL. An operator
 * WINDOW surfaces a viewer's supply-side standing (vendor, agent, instructor,
 * studio team, …) + a deep-link into the real division workspace — never a
 * re-implementation of it. Every division that stores operator standing in a
 * `<division>_role_memberships` table detects it the SAME way here, through the
 * shared grant predicate, so a window and its division can never disagree about
 * who is an operator.
 *
 * This is deliberately a single tiny read (one table, granted rows only). It
 * runs per home-render for the modules that surface an operator window; the
 * division's snapshot loader stays responsible for the customer data.
 */

export type OperatorMembershipViewer = {
  user: { id: string; email: string | null; emailVerified?: boolean } | null;
};

export type OperatorMembershipResult = {
  /** True when the viewer holds at least one active, granted membership. */
  isOperator: boolean;
  /** The granted membership roles (deduped), most-relevant order preserved. */
  roles: string[];
  /** Granted membership scope ids (e.g. the vendor/store id) — deduped. */
  scopeIds: string[];
  /** The division workspace URL (cross-domain — served by the division app). */
  workspaceHref: string;
};

type RoleMembershipRow = MembershipGrantRow & {
  role?: string | null;
  scope_id?: string | null;
};

/**
 * Read whether `viewer` is a granted operator in `table`, and build the
 * cross-domain workspace href from the division config.
 *
 * @param table  the `<division>_role_memberships` table name
 * @param division  the division key, for `getDivisionUrl`
 * @param workspacePath  the operator console path on the division site (e.g. "/agent")
 */
export async function loadOperatorMembership(
  viewer: OperatorMembershipViewer,
  opts: { table: string; division: Parameters<typeof getDivisionUrl>[0]; workspacePath: string },
): Promise<OperatorMembershipResult | null> {
  if (!viewer.user) return null;

  const userId = viewer.user.id;
  const email = normalizeEmail(viewer.user.email);
  const emailVerified = Boolean(viewer.user.emailVerified);

  const filter = email
    ? `user_id.eq.${userId},normalized_email.eq.${email}`
    : `user_id.eq.${userId}`;

  // The typed client keys row shapes off a LITERAL table name; this helper is
  // deliberately generic over `<division>_role_memberships`, so read through a
  // narrow query shim rather than let the type instantiation blow up (TS2589).
  type MembershipQuery = {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (
          column: string,
          value: boolean,
        ) => {
          or: (
            filter: string,
          ) => Promise<{ data: RoleMembershipRow[] | null; error: unknown }>;
        };
      };
    };
  };
  const client = createDataAdminClient() as unknown as MembershipQuery;

  const { data, error } = await client
    .from(opts.table)
    .select("role, scope_id, user_id, normalized_email, is_active")
    .eq("is_active", true)
    .or(filter);

  if (error) return null;

  const granted = filterGrantedMemberships(data ?? [], {
    userId,
    normalizedEmail: email,
    emailVerified,
  });
  if (granted.length === 0) return null;

  const roles = Array.from(
    new Set(granted.map((row) => String(row.role || "").trim()).filter(Boolean)),
  );
  const scopeIds = Array.from(
    new Set(granted.map((row) => String(row.scope_id || "").trim()).filter(Boolean)),
  );

  const origin = getDivisionUrl(opts.division).replace(/\/$/, "");
  const path = opts.workspacePath.startsWith("/")
    ? opts.workspacePath
    : `/${opts.workspacePath}`;

  return { isOperator: true, roles, scopeIds, workspaceHref: `${origin}${path}` };
}
