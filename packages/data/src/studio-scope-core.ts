/**
 * @henryco/data/studio-scope-core — pure (browser-safe) viewer-scoping
 * predicates for studio project rows.
 *
 * No DB access and NO `server-only` barrier, so the scoping predicates
 * are unit-testable without a database and cannot silently drift. The DB
 * resolver (`loadViewerStudioProjectIds`) lives in ./studio-scope
 * (server-only).
 *
 * WHY THIS EXISTS: the shared readers use a SERVICE-ROLE client (RLS
 * bypassed), so any `studio_project_messages` / `studio_project_milestones`
 * read MUST be constrained in application code to the projects the viewer
 * is a party to — otherwise one customer's inbox/calendar surfaces every
 * other customer's project rows (the FIRE cross-user-leak class).
 */

import type { UnifiedViewer } from "@henryco/auth";

export type StudioViewerIdentity = {
  /** The session user id. Always present for a resolvable customer viewer. */
  userId: string;
  /** Lowercased email, or null when the viewer has none (never matches on ""). */
  normalizedEmail: string | null;
};

/**
 * Pure: derive the studio scoping identity from a session-resolved
 * viewer. Returns null for non-customer viewers or a viewer with no id,
 * so callers skip the studio read entirely (yielding zero rows).
 *
 * The email match is gated on `emailVerified` — an unverified address must
 * not pull in another customer's projects (mirrors the hardened
 * `loadStudioSnapshot` predicate in `@henryco/dashboard-modules-studio`).
 * `emailVerified` is optional on the viewer and absent is treated as
 * unverified (deny). A blank email also collapses to null so we never
 * build a `normalized_email = ''` match against rows with empty emails.
 *
 * The identity comes ONLY from the session viewer — never a
 * caller-supplied id.
 */
export function studioViewerIdentity(
  viewer: UnifiedViewer,
): StudioViewerIdentity | null {
  if (viewer.kind !== "customer") return null;
  const userId = viewer.user.id;
  if (!userId) return null;
  const emailVerified = viewer.user.emailVerified === true;
  const email = (viewer.user.email ?? "").trim().toLowerCase();
  return {
    userId,
    normalizedEmail: emailVerified && email.length > 0 ? email : null,
  };
}

/**
 * Pure: keep only rows whose `project_id` is in the viewer's allowed
 * set. Defence in depth on top of the SQL `.in(...)` scope — a row can
 * survive only when it belongs to a project the viewer is a party to,
 * so a non-party viewer receives zero rows by construction. Rows with a
 * null `project_id`, and every row when the allowed set is empty, are
 * dropped.
 */
export function filterToAllowedProjects<
  T extends { project_id: string | null },
>(rows: ReadonlyArray<T>, allowed: ReadonlySet<string>): T[] {
  if (allowed.size === 0) return [];
  return rows.filter(
    (row) => row.project_id != null && allowed.has(row.project_id),
  );
}
