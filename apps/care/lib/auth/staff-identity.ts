import type { User } from "@supabase/supabase-js";
import { isStaffRole, type StaffRole } from "@/lib/auth/roles";
import { createAdminSupabase } from "@/lib/supabase";

type ProfileRecord = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  is_frozen: boolean | null;
  force_reauth_after: string | null;
  created_at: string | null;
};

export type StaffDirectoryRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: StaffRole;
  app_role: string | null;
  user_role: string | null;
  auth_role_aligned: boolean;
  is_frozen: boolean;
  force_reauth_after: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  profile_exists: boolean;
  profile_write_error: string | null;
  deleted_at: string | null;
  is_archived: boolean;
};

export type StaffDirectorySummary = {
  totalUsers: number;
  createdProfiles: number;
  syncedAuthMetadata: number;
  rows: StaffDirectoryRow[];
};

type StaffIdentityPatch = {
  role?: string | null;
  is_frozen?: boolean | null;
  force_reauth_after?: string | null;
  full_name?: string | null;
  phone?: string | null;
  deleted_at?: string | null;
  profile?: ProfileRecord | null;
  user?: User | null;
};

function cleanText(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function staffRoleOrDefault(value: unknown, fallback: StaffRole = "staff"): StaffRole {
  const text = String(value ?? "").trim().toLowerCase();
  return isStaffRole(text) ? text : fallback;
}

function pickFirstText(...values: unknown[]) {
  for (const value of values) {
    const text = cleanText(value);
    if (text) return text;
  }

  return null;
}

function normalizeForceReauthAfter(
  value: unknown,
  lastSignInAt?: string | null
) {
  const forceReauthAfter = cleanText(value);
  if (!forceReauthAfter) return null;

  const forceAt = new Date(forceReauthAfter).getTime();
  const lastSignedIn = lastSignInAt ? new Date(lastSignInAt).getTime() : 0;

  if (forceAt && lastSignedIn && lastSignedIn >= forceAt) {
    return null;
  }

  return forceReauthAfter;
}

function isProfileWriteGuardError(error: { message?: string } | null | undefined) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("not authenticated") || message.includes("cannot change your role");
}

function extractProfileSeed(user?: User | null) {
  const meta = user?.user_metadata ?? {};

  return {
    full_name: pickFirstText(meta.full_name, meta.name, meta.display_name),
    phone: pickFirstText(meta.phone, meta.phone_number),
    role: staffRoleOrDefault(meta.role ?? user?.app_metadata?.role, "staff"),
  };
}

function isProvisioningSlotUser(user?: User | null) {
  return Boolean(user?.app_metadata?.provisioning_slot ?? user?.user_metadata?.provisioning_slot);
}

