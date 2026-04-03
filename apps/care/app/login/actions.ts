"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { syncStaffIdentity } from "@/lib/auth/staff-identity";
import { canAccessPath } from "@/lib/auth/permissions";
import { createStaffAccessLink, findAuthUserByEmail } from "@/lib/auth/recovery-links";
import { STAFF_LOGIN_ROUTE, STAFF_RECOVERY_ROUTE } from "@/lib/auth/routes";
import { homeForRole, isStaffRole, normalizeRole, type StaffRole } from "@/lib/auth/roles";
import { sendPasswordRecoveryEmail } from "@/lib/email/send";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";

type SecurityLogInput = {
  event_type: string;
  route?: string | null;
  user_id?: string | null;
  role?: string | null;
  actor_user_id?: string | null;
  actor_role?: string | null;
  email?: string | null;
  success?: boolean;
  details?: Record<string, unknown>;
};

const AUTH_ROUTE = STAFF_LOGIN_ROUTE;

function getAdminSupabase() {
  return createAdminSupabase();
}

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function safeRoleNext(nextPath: string, role?: string | null) {
  const normalizedRole = normalizeRole(role);
  const home = homeForRole(normalizedRole);
  const next = String(nextPath || "").trim();

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return home;
  }

  if (canAccessPath(normalizedRole, next)) {
    return next;
  }

  return home;
}

function createRecoveryDedupeKey(email: string, tokenHash?: string | null) {
  const normalizedEmail = String(email || "").trim().toLowerCase() || "missing";
  const nonce = String(tokenHash || Date.now()).trim() || String(Date.now());
  return `password-recovery:${normalizedEmail}:${nonce}`;
}

function redirectTo(path: string, params?: Record<string, string>): never {
  const qs = new URLSearchParams();

  for (const [key, value] of Object.entries(params || {})) {
    if (value) qs.set(key, value);
  }

  redirect(qs.size ? `${path}?${qs.toString()}` : path);
}

function redirectToRecovery(params?: Record<string, string>): never {
  return redirectTo(STAFF_RECOVERY_ROUTE, params);
}

async function getRequestMeta() {
  try {
    const h = await headers();

    const forwardedFor = h.get("x-forwarded-for") || "";
    const ip =
      forwardedFor.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      h.get("cf-connecting-ip") ||
      h.get("x-vercel-forwarded-for") ||
      "";

    const userAgent = h.get("user-agent") || "";
    const country =
      h.get("x-vercel-ip-country") ||
      h.get("cf-ipcountry") ||
      h.get("cloudfront-viewer-country") ||
      "";
    const city =
      h.get("x-vercel-ip-city") ||
      h.get("x-appengine-city") ||
      "";

    return {
      ip_address: ip || null,
      user_agent: userAgent || null,
      country: country || null,
      city: city || null,
    };
  } catch {
    return {
      ip_address: null,
      user_agent: null,
      country: null,
      city: null,
    };
  }
}

async function writeSecurityLog(input: SecurityLogInput) {
  try {
    const admin = getAdminSupabase();
    const req = await getRequestMeta();
    const actorUserId = input.actor_user_id ?? input.user_id ?? null;
    const actorRole = input.actor_role ?? input.role ?? null;
    const targetUserId =
      input.user_id && input.user_id !== actorUserId ? input.user_id : null;
    const targetRole =
      input.role && input.role !== actorRole ? input.role : null;

    await admin.from("care_security_logs").insert({
      event_type: input.event_type,
      route: input.route ?? AUTH_ROUTE,
      user_id: actorUserId,
      role: actorRole,
      email: input.email ?? null,
      ip_address: req.ip_address,
      user_agent: req.user_agent,
      country: req.country,
      city: req.city,
      success: input.success ?? true,
      details: {
        ...(input.details ?? {}),
        actor_user_id: actorUserId,
        actor_role: actorRole,
        ...(targetUserId ? { target_user_id: targetUserId } : {}),
        ...(targetRole ? { target_role: targetRole } : {}),
      },
    });
  } catch {
    // ignore logging failure
  }
}

