/**
 * Shared, division-agnostic predicate that decides whether a role-membership
 * row grants its role to the current viewer.
 *
 * Background — the email-OR privilege-escalation class:
 *   Every division resolver historically granted roles by matching the viewer's
 *   email against a `*_role_memberships` row with `is_active = true AND
 *   (user_id = me OR normalized_email = my_email)`. Because the email branch
 *   carried no `user_id` requirement, a row with `user_id IS NULL` + an internal
 *   email became a SEED claimable by ANYONE who registered that address — and a
 *   row bound to another user could even be matched by a colliding email.
 *
 * The rule below is the single source of truth that closes both holes:
 *   - Inactive rows (`is_active === false`) never grant.
 *   - A row BOUND to a user (`user_id` set) grants ONLY to that exact user — it
 *     is never matched by email.
 *   - An UNCLAIMED row (`user_id` null/absent) grants ONLY when the viewer's
 *     email is VERIFIED and equals the row's `normalized_email`, so a seed is
 *     claimable solely by someone who provably controls that mailbox.
 *
 * Pure and dependency-free so every resolver (marketplace / learn / studio /
 * property / staff / hub / @henryco/auth) shares one implementation and the
 * grant rule cannot drift between divisions.
 */
export type MembershipGrantRow = {
  user_id?: string | null;
  normalized_email?: string | null;
  is_active?: boolean | null;
};

export type MembershipGrantViewer = {
  /** The authenticated user's id. */
  userId: string;
  /** The viewer's normalized email, or null when unavailable. */
  normalizedEmail: string | null;
  /** Whether the viewer's email has been verified (Supabase `email_confirmed_at`). */
  emailVerified: boolean;
};

export function membershipGrantsViewer(
  row: MembershipGrantRow,
  viewer: MembershipGrantViewer
): boolean {
  if (row.is_active === false) return false;

  // Bound rows grant only to their exact owner — never via email.
  if (row.user_id != null) return row.user_id === viewer.userId;

  // Unclaimed seed: claimable only by a verified, matching mailbox.
  if (!viewer.emailVerified) return false;
  return (
    viewer.normalizedEmail != null &&
    !!row.normalized_email &&
    row.normalized_email === viewer.normalizedEmail
  );
}

export function filterGrantedMemberships<T extends MembershipGrantRow>(
  rows: readonly T[],
  viewer: MembershipGrantViewer
): T[] {
  return rows.filter((row) => membershipGrantsViewer(row, viewer));
}
