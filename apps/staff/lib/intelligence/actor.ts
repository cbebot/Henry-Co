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

  // ...AND the DATABASE must agree (adversarial round 2). The TS resolver also
  // honours an unclaimed seed membership matched by email, which the SQL
  // predicates (`user_id = auth.uid()`) do not. Without this, such a user's
  // decision was saved by the service role while its audit row was refused as
  // "caller is not staff" — an unaudited decision. Both gates must say yes.
  const { data: sqlStaff } = await supabase.rpc("is_staff_in_any" as never);
  if (sqlStaff !== true) throw new Error("Staff access required.");

  const viewer = { staffMemberships: roles.staffMemberships };
  const lenses: RecommendationRoleScope[] = ["finance", "support", "moderation"];
  // The trust lens reads V3-40's security-gated tables; only security staff act
  // on it — by the TS resolver AND the SQL predicate those tables' RLS uses.
  if (hasStaffAccessIn(viewer, "security")) {
    const { data: sqlSecurity } = await supabase.rpc("is_staff_in" as never, { division_key: "security" } as never);
    if (sqlSecurity === true) lenses.unshift("trust");
  }

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
