import "server-only";

import { redirect } from "next/navigation";
import { getAccountUrl } from "@henryco/config";

import { requireUnifiedViewer } from "./viewer";
import type { UnifiedViewer } from "./types";

/**
 * @henryco/auth/owner — Track B (owner dashboard) helpers.
 *
 * Source-of-truth gate for "is the caller an owner?" — wraps the
 * unified viewer reader so Track B surfaces have one import path.
 *
 * Anti-pattern #19 enforcement: Track B consumers import from
 * @henryco/auth/owner (not @henryco/auth/server). The two are
 * compatible but kept distinct so a search for owner-related auth
 * imports yields a single, exhaustive file list.
 *
 * SHIPS WITH DASH-8.
 */

/**
 * The owner-aware extension of UnifiedViewer. The owner viewer is
 * thinner than StaffViewer because owner surfaces aren't division-
 * scoped — owners see every division by definition. The extension
 * just exposes the resolved owner role (`owner` / `admin` /
 * `superadmin` per the legacy fallback or `owner_profiles.role`).
 */
export type OwnerViewer = UnifiedViewer & {
  /** The resolved owner role from the access snapshot. Always present for an OwnerViewer. */
  ownerRole: string;
};

/**
 * Track B entry gate. Composes `requireUnifiedViewer()`, then
 * redirects to the unified login page (with `role=owner` so the
 * post-auth router lands the viewer back here on success) if the
 * viewer holds no owner access.
 *
 * Returned `ownerRole` reflects the authoritative owner role from the
 * access snapshot (`owner_profiles.role` if present; otherwise the
 * legacy `profiles.role` fallback).
 *
 * USE FROM: `apps/hub/app/owner/(command)/layout.tsx` exactly once
 * per shell render. Subsequent components within the shell receive
 * the OwnerViewer as a prop rather than re-calling.
 *
 * Note: `apps/hub/lib/owner-auth.ts` already exposes a hub-local
 * `requireOwner()` returning a richer `OwnerUser` (avatar, profile,
 * etc.). This shared gate is intentionally minimal — it returns just
 * the unified viewer plus the owner role. Hub layouts may continue to
 * use the local `requireOwner()` for the richer profile surface; this
 * helper is for shared shell + module code that only needs the gate.
 */
export async function requireOwnerViewer(): Promise<OwnerViewer> {
  const viewer = await requireUnifiedViewer();
  if (!viewer.access.hasOwnerAccess) {
    redirect(getAccountUrl("/login?role=owner"));
  }
  return {
    ...viewer,
    ownerRole: viewer.access.ownerRole || viewer.access.profileRole || "owner",
  };
}

/**
 * Synchronous helper: derive whether a UnifiedViewer holds owner
 * access. Used by the IdentityBar role-switcher to decide whether to
 * surface the "Owner" tab on the consumer chrome.
 */
export function viewerHasOwnerAccess(viewer: UnifiedViewer): boolean {
  return viewer.access.hasOwnerAccess;
}

/**
 * Cast a UnifiedViewer to an OwnerViewer when the caller has already
 * verified owner access. Used by request-scoped composition where the
 * unified viewer is loaded once and then shared across modules.
 *
 * Throws if the viewer does not in fact hold owner access — protects
 * against accidental misuse.
 */
export function buildOwnerViewer(viewer: UnifiedViewer): OwnerViewer {
  if (!viewer.access.hasOwnerAccess) {
    throw new Error(
      "[@henryco/auth/owner] buildOwnerViewer called with a viewer lacking owner access — " +
        "use requireOwnerViewer() at the layout layer to ensure the gate fires.",
    );
  }
  return {
    ...viewer,
    ownerRole: viewer.access.ownerRole || viewer.access.profileRole || "owner",
  };
}
