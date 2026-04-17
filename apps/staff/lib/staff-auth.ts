import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getAccountUrl,
  getStaffHqUrl,
  isRecoverableSupabaseAuthError,
  normalizeEmail,
} from "@henryco/config";
import { createStaffAdminSupabase } from "@/lib/supabase/admin";
import { createStaffSupabaseServer } from "@/lib/supabase/server";
import {
  getDefaultVisibleDivisions,
  getFallbackDivisionRoles,
  getFamiliesForDivisionRoles,
  getPermissionsForFamilies,
  normalizeLegacyDivisionRoles,
} from "@/lib/roles";
import type {
  DivisionRole,
  WorkspaceDivision,
  WorkspaceDivisionMembership,
  WorkspaceViewer,
} from "@/lib/types";

type SharedProfile = {
  full_name: string | null;
  role: string | null;
};

type MembershipRow = {
  id: string;
  role: string | null;
  scope_type: string | null;
  scope_id: string | null;
};

const STAFF_DIVISION_PATHS: Partial<Record<WorkspaceDivision, string>> = {
  care: "/care",
  marketplace: "/marketplace",
  studio: "/studio",
  jobs: "/jobs",
  property: "/property",
  learn: "/learn",
  logistics: "/logistics",
};
const LEGACY_PROFILE_FALLBACK_DIVISIONS = new Set<WorkspaceDivision>(["care"]);

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function canUseLegacyProfileFallback(division: WorkspaceDivision) {
  return LEGACY_PROFILE_FALLBACK_DIVISIONS.has(division);
}

type StaffServerSupabase = Awaited<ReturnType<typeof createStaffSupabaseServer>>;

async function recordAccessSourceAudit(input: {
  userId: string;
  source: "explicit" | "fallback" | "activity";
  divisions: WorkspaceDivision[];
}) {
  try {
    const h = await headers();
    const admin = createStaffAdminSupabase();
    await admin.from("staff_navigation_audit").insert({
      user_id: input.userId,
      path: h.get("x-henry-pathname") || "/",
      division: input.divisions.join(","),
      referrer: h.get("referer") || null,
      user_agent: h.get("user-agent") || null,
      metadata: {
        access_source: input.source,
        divisions: input.divisions,
      },
    } as never);
  } catch {
    // Ignore audit sink failures to avoid blocking access.
  }
}

async function readStaffAuthUser(supabase: StaffServerSupabase) {
  try {
    const auth = await supabase.auth.getUser();
    return auth.data.user ?? null;
  } catch (error) {
    if (!isRecoverableSupabaseAuthError(error)) {
      throw error;
    }
    return null;
  }
}

async function readMembershipRows(
  division: WorkspaceDivision,
  userId: string,
  normalizedEmailAddress: string | null
) {
  const admin = createStaffAdminSupabase();
  const tableByDivision: Partial<Record<WorkspaceDivision, string>> = {
    care: "care_role_memberships",
    marketplace: "marketplace_role_memberships",
    studio: "studio_role_memberships",
    jobs: "jobs_role_memberships",
    property: "property_role_memberships",
    learn: "learn_role_memberships",
    logistics: "logistics_role_memberships",
  };

  const table = tableByDivision[division];
  if (!table) return [] as MembershipRow[];

  try {
    const filter = normalizedEmailAddress
      ? `user_id.eq.${userId},normalized_email.eq.${normalizedEmailAddress}`
      : `user_id.eq.${userId}`;
    const { data, error } = await admin
      .from(table)
      .select("id, role, scope_type, scope_id")
      .eq("is_active", true)
      .or(filter);

    if (error) return [] as MembershipRow[];
    return (data ?? []) as MembershipRow[];
  } catch {
    return [] as MembershipRow[];
  }
}

async function readActivityDivisions(userId: string) {
  const admin = createStaffAdminSupabase();

  try {
    const [activityRes, notificationRes] = await Promise.all([
      admin.from("customer_activity").select("division").eq("user_id", userId).limit(80),
      admin.from("customer_notifications").select("division").eq("user_id", userId).limit(80),
    ]);

    return unique(
      [...(activityRes.data ?? []), ...(notificationRes.data ?? [])]
        .map((row) => String((row as { division?: string | null }).division || "").trim().toLowerCase())
        .filter((division): division is WorkspaceDivision =>
          ["care", "marketplace", "studio", "jobs", "property", "learn", "logistics"].includes(
            division
          )
        )
    );
  } catch {
    return [] as WorkspaceDivision[];
  }
}

export function getDefaultStaffLandingPath(viewer: WorkspaceViewer) {
  if (
    viewer.defaultDivision &&
    viewer.divisions.length === 1 &&
    !viewer.permissions.includes("staff.directory.view")
  ) {
    return STAFF_DIVISION_PATHS[viewer.defaultDivision] || "/";
  }

  return "/";
}