export async function loginAction(formData: FormData) {
  const email = clean(formData.get("email")).toLowerCase();
  const password = clean(formData.get("password"));
  const nextPath = clean(formData.get("next"));

  if (!email || !password) {
    redirectTo(AUTH_ROUTE, {
      error: "Please enter your email and password.",
      next: nextPath,
    });
  }

  await writeSecurityLog({
    event_type: "login_attempt",
    route: AUTH_ROUTE,
    email,
    success: true,
    details: {
      next: nextPath || null,
    },
  });

  const supabase = await createSupabaseServer();
  const admin = getAdminSupabase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  const user = data.user;

  if (error || !user) {
    await writeSecurityLog({
      event_type: "login_failed",
      route: AUTH_ROUTE,
      email,
      success: false,
      details: {
        reason: error?.message || "Invalid credentials",
      },
    });

    redirectTo(AUTH_ROUTE, {
      error: "Invalid login details.",
      next: nextPath,
    });
  }

  const { data: existingProfile, error: profileError } = await admin
    .from("profiles")
    .select("id, role, is_frozen, force_reauth_after")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    await supabase.auth.signOut();

    await writeSecurityLog({
      event_type: "login_profile_lookup_failed",
      route: AUTH_ROUTE,
      user_id: user.id,
      email,
      success: false,
      details: {
        reason: profileError.message,
      },
    });

    redirectTo(AUTH_ROUTE, {
      error: "Account profile lookup failed. Contact the owner.",
    });
  }

  const seededRole = isStaffRole(user.app_metadata?.role)
    ? user.app_metadata.role
    : isStaffRole(user.user_metadata?.role)
    ? user.user_metadata.role
    : null;
  const profileRole = isStaffRole(existingProfile?.role) ? existingProfile.role : null;

  if (!existingProfile?.id && !seededRole) {
    await supabase.auth.signOut();

    await writeSecurityLog({
      event_type: "login_profile_missing",
      route: AUTH_ROUTE,
      user_id: user.id,
      email,
      success: false,
      details: {
        reason: "No matching profile row or staff role seed",
      },
    });

    redirectTo(AUTH_ROUTE, {
      error: "Your account exists, but staff access has not been provisioned yet.",
    });
  }

  const identity = await syncStaffIdentity(user.id, {
    profile:
      existingProfile?.id
        ? {
            id: existingProfile.id,
            full_name: null,
            phone: null,
            role: existingProfile.role ?? null,
            is_frozen: existingProfile.is_frozen ?? false,
            force_reauth_after: existingProfile.force_reauth_after ?? null,
            created_at: null,
          }
        : null,
    user,
    role: seededRole ?? profileRole ?? undefined,
    is_frozen:
      existingProfile?.is_frozen === null || existingProfile?.is_frozen === undefined
        ? undefined
        : Boolean(existingProfile.is_frozen),
    force_reauth_after: existingProfile?.force_reauth_after ?? undefined,
  });

  if (identity.error) {
    await supabase.auth.signOut();

    await writeSecurityLog({
      event_type: "login_profile_sync_failed",
      route: AUTH_ROUTE,
      user_id: user.id,
      email,
      success: false,
      details: {
        reason: identity.error.message || "Profile sync failed",
      },
    });

    redirectTo(AUTH_ROUTE, {
      error: "We could not prepare your staff profile for access.",
    });
  }

  if (identity.deleted_at) {
    await supabase.auth.signOut();

    await writeSecurityLog({
      event_type: "login_blocked_archived_account",
      route: AUTH_ROUTE,
      user_id: user.id,
      role: identity.profile.role,
      email,
      success: false,
      details: {
        reason: "Account is archived",
        deleted_at: identity.deleted_at,
      },
    });

    redirectTo(AUTH_ROUTE, {
      error: "This account has been deactivated. Contact the owner if access should be restored.",
    });
  }

  if (identity.profile.is_frozen) {
    await supabase.auth.signOut();

    await writeSecurityLog({
      event_type: "login_blocked_frozen_account",
      route: AUTH_ROUTE,
      user_id: user.id,
      role: identity.profile.role,
      email,
      success: false,
      details: {
        reason: "Account is frozen",
      },
    });

    redirectTo(AUTH_ROUTE, {
      error: "Your account has been frozen. Contact the owner.",
    });
  }

  const role: StaffRole | null = isStaffRole(identity.profile.role)
    ? identity.profile.role
    : null;

  if (!role) {
    await supabase.auth.signOut();

    await writeSecurityLog({
      event_type: "login_blocked_no_dashboard_role",
      route: AUTH_ROUTE,
      user_id: user.id,
      role: identity.profile.role ?? null,
      email,
      success: false,
      details: {
        reason: "No dashboard role assigned",
      },
    });

    redirectTo(AUTH_ROUTE, {
      error: "Your account is signed in, but no valid staff dashboard role has been assigned yet.",
    });
  }

  const safeNext = safeRoleNext(nextPath, role);

  await writeSecurityLog({
    event_type: "login_success",
      route: AUTH_ROUTE,
      user_id: user.id,
      role,
      email,
      success: true,
      details: {
        redirect_to: safeNext,
        force_reauth_after: identity.profile.force_reauth_after ?? null,
        auth_role_aligned: identity.auth_role_aligned,
        auth_meta_error: identity.auth_meta_error?.message || null,
      },
    });

  redirect(safeNext);
}

