import "server-only";

import { redirect } from "next/navigation";
import { normalizeEmail } from "@/lib/env";
import { isRecoverableSupabaseAuthError, resolveUserAvatarFromSources } from "@henryco/config";
import { getSharedAccountLoginUrl, normalizeJobsPath } from "@/lib/account";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getCandidateProfileByUserId, getEmployerMembershipsByUser, getInternalProfile } from "@/lib/jobs/data";
import type { JobsRole, JobsViewer } from "@/lib/jobs/types";

function uniqueRoles(roles: JobsRole[]) {
  return [...new Set(roles)];
}

export function viewerHasRole(viewer: JobsViewer | null | undefined, allowed: JobsRole[]) {
  if (!viewer) return false;
  return allowed.some((role) => viewer.roles.includes(role));
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
      employerMemberships: [],
      candidateProfile: null,
    };
  }

  const normalized = normalizeEmail(user.email);
  const [{ profile, ownerProfile }, employerMemberships, candidateProfile] = await Promise.all([
    getInternalProfile(user.id),
    getEmployerMembershipsByUser(user.id, normalized),
    getCandidateProfileByUserId(user.id),
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
  } else if (internalRole === "manager") {
    roles.push("admin", "recruiter", "moderator");
  } else if (internalRole === "support" || internalRole === "staff") {
    roles.push("recruiter", "moderator");
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