export async function getCurrentStaffAuthUser() {
  const supabase = await createStaffSupabaseServer();
  return readStaffAuthUser(supabase);
}

export async function getStaffViewer(): Promise<WorkspaceViewer | null> {
  const supabase = await createStaffSupabaseServer();
  const user = await readStaffAuthUser(supabase);

  if (!user) return null;

  const admin = createStaffAdminSupabase();
  const normalizedEmailAddress = normalizeEmail(user.email);
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle<SharedProfile>();

  const profileRole =
    profile?.role ||
    (typeof user.app_metadata?.role === "string" ? user.app_metadata.role : null) ||
    (typeof user.user_metadata?.role === "string" ? user.user_metadata.role : null) ||
    null;

  const activityDivisions = await readActivityDivisions(user.id);
  const explicitDivisionState = new Map<
    WorkspaceDivision,
    { rows: MembershipRow[]; roles: DivisionRole[] }
  >();

  for (const division of [
    "care",
    "marketplace",
    "studio",
    "jobs",
    "property",
    "learn",
    "logistics",
  ] as WorkspaceDivision[]) {
    const rows = await readMembershipRows(division, user.id, normalizedEmailAddress);
    const roles = unique(rows.flatMap((row) => normalizeLegacyDivisionRoles(division, row.role)));
    if (roles.length > 0) {
      explicitDivisionState.set(division, { rows, roles });
    }
  }

  const explicitDivisions = [...explicitDivisionState.keys()];
  const legacyFallbackDivisions = getDefaultVisibleDivisions(profileRole).filter(canUseLegacyProfileFallback);
  const activityScopedDivisions = activityDivisions.filter(
    (division) => explicitDivisionState.has(division) || legacyFallbackDivisions.includes(division)
  );
  const requestedDivisions = unique([
    ...explicitDivisions,
    ...legacyFallbackDivisions,
    ...activityScopedDivisions,
  ]);

  const memberships: WorkspaceDivisionMembership[] = [];

  for (const division of requestedDivisions) {
    const cachedExplicit = explicitDivisionState.get(division);
    const rows = cachedExplicit?.rows ?? [];
    const explicitRoles = cachedExplicit?.roles ?? [];
    const fallbackRoles = canUseLegacyProfileFallback(division)
      ? getFallbackDivisionRoles(profileRole, division)
      : [];
    const roles = unique([...explicitRoles, ...fallbackRoles]);

    if (roles.length === 0) {
      continue;
    }

    const source: WorkspaceDivisionMembership["source"] = explicitRoles.length
      ? "explicit"
      : activityScopedDivisions.includes(division)
        ? "activity"
        : "fallback";

    memberships.push({
      division,
      roles,
      families: getFamiliesForDivisionRoles(roles),
      source,
      scopeType: rows[0]?.scope_type || "platform",
      scopeId: rows[0]?.scope_id || null,
      readiness: division === "logistics" && explicitRoles.length === 0 ? "planned" : "live",
    });
  }

  if (memberships.length === 0) {
    return null;
  }

  const families = unique(memberships.flatMap((membership) => membership.families));

  const derivedSources = new Set(memberships.map((membership) => membership.source));
  if (derivedSources.has("fallback") || derivedSources.has("activity")) {
    await recordAccessSourceAudit({
      userId: user.id,
      source: derivedSources.has("fallback") ? "fallback" : "activity",
      divisions: memberships.map((membership) => membership.division),
    });
  }

  return {
    user: {
      id: user.id,
      email: user.email || null,
      fullName:
        profile?.full_name ||
        (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
        (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null) ||
        null,
      normalizedEmail: normalizedEmailAddress,
      profileRole,
    },
    families,
    permissions: getPermissionsForFamilies(families),
    divisions: memberships,
    defaultDivision: memberships[0]?.division ?? null,
  };
}

async function staffReturnUrlFromRequest(): Promise<string> {
  const h = await headers();
  let pathname = h.get("x-henry-pathname") || "/";
  const search = h.get("x-henry-search") || "";
  if (!pathname.startsWith("/")) {
    pathname = `/${pathname}`;
  }
  if (pathname.includes("//")) {
    return getStaffHqUrl("/");
  }
  return getStaffHqUrl(`${pathname}${search}`);
}

export async function requireStaff(): Promise<WorkspaceViewer> {
  const supabase = await createStaffSupabaseServer();
  const user = await readStaffAuthUser(supabase);

  if (!user) {
    const next = await staffReturnUrlFromRequest();
    redirect(getAccountUrl(`/login?next=${encodeURIComponent(next)}`));
  }

  const viewer = await getStaffViewer();

  if (!viewer) {
    redirect(getStaffHqUrl("/no-access"));
  }

  return viewer;
}