export async function logoutAction() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;

  if (user?.id) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      role = profile?.role ?? null;
    } catch {
      role = null;
    }
  }

  await writeSecurityLog({
    event_type: "logout",
    route: "/logout",
    user_id: user?.id ?? null,
    role,
    email: user?.email ?? null,
    success: true,
  });

  await supabase.auth.signOut();
  redirectTo(AUTH_ROUTE, {
    message: "You have been signed out.",
  });
}

export async function sendRecoveryLinkAction(formData: FormData) {
  const email = clean(formData.get("email")).toLowerCase();

  if (!email) {
    redirectToRecovery({
      error: "Enter the staff email that needs recovery access.",
    });
  }

  const user = await findAuthUserByEmail(email);

  if (!user) {
    await writeSecurityLog({
      event_type: "password_recovery_requested_missing_user",
      route: STAFF_RECOVERY_ROUTE,
      email,
      success: false,
    });

    redirectToRecovery({
      message: "If that staff account exists, a recovery message has been queued for dispatch.",
    });
  }

  const authUser = user;

  const link = await createStaffAccessLink(email, "recovery");

  if (link.error || !link.url) {
    await writeSecurityLog({
      event_type: "password_recovery_link_failed",
      route: STAFF_RECOVERY_ROUTE,
      user_id: authUser.id,
      email,
      success: false,
      details: {
        reason: link.error?.message || "Recovery link generation failed.",
      },
    });

    redirectToRecovery({
      error: "A recovery link could not be prepared for this account.",
    });
  }

  const role =
    (isStaffRole(authUser.app_metadata?.role) ? authUser.app_metadata.role : null) ||
    (isStaffRole(authUser.user_metadata?.role) ? authUser.user_metadata.role : null) ||
    null;

  const recoveryResult = await sendPasswordRecoveryEmail(email, {
    staffName:
      String(
        authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email || "Staff account"
      ).trim() ||
      "Staff account",
    recoveryUrl: link.url,
  }, {
    dedupeKey: createRecoveryDedupeKey(email, link.tokenHash),
  });

  await writeSecurityLog({
    event_type: "password_recovery_requested",
    route: STAFF_RECOVERY_ROUTE,
    user_id: authUser.id,
    role,
    email,
    success: recoveryResult.status !== "failed",
    details: {
      notification_status: recoveryResult.status,
      notification_reason: recoveryResult.reason,
      template_key: recoveryResult.templateKey,
    },
  });

  redirectToRecovery({
    message:
      recoveryResult.status === "sent"
        ? "A recovery email has been sent to the staff account."
        : "A recovery message has been prepared and queued for dispatch.",
  });
}

export async function completeRecoveryPasswordAction(formData: FormData) {
  const password = clean(formData.get("password"));
  const confirmPassword = clean(formData.get("confirm_password"));
  const intent = clean(formData.get("intent")).toLowerCase();

  if (!password || password.length < 10) {
    redirectToRecovery({
      mode: "set-password",
      intent,
      error: "Use a password with at least 10 characters.",
    });
  }

  if (password !== confirmPassword) {
    redirectToRecovery({
      mode: "set-password",
      intent,
      error: "The password confirmation does not match.",
    });
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirectTo(AUTH_ROUTE, {
      error: "The recovery session is no longer active. Request a new recovery link.",
    });
  }

  const authUser = user;

  const updateResult = await supabase.auth.updateUser({
    password,
  });

  if (updateResult.error) {
    await writeSecurityLog({
      event_type: "password_recovery_update_failed",
      route: STAFF_RECOVERY_ROUTE,
      user_id: authUser.id,
      email: authUser.email ?? null,
      success: false,
      details: {
        reason: updateResult.error.message,
      },
    });

    redirectToRecovery({
      mode: "set-password",
      intent,
      error: updateResult.error.message || "Password update failed.",
    });
  }

  try {
    const admin = getAdminSupabase();
    const refreshedUser =
      (await admin.auth.admin.getUserById(authUser.id)).data?.user ?? authUser;

    await syncStaffIdentity(authUser.id, {
      user: refreshedUser,
      force_reauth_after: null,
    });
  } catch {
    // best-effort identity cleanup after password recovery
  }

  const role = normalizeRole(
    (authUser.app_metadata?.role as string | null | undefined) ??
      (authUser.user_metadata?.role as string | null | undefined)
  );
  const destination = homeForRole(role);

  await writeSecurityLog({
    event_type: intent === "invite" ? "staff_setup_completed" : "password_recovery_completed",
    route: STAFF_RECOVERY_ROUTE,
    user_id: authUser.id,
    role,
    email: authUser.email ?? null,
    success: true,
    details: {
      redirect_to: destination,
    },
  });

  redirectTo(destination, {
    ok:
      intent === "invite"
        ? "Workspace setup is complete."
        : "Password updated successfully.",
  });
}
