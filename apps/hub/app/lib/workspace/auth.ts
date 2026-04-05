import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { getSharedCookieDomain, isRecoverableSupabaseAuthError } from "@henryco/config";
import { createAdminSupabase } from "@/app/lib/supabase-admin";
import {
  getDefaultVisibleDivisions,
  getFallbackDivisionRoles,
  getFamiliesForDivisionRoles,
  getPermissionsForFamilies,
  getProfileFamilies,
  isInternalProfileRole,
  normalizeLegacyDivisionRoles,
} from "@/app/lib/workspace/roles";
import { getWorkspaceRuntime, workspaceLoginHref } from "@/app/lib/workspace/runtime";
import type {
  DivisionRole,
  WorkspaceDivision,
  WorkspaceDivisionMembership,
  WorkspaceViewer,
} from "@/app/lib/workspace/types";

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

function normalizeEmail(value?: string | null) {
  const text = String(value || "").trim().toLowerCase();
  return text || null;
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

async function createWorkspaceSupabaseServer() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieDomain = getSharedCookieDomain(
    headerStore.get("x-forwarded-host") || headerStore.get("host")
  );

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookieOptions: cookieDomain
        ? {
            domain: cookieDomain,
            path: "/",
            sameSite: "lax",
            secure: true,
          }
        : undefined,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(tokens) {
          try {
            for (const { name, value, options } of tokens) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server components can be read-only.
          }
        },
      },
    }
  );
}

async function readMembershipRows(
  division: WorkspaceDivision,
  userId: string,
  normalizedEmail: string | null
) {
  const admin = createAdminSupabase();
  const tableByDivision: Partial<Record<WorkspaceDivision, string>> = {
    marketplace: "marketplace_role_memberships",
    studio: "studio_role_memberships",
    property: "property_role_memberships",
    learn: "learn_role_memberships",
    logistics: "logistics_role_memberships",
  };

  const table = tableByDivision[division];
  if (!table) return [] as MembershipRow[];

  try {
    const filter = normalizedEmail
      ? `user_id.eq.${userId},normalized_email.eq.${normalizedEmail}`
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
  const admin = createAdminSupabase();

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

export async function getWorkspaceViewer(): Promise<WorkspaceViewer> {
  const supabase = await createWorkspaceSupabaseServer();
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] | null = null;

  try {
    const auth = await supabase.auth.getUser();
    user = auth.data.user;
  } catch (error) {
    if (!isRecoverableSupabaseAuthError(error)) {
      throw error;
    }
  }

  if (!user) {
    return {
      user: null,
      families: [],
      permissions: [],
      divisions: [],
      defaultDivision: null,
    };
  }

  const admin = createAdminSupabase();
  const normalizedEmail = normalizeEmail(user.email);
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
    const rows = await readMembershipRows(division, user.id, normalizedEmail);
    const roles = unique(rows.flatMap((row) => normalizeLegacyDivisionRoles(division, row.role)));
    if (roles.length > 0) {
      explicitDivisionState.set(division, { rows, roles });
    }
  }

  const explicitDivisions = [...explicitDivisionState.keys()];
  const canUseActivityDivisions =
    isInternalProfileRole(profileRole) || explicitDivisions.length > 0;
  const requestedDivisions = unique([
    ...getDefaultVisibleDivisions(profileRole),
    ...explicitDivisions,
    ...(canUseActivityDivisions ? activityDivisions : []),
  ]);

  const memberships: WorkspaceDivisionMembership[] = [];

  for (const division of requestedDivisions) {
    const cachedExplicit = explicitDivisionState.get(division);
    const rows = cachedExplicit?.rows ?? [];
    const explicitRoles = cachedExplicit?.roles ?? [];
    const fallbackRoles = getFallbackDivisionRoles(profileRole, division);
    const roles = unique([...explicitRoles, ...fallbackRoles]);

    if (roles.length === 0) {
      continue;
    }

    const source: WorkspaceDivisionMembership["source"] = explicitRoles.length
      ? "explicit"
      : activityDivisions.includes(division)
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

  const families = unique([
    ...getProfileFamilies(profileRole),
    ...memberships.flatMap((membership) => membership.families),
  ]);

  return {
    user: {
      id: user.id,
      email: user.email || null,
      fullName:
        profile?.full_name ||
        (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
        (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null) ||
        null,
      normalizedEmail,
      profileRole,
    },
    families,
    permissions: getPermissionsForFamilies(families),
    divisions: memberships,
    defaultDivision: memberships[0]?.division ?? null,
  };
}

export async function requireWorkspaceViewer() {
  const viewer = await getWorkspaceViewer();
  if (viewer.user) return viewer;

  const runtime = await getWorkspaceRuntime();
  redirect(workspaceLoginHref(runtime.pathname, runtime.workspaceUrl));
}
