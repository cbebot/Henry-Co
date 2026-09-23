import "server-only";

/**
 * V3-42 — the acting-staff resolver for dashboard recommendation actions.
 *
 * Server actions cannot rely on the page-level role gate alone: a direct POST
 * never renders a page, so it never passes that gate. Every recommendation
 * action re-derives the caller's roles here.
 *
 * Two checks, not one:
 *   1. the caller is staff at all;
 *   2. the caller may act on THAT LENS. Without this a support operator could
 *      POST an "accept" against a `trust` card — they could not READ the risk
 *      rows behind it (RLS stops that), but they would still be recorded as
 *      having agreed with a trust decision they never saw. The lens check is
 *      the TS mirror of `is_staff_in('security')`, matching V3-40's tables.
 *
 * The returned id becomes the actor of record on the row, which is exactly what
 * the `staff_recommendation_human_actor` CHECK requires.
 */

import { buildUnifiedViewer, getViewerRoles } from "@henryco/auth/server";
import { hasStaffAccessIn } from "@henryco/auth/staff";
import type { RecommendationRoleScope } from "@henryco/intelligence";
import { createStaffSupabaseServer } from "@/lib/supabase/server";

export interface IntelligenceStaffActor {
  userId: string;
  /** Lenses this caller may act on. */
  lenses: RecommendationRoleScope[];
}

export async function requireIntelligenceActor(): Promise<IntelligenceStaffActor> {
  const supabase = await createStaffSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  const unified = await buildUnifiedViewer({
    id: user.id,
    email: user.email ?? null,
    fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
    avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
    app_metadata: user.app_metadata,
    user_metadata: user.user_metadata,
  });
  const roles = await getViewerRoles(unified);
  if (!roles.hasStaffAccess) throw new Error("Staff access required.");

  const viewer = { staffMemberships: roles.staffMemberships };
  const lenses: RecommendationRoleScope[] = ["finance", "support", "moderation"];
  // The trust lens reads V3-40's security-gated tables; only security staff act on it.
  if (hasStaffAccessIn(viewer, "security")) lenses.unshift("trust");

  return { userId: user.id, lenses };
}

export function assertActorMayActOnLens(
  actor: IntelligenceStaffActor,
  lens: RecommendationRoleScope,
): void {
  if (!actor.lenses.includes(lens)) {
    throw new Error(`Your role does not cover the "${lens}" dashboard.`);
  }
}
