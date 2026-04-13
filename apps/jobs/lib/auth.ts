import "server-only";

import { redirect } from "next/navigation";
import { normalizeEmail } from "@/lib/env";
import { isRecoverableSupabaseAuthError, resolveUserAvatarFromSources } from "@henryco/config";
import { getSharedAccountLoginUrl, normalizeJobsPath } from "@/lib/account";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getCandidateProfileByUserId, getEmployerMembershipsByUser, getInternalProfile } from "@/lib/jobs/data";
import type { JobsRole, JobsStaffMembership, JobsViewer } from "@/lib/jobs/types";

function uniqueRoles(roles: JobsRole[]) {
  return [...new Set(roles)];
}

function uniqueStaffMemberships(memberships: JobsStaffMembership[]) {
  const seen = new Set<string>();

  return memberships.filter((membership) => {
    const key = `${membership.role}:${membership.scopeType}:${membership.scopeId || ""}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function hasStaffRole(memberships: JobsStaffMembership[], allowed: JobsStaffMembership["role"][]) {
  return memberships.some((membership) => allowed.includes(membership.role));
}

async function getJobsStaffMemberships(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  userId: string,
  normalizedEmail: string | null
): Promise<JobsStaffMembership[]> {
  const byUserPromise = supabase
    .from("jobs_role_memberships")
    .select("id, role, scope_type, scope_id")
    .eq("is_active", true)
    .eq("user_id", userId);

  const byEmailPromise = normalizedEmail
    ? supabase
        .from("jobs_role_memberships")
        .select("id, role, scope_type, scope_id")
        .eq("is_active", true)
        .eq("normalized_email", normalizedEmail)
    : Promise.resolve({ data: [], error: null });

  const [byUser, byEmail] = await Promise.all([byUserPromise, byEmailPromise]);
  const rows = [...(byUser.data ?? []), ...(byEmail.data ?? [])];

  return uniqueStaffMemberships(
    rows.map((row) => ({
      id: String(row.id),
      role: String(row.role) as JobsStaffMembership["role"],
      scopeType: String(row.scope_type || "platform"),
      scopeId: typeof row.scope_id === "string" && row.scope_id.trim() ? row.scope_id : null,
    }))
  );
}

export function viewerHasRole(viewer: JobsViewer | null | undefined, allowed: JobsRole[]) {
  if (!viewer) return false;
  return allowed.some((role) => viewer.roles.includes(role));
}

export function getJobsActorRole(viewer: JobsViewer | null | undefined) {
  if (!viewer) return null;
  if (viewer.roles.includes("owner")) return "owner";
  if (viewer.roles.includes("admin")) return "admin";
  if (viewer.roles.includes("moderator")) return "moderator";
  if (viewer.roles.includes("recruiter")) return "recruiter";
  if (viewer.roles.includes("employer")) return "employer";
  return viewer.internalRole;
}

export async function getJobsViewer(): Promise<JobsViewer> {
  const supabase = await createSupabaseServer();
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] | null = null;

  try {
    const auth = await supabase.auth.getUser();
    user = auth.data.user ?? null;
  } catch (error) {
    if (!isRecoverableSupabaseAuthError(error)) {
      throw error;
    }
  }

  if (!user) {
    return {
      user: null,
      normalizedEmail: null,
      internalRole: null,
      roles: [],
      staffMemberships: [],
      employerMemberships: [],
      candidateProfile: null,
    };
  }

  const normalized = normalizeEmail(user.email);
  const [{ profile, ownerProfile }, employerMemberships, candidateProfile, staffMemberships] = await Promise.all([
    getInternalProfile(user.id),
    getEmployerMembershipsByUser(user.id, normalized),
    getCandidateProfileByUserId(user.id),
    getJobsStaffMemberships(supabase, user.id, normalized),
  ]);

  const internalRole =
    (typeof ownerProfile?.role === "string" ? ownerProfile.role : null) ||
    (typeof profile?.role === "string" ? profile.role : null) ||
    null;

  const roles: JobsRole[] = ["candidate"];

  if (employerMemberships.length > 0) {
    roles.push("employer");
  }

  if (internalRole === "owner") {
    roles.push("owner", "admin", "recruiter", "moderator");
  } else if (hasStaffRole(staffMemberships, ["employer_success"])) {
    roles.push("admin");
  }

  if (hasStaffRole(staffMemberships, ["recruiter", "internal_recruitment_coordinator"])) {
    roles.push("recruiter");
  }

  if (hasStaffRole(staffMemberships, ["jobs_moderator"])) {
    roles.push("moderator");
  }

  return {
    user: {
      id: user.id,
      email: user.email || null,
      fullName:
        candidateProfile?.fullName ||
        (typeof profile?.full_name === "string" ? profile.full_name : null) ||
        (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
        (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null) ||
        null,
      phone:
        candidateProfile?.phone || (typeof profile?.phone === "string" ? profile.phone : null) || null,
      avatarUrl: resolveUserAvatarFromSources(
        candidateProfile?.avatarUrl ||
          (typeof profile?.avatar_url === "string" ? profile.avatar_url : null) ||
          null,
        user.user_metadata as Record<string, unknown> | null
      ),
    },
    normalizedEmail: normalized,
    internalRole,
    roles: uniqueRoles(roles),
    staffMemberships,
    employerMemberships,
    candidateProfile,
  };
}

export async function requireJobsUser(next?: string) {
  const viewer = await getJobsViewer();

  if (!viewer.user) {
    redirect(getSharedAccountLoginUrl(normalizeJobsPath(next)));
  }

  return viewer;
}

export async function requireJobsRoles(allowed: JobsRole[], next?: string) {
  const viewer = await requireJobsUser(next);

  if (!viewerHasRole(viewer, allowed)) {
    redirect("/");
  }

  return viewer;
}