export async function syncStaffIdentity(
  userId: string,
  patch: StaffIdentityPatch = {}
): Promise<{
  created: boolean;
  profile: ProfileRecord & { role: StaffRole; is_frozen: boolean };
  app_role: string | null;
  user_role: string | null;
  auth_role_aligned: boolean;
  deleted_at: string | null;
  error: { message?: string } | null;
  auth_meta_error: { message?: string } | null;
  profile_write_error: { message?: string } | null;
}> {
  const supabase = createAdminSupabase();
  const user =
    patch.user ??
    (
      await supabase.auth.admin.getUserById(userId)
    ).data?.user ??
    null;
  const existingProfile =
    patch.profile ??
    (
      await supabase
        .from("profiles")
        .select("id, full_name, phone, role, is_frozen, force_reauth_after, created_at")
        .eq("id", userId)
        .maybeSingle()
    ).data ??
    null;

  const seed = extractProfileSeed(user);
  const normalizedForceReauthAfter = normalizeForceReauthAfter(
    patch.force_reauth_after === undefined
      ? pickFirstText(
          user?.app_metadata?.force_reauth_after,
          user?.user_metadata?.force_reauth_after,
          existingProfile?.force_reauth_after
        )
      : patch.force_reauth_after,
    user?.last_sign_in_at ?? null
  );
  const nextProfile = {
    id: userId,
    full_name:
      patch.full_name !== undefined
        ? cleanText(patch.full_name)
        : pickFirstText(existingProfile?.full_name, seed.full_name),
    phone:
      patch.phone !== undefined
        ? cleanText(patch.phone)
        : pickFirstText(existingProfile?.phone, seed.phone),
    role: staffRoleOrDefault(
      patch.role ?? user?.app_metadata?.role ?? user?.user_metadata?.role ?? existingProfile?.role ?? seed.role,
      "staff"
    ),
    is_frozen:
      typeof patch.is_frozen === "boolean"
        ? patch.is_frozen
        : Boolean(
            user?.app_metadata?.is_frozen ??
              user?.user_metadata?.is_frozen ??
              existingProfile?.is_frozen
          ),
    force_reauth_after:
      normalizedForceReauthAfter,
    created_at: existingProfile?.created_at ?? user?.created_at ?? null,
  } satisfies ProfileRecord & { role: StaffRole; is_frozen: boolean };
  const deletedAt =
    patch.deleted_at === undefined
      ? pickFirstText(user?.app_metadata?.deleted_at, user?.user_metadata?.deleted_at)
      : cleanText(patch.deleted_at);

  let created = false;
  let error: { message?: string } | null = null;
  let profileWriteError: { message?: string } | null = null;

  if (existingProfile?.id) {
    const result = await supabase
      .from("profiles")
      .update({
        full_name: nextProfile.full_name,
        phone: nextProfile.phone,
        role: nextProfile.role,
        is_frozen: nextProfile.is_frozen,
        force_reauth_after: nextProfile.force_reauth_after,
      })
      .eq("id", userId);
    profileWriteError = result.error;
  } else {
    const result = await supabase.from("profiles").insert({
      id: userId,
      full_name: nextProfile.full_name,
      phone: nextProfile.phone,
      role: nextProfile.role,
      is_frozen: nextProfile.is_frozen,
      force_reauth_after: nextProfile.force_reauth_after,
    });
    profileWriteError = result.error;
    created = !result.error;
  }

  let authMetaError: { message?: string } | null = null;
  let appRole: string | null = cleanText(user?.app_metadata?.role);
  let userRole: string | null = cleanText(user?.user_metadata?.role);
  let authRoleAligned =
    appRole === nextProfile.role && userRole === nextProfile.role;

  if (user) {
    const nextUserMeta = {
      ...(user.user_metadata ?? {}),
      full_name: nextProfile.full_name,
      phone: nextProfile.phone,
      role: nextProfile.role,
      is_frozen: nextProfile.is_frozen,
      force_reauth_after: nextProfile.force_reauth_after,
      deleted_at: deletedAt,
    };
    const nextAppMeta = {
      ...(user.app_metadata ?? {}),
      role: nextProfile.role,
      is_frozen: nextProfile.is_frozen,
      force_reauth_after: nextProfile.force_reauth_after,
      deleted_at: deletedAt,
    };

    const updateResult = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: nextUserMeta,
      app_metadata: nextAppMeta,
    });

    if (updateResult.error) {
      authMetaError = updateResult.error;
    }

    const verifiedUser =
      (
        await supabase.auth.admin.getUserById(userId)
      ).data?.user ?? null;

    appRole = cleanText(verifiedUser?.app_metadata?.role);
    userRole = cleanText(verifiedUser?.user_metadata?.role);
    authRoleAligned = appRole === nextProfile.role && userRole === nextProfile.role;

    if (!authRoleAligned && !authMetaError) {
      authMetaError = {
        message: "Auth metadata verification failed after the profile update.",
      };
    }
  }

  error =
    authMetaError ||
    (profileWriteError && !isProfileWriteGuardError(profileWriteError)
      ? profileWriteError
      : null);

  return {
    created,
    profile: nextProfile,
    app_role: appRole,
    user_role: userRole,
    auth_role_aligned: authRoleAligned,
    deleted_at: deletedAt,
    error,
    auth_meta_error: authMetaError,
    profile_write_error: profileWriteError,
  };
}

