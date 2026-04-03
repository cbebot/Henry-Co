import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { buildStaffLoginUrl } from "@/lib/auth/routes";
import { homeForRole, normalizeRole, type AppRole } from "@/lib/auth/roles";
import { getOptionalEnv } from "@/lib/env";

export type AuthProfile = {
  id: string;
  full_name: string | null;
  role: AppRole;
  is_frozen: boolean;
  force_reauth_after: string | null;
  deleted_at: string | null;
};

function normalizeForceReauthAfter(
  forceReauthAfter: string | null | undefined,
  lastSignInAt: string | null | undefined
) {
  const value = typeof forceReauthAfter === "string" ? forceReauthAfter.trim() : "";
  if (!value) return null;

  const forceAt = new Date(value).getTime();
  const lastSignedIn = lastSignInAt ? new Date(lastSignInAt).getTime() : 0;

  if (forceAt && lastSignedIn && lastSignedIn >= forceAt) {
    return null;
  }

  return value;
}

export async function getServerSupabase() {
  const url = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anon = getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !anon) {
    throw new Error("Missing Supabase public env vars.");
  }

  const cookieStore = await cookies();

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // no-op
        }
      },
    },
  });
}

export async function getAuthenticatedProfile() {
  const supabase = await getServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_frozen, force_reauth_after")
    .eq("id", user.id)
    .maybeSingle();

  const appRole = normalizeRole(user.app_metadata?.role as string | null | undefined);
  const userRole = normalizeRole(user.user_metadata?.role as string | null | undefined);
  const effectiveRole =
    appRole !== "customer"
      ? appRole
      : userRole !== "customer"
      ? userRole
      : normalizeRole(profile?.role);

  const effectiveFrozen = Boolean(
    user.app_metadata?.is_frozen ?? user.user_metadata?.is_frozen ?? profile?.is_frozen
  );
  const effectiveForceReauthAfter =
    normalizeForceReauthAfter(
      (typeof user.app_metadata?.force_reauth_after === "string"
        ? user.app_metadata.force_reauth_after
        : null) ||
        (typeof user.user_metadata?.force_reauth_after === "string"
          ? user.user_metadata.force_reauth_after
          : null) ||
        profile?.force_reauth_after ||
        null,
      user.last_sign_in_at
    );
  const effectiveDeletedAt =
    (typeof user.app_metadata?.deleted_at === "string" ? user.app_metadata.deleted_at : null) ||
    (typeof user.user_metadata?.deleted_at === "string" ? user.user_metadata.deleted_at : null) ||
    null;
  const effectiveFullName =
    profile?.full_name ??
    (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ??
    (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null) ??
    null;

  return {
    user,
    profile: {
      id: user.id,
      full_name: effectiveFullName,
      role: effectiveRole,
      is_frozen: effectiveFrozen,
      force_reauth_after: effectiveForceReauthAfter,
      deleted_at: effectiveDeletedAt,
    } satisfies AuthProfile,
  };
}

export async function requireRoles(allowed: AppRole[]) {
  const auth = await getAuthenticatedProfile();

  if (!auth?.user || !auth.profile) {
    redirect(buildStaffLoginUrl());
  }

  if (auth.profile.deleted_at) {
    const supabase = await getServerSupabase();
    await supabase.auth.signOut();
    redirect(buildStaffLoginUrl(null, { reason: "disabled" }));
  }

  if (auth.profile.is_frozen) {
    const supabase = await getServerSupabase();
    await supabase.auth.signOut();
    redirect(buildStaffLoginUrl(null, { reason: "frozen" }));
  }

  if (auth.profile.force_reauth_after) {
    const lastSignInAt = auth.user.last_sign_in_at
      ? new Date(auth.user.last_sign_in_at).getTime()
      : 0;
    const forceAt = new Date(auth.profile.force_reauth_after).getTime();

    if (forceAt && lastSignInAt && lastSignInAt < forceAt) {
      const supabase = await getServerSupabase();
      await supabase.auth.signOut();
      redirect(buildStaffLoginUrl(null, { reason: "reauth" }));
    }
  }

  if (!allowed.includes(auth.profile.role)) {
    redirect(homeForRole(auth.profile.role));
  }

  return auth;
}
