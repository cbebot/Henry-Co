/**
 * Role resolution: turn a user_id into the role-visibility bundle used to
 * filter Typesense queries.
 *
 * The actual identity sources are:
 *   - profiles.role                              (legacy single role)
 *   - marketplace_role_memberships               (per-division staff)
 *   - studio_role_memberships
 *   - property_role_memberships
 *   - learn_role_memberships
 *
 * Resolution rules:
 *   - Anonymous (no user_id):       ["public"]
 *   - Signed-in baseline:           ["public", "authenticated", "owner"]
 *   - Any per-division staff:       + ["staff"]
 *   - Owner-tier staff in any div:  + ["staff_owner"]
 *   - Platform owner (HQ):          + ["platform_owner"]
 *
 * "owner" is intentionally always added for signed-in users — it is a
 * SCOPE, not a privilege. The actual owner_user_id filter applied to
 * user-scoped collections (workflows, notifications, support) is what
 * keeps the data isolated. If you grant "owner" without applying that
 * filter, you have a leak; that's why `buildFilterClauses()` always
 * pairs the two.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { CollectionDefinition } from "./collections";
import type { SearchRoleVisibility } from "./types";

export interface RoleResolution {
  user_id: string | null;
  role_visibility: SearchRoleVisibility[];
  is_staff: boolean;
  is_platform_owner: boolean;
  /**
   * SEARCH-01: the user's "home lane" — used as `primary_division` for
   * the ranking boost in `scoreIndexedHit` and as the anchor division
   * for the diversity cap. Resolved as:
   *   - the only division the user has a membership in, OR
   *   - the division where the user has an `owner`/`lead` role
   *     (priority over plain staff), OR
   *   - undefined when the user has no memberships.
   */
  primary_division?: import("./types").SearchDivision;
}

export async function resolveUserRoles(
  supabase: SupabaseClient | null,
  user_id: string | null | undefined,
): Promise<RoleResolution> {
  if (!user_id) {
    return {
      user_id: null,
      role_visibility: ["public"],
      is_staff: false,
      is_platform_owner: false,
    };
  }

  const visibility = new Set<SearchRoleVisibility>(["public", "authenticated", "owner"]);
  let isStaff = false;
  let isPlatformOwner = false;
  // SEARCH-01: track which divisions the user has membership in, and
  // whether any of those memberships is a lead/owner role. The first
  // pass over the rows fills the maps; we pick `primary_division` at
  // the end with the lead-wins-over-staff rule.
  type LaneSignal = { lane: import("./types").SearchDivision; isLead: boolean };
  const lanes: LaneSignal[] = [];

  if (supabase) {
    const [profile, marketplaceRoles, studioRoles, propertyRoles, learnRoles] = await Promise.all([
      supabase.from("profiles").select("role").eq("user_id", user_id).maybeSingle(),
      // The role-membership tables enforce RLS; service role should be used.
      supabase
        .from("marketplace_role_memberships")
        .select("role")
        .eq("user_id", user_id),
      supabase.from("studio_role_memberships").select("role").eq("user_id", user_id),
      supabase.from("property_role_memberships").select("role").eq("user_id", user_id),
      supabase.from("learn_role_memberships").select("role").eq("user_id", user_id),
    ]);

    const profileRole = String(profile.data?.role ?? "").toLowerCase();
    if (
      profileRole === "owner" ||
      profileRole === "platform_owner" ||
      profileRole === "henry"
    ) {
      isPlatformOwner = true;
      visibility.add("platform_owner");
      visibility.add("staff_owner");
      visibility.add("staff");
    } else if (
      profileRole === "staff" ||
      profileRole === "support" ||
      profileRole === "moderator" ||
      profileRole === "trust" ||
      profileRole === "admin"
    ) {
      isStaff = true;
      visibility.add("staff");
    }

    const membershipChecks: Array<{
      lane: import("./types").SearchDivision;
      rows: ReadonlyArray<{ role?: unknown } | unknown>;
    }> = [
      { lane: "marketplace", rows: marketplaceRoles.data ?? [] },
      { lane: "studio", rows: studioRoles.data ?? [] },
      { lane: "property", rows: propertyRoles.data ?? [] },
      { lane: "learn", rows: learnRoles.data ?? [] },
    ];

    for (const check of membershipChecks) {
      if (check.rows.length === 0) continue;
      isStaff = true;
      visibility.add("staff");
      let isLead = false;
      for (const row of check.rows) {
        const role = String((row as { role?: unknown }).role ?? "").toLowerCase();
        if (role === "owner" || role === "lead") {
          isLead = true;
          visibility.add("staff_owner");
        }
      }
      lanes.push({ lane: check.lane, isLead });
    }
  }

  // Pick primary_division — lead/owner wins, then single-membership,
  // otherwise undefined. Platform owner explicitly has no primary
  // division because they span all of them; ranking should treat
  // platform_owner queries as fully cross-cutting.
  let primary_division: import("./types").SearchDivision | undefined;
  if (!isPlatformOwner) {
    const lead = lanes.find((l) => l.isLead);
    if (lead) {
      primary_division = lead.lane;
    } else if (lanes.length === 1) {
      primary_division = lanes[0]!.lane;
    }
  }

  return {
    user_id,
    role_visibility: Array.from(visibility),
    is_staff: isStaff,
    is_platform_owner: isPlatformOwner,
    primary_division,
  };
}

/**
 * Build the Typesense `filter_by` clause for a collection given a
 * resolved role bundle.
 *
 * The clauses combine into a single filter expression Typesense evaluates
 * server-side. We always intersect:
 *   - role_visibility:[...] — the document must allow at least one of
 *                              the user's roles
 *   - owner_user_id:=USER   — for user-scoped collections, the document
 *                              MUST belong to the requester
 *   - trust_state filter    — buyers/consumers do not see unverified
 *                              listings; staff bypasses this
 *
 * This is the security frontier of the system. Tests around this function
 * are non-negotiable; see the verification probes in S7.
 */
export function buildFilterClauses(input: {
  collection: CollectionDefinition;
  resolution: RoleResolution;
}): string {
  const { collection, resolution } = input;

  // role_visibility match — at least one role from the user's bundle must
  // be in the document's role_visibility array.
  const allowedRoles = resolution.role_visibility
    .map((r) => `\`${r}\``)
    .join(",");
  const clauses: string[] = [`role_visibility:=[${allowedRoles}]`];

  // user-scoped collections: hard filter by owner_user_id
  if (collection.user_scoped) {
    if (!resolution.user_id) {
      // Anonymous querying a user-scoped collection — return zero rows.
      // Typesense has no "always false" expression, so we filter by an
      // owner_user_id that cannot exist.
      clauses.push(`owner_user_id:=__anonymous__`);
    } else {
      // Staff with an owning role can read across owners (e.g. support
      // queues showing all threads). Non-staff are bound to their own.
      if (!resolution.is_staff) {
        clauses.push(`owner_user_id:=\`${resolution.user_id}\``);
      }
    }
  }

  // trust filter: hide unverified/closed/deleted from non-staff viewers.
  if (!resolution.is_staff) {
    clauses.push(`trust_state:!=[\`deleted\`,\`closed\`,\`archived\`]`);
  }
  // Frozen entities never surface to anyone except platform_owner.
  if (!resolution.is_platform_owner) {
    clauses.push(`trust_state:!=\`frozen\``);
  }

  return clauses.join(" && ");
}