export async function reconcileStaffDirectory(): Promise<StaffDirectorySummary> {
  const supabase = createAdminSupabase();
  const [{ data: profilesData }, authUsersResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone, role, is_frozen, force_reauth_after, created_at"),
    supabase.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ]);

  const users = authUsersResult.data?.users ?? [];
  const profiles = (profilesData ?? []) as ProfileRecord[];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const hiddenProfileIds = new Set<string>();
  const rows: StaffDirectoryRow[] = [];

  let createdProfiles = 0;
  let syncedAuthMetadata = 0;

  for (const user of users) {
    const existingProfile = profileMap.get(user.id) ?? null;

    if (isProvisioningSlotUser(user)) {
      hiddenProfileIds.add(user.id);
      continue;
    }

    const expectedRole = staffRoleOrDefault(
      user.app_metadata?.role ?? user.user_metadata?.role ?? existingProfile?.role,
      "staff"
    );
    const expectedFrozen = Boolean(
      user.app_metadata?.is_frozen ?? user.user_metadata?.is_frozen ?? existingProfile?.is_frozen
    );
    const expectedForceReauthAt =
      normalizeForceReauthAfter(
        pickFirstText(
          user.app_metadata?.force_reauth_after,
          user.user_metadata?.force_reauth_after,
          existingProfile?.force_reauth_after
        ),
        user.last_sign_in_at ?? null
      ) ?? null;
    const deletedAt =
      pickFirstText(user.app_metadata?.deleted_at, user.user_metadata?.deleted_at) ?? null;
    const appRole = cleanText(user.app_metadata?.role);
    const userRole = cleanText(user.user_metadata?.role);
    const needsRepair =
      !existingProfile ||
      appRole !== expectedRole ||
      userRole !== expectedRole ||
      Boolean(existingProfile?.is_frozen) !== expectedFrozen ||
      (existingProfile?.force_reauth_after ?? null) !== expectedForceReauthAt;

    const result = needsRepair
      ? await syncStaffIdentity(user.id, { profile: existingProfile, user })
      : {
          created: false,
          profile: {
            id: user.id,
            full_name: existingProfile?.full_name ?? null,
            phone: existingProfile?.phone ?? null,
            role: expectedRole,
            is_frozen: expectedFrozen,
            force_reauth_after: expectedForceReauthAt,
            created_at: existingProfile?.created_at ?? user.created_at ?? null,
          },
          app_role: appRole,
          user_role: userRole,
          auth_role_aligned: appRole === expectedRole && userRole === expectedRole,
          deleted_at: deletedAt,
          error: null,
          auth_meta_error: null,
          profile_write_error: null,
        };

    if (result.created) createdProfiles += 1;
    if (needsRepair) syncedAuthMetadata += 1;

    profileMap.set(user.id, result.profile);

    rows.push({
      id: user.id,
      email: user.email ?? null,
      full_name: result.profile.full_name,
      phone: result.profile.phone,
      role: result.profile.role,
      app_role: result.app_role,
      user_role: result.user_role,
      auth_role_aligned: result.auth_role_aligned,
      is_frozen: result.profile.is_frozen,
      force_reauth_after: result.profile.force_reauth_after,
      created_at: result.profile.created_at,
      last_sign_in_at: user.last_sign_in_at ?? null,
      profile_exists: Boolean(existingProfile?.id) || result.created,
      profile_write_error: result.profile_write_error?.message ?? null,
      deleted_at: result.deleted_at,
      is_archived: Boolean(result.deleted_at),
    });
  }

  for (const profile of profileMap.values()) {
    if (hiddenProfileIds.has(profile.id)) continue;
    if (rows.some((row) => row.id === profile.id)) continue;

    rows.push({
      id: profile.id,
      email: null,
      full_name: profile.full_name,
      phone: profile.phone,
      role: staffRoleOrDefault(profile.role, "staff"),
      app_role: null,
      user_role: null,
      auth_role_aligned: false,
      is_frozen: Boolean(profile.is_frozen),
      force_reauth_after: profile.force_reauth_after ?? null,
      created_at: profile.created_at ?? null,
      last_sign_in_at: null,
      profile_exists: true,
      profile_write_error: null,
      deleted_at: null,
      is_archived: false,
    });
  }

  rows.sort((a, b) => {
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    return bTime - aTime;
  });

  return {
    totalUsers: rows.length,
    createdProfiles,
    syncedAuthMetadata,
    rows,
  };
}
