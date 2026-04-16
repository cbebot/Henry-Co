/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createStaffAccessLink, findAuthUserByEmail } from "@/lib/auth/recovery-links";
import { STAFF_LOGIN_ROUTE, STAFF_RECOVERY_ROUTE } from "@/lib/auth/routes";
import { syncStaffIdentity } from "@/lib/auth/staff-identity";
import { getAuthenticatedProfile } from "@/lib/auth/server";
import { isServiceBookingRecord } from "@/lib/care-booking-shared";
import { normalizeCareSettings } from "@/lib/care-settings-shared";
import {
  buildReviewUrl,
  buildTrackingUrl,
  sendAdminNotificationEmail,
  sendBookingStatusUpdateEmail,
  sendPaymentReceivedEmail,
  sendPaymentRequestEmail,
  sendReviewRequestEmail,
  sendStaffInvitationEmail,
} from "@/lib/email/send";
import { getPricingProposalById } from "@/lib/pricing-governance";
import { applyEffectiveBookingStatus } from "@/lib/care-runtime-overrides";
import { sendWhatsAppText } from "@/lib/support/whatsapp";
import { createAdminSupabase } from "@/lib/supabase";
import {
  getServiceFamilyLabel,
  getTrackingCustomerGuidance,
  getTrackingStatusDescription,
  getTrackingStatusLabel,
  getTrackingStatusOptions,
  inferCareServiceFamily,
  isReviewEligibleStatus,
  toStoredBookingStatus,
} from "@/lib/care-tracking";
import { uploadCareImage } from "@/lib/cloudinary";

const ALLOWED_STAFF_ROLES = ["owner", "manager", "rider", "support", "staff"] as const;

const TREATMENT_SURCHARGES = {
  standard: 0,
  stain: 500,
  deep_stain: 1000,
  delicate: 700,
} as const;

const OPTIONAL_SETTINGS_FIELDS = [
  "public_site_url",
  "care_domain",
  "hub_domain",
  "company_account_name",
  "company_account_number",
  "company_bank_name",
  "payment_currency",
  "payment_instructions",
  "payment_whatsapp",
  "payment_support_email",
  "payment_support_whatsapp",
  "notification_sender_name",
  "notification_reply_to_email",
  "picked_up_email_subject",
  "picked_up_email_body",
] as const;

type ActionAuth = {
  user: {
    id: string;
    email?: string | null;
    last_sign_in_at?: string | null;
  };
  profile: {
    id: string;
    role: string;
    full_name?: string | null;
    is_frozen?: boolean | null;
    force_reauth_after?: string | null;
  };
};

function getAdminSupabase() {
  return createAdminSupabase();
}

function asText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function asNullableText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function asNumber(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  const value = Number(raw || 0);
  return Number.isFinite(value) ? value : 0;
}

function asBool(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim().toLowerCase();
  return value === "true" || value === "on" || value === "1" || value === "yes";
}

function normalizeStaffRole(value: string) {
  const role = String(value || "").trim().toLowerCase();
  return ALLOWED_STAFF_ROLES.includes(role as (typeof ALLOWED_STAFF_ROLES)[number])
    ? role
    : null;
}

function resolveLiveStaffRole(input: {
  profileRole?: string | null;
  appRole?: string | null;
  userRole?: string | null;
}) {
  return (
    normalizeStaffRole(String(input.appRole || "")) ||
    normalizeStaffRole(String(input.userRole || "")) ||
    normalizeStaffRole(String(input.profileRole || "")) ||
    "staff"
  );
}

function staffRoleHome(role: string) {
  if (role === "owner") return "/owner";
  if (role === "manager") return "/manager";
  if (role === "rider") return "/rider";
  if (role === "support") return "/support";
  return "/staff";
}

function normalizeTreatment(value: string) {
  const key = String(value || "").trim().toLowerCase();
  if (key === "stain") return "stain";
  if (key === "deep_stain") return "deep_stain";
  if (key === "delicate") return "delicate";
  return "standard";
}

function getTreatmentSurchargePerUnit(treatment: string) {
  return TREATMENT_SURCHARGES[normalizeTreatment(treatment)];
}

function normalizeRoute(route?: string | null, fallback = "/owner") {
  const value = String(route || "").trim();
  if (!value.startsWith("/")) return fallback;
  return value;
}

function finish(route: string, state: "ok" | "error" | "warn" | "info", message: string): never {
  const params = new URLSearchParams();
  params.set(state, message);
  redirect(`${route}?${params.toString()}`);
}

function getOwnerActionSecret() {
  return (
    process.env.OWNER_ACTION_SIGNING_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "local-owner-action-secret"
  );
}

function signOwnerAction(actorUserId: string, actorRole: string, actorTs: string) {
  return createHmac("sha256", getOwnerActionSecret())
    .update(`${actorUserId}:${actorRole}:${actorTs}`)
    .digest("hex");
}

function safeEqualText(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);

  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function needsForcedReauth(auth: ActionAuth) {
  const forceAt = auth.profile.force_reauth_after
    ? new Date(auth.profile.force_reauth_after).getTime()
    : 0;

  const lastSignInAt = auth.user.last_sign_in_at
    ? new Date(auth.user.last_sign_in_at).getTime()
    : 0;

  return Boolean(forceAt && lastSignInAt && lastSignInAt < forceAt);
}

async function getActionAuthenticatedProfile(): Promise<ActionAuth | null> {
  try {
    const auth = await getAuthenticatedProfile();

    if (!auth?.user || !auth?.profile) {
      return null;
    }

    return {
      user: {
        id: String(auth.user.id),
        email: auth.user.email ?? null,
        last_sign_in_at: auth.user.last_sign_in_at ?? null,
      },
      profile: {
        id: String(auth.profile.id),
        role: String(auth.profile.role || "").toLowerCase(),
        full_name: auth.profile.full_name ?? null,
        is_frozen: Boolean(auth.profile.is_frozen),
        force_reauth_after: auth.profile.force_reauth_after ?? null,
      },
    };
  } catch {
    return null;
  }
}

async function validatePostedActor(
  formData: FormData,
  allowedRoles: readonly string[]
): Promise<ActionAuth | null> {
  try {
    const actorUserId = asText(formData, "actor_user_id");
    const actorRole = asText(formData, "actor_role").toLowerCase();
    const actorTs = asText(formData, "actor_ts");
    const actorSig = asText(formData, "actor_sig");

    if (!actorUserId || !actorRole || !actorTs || !actorSig) {
      return null;
    }

    if (!actorTs || !Number.isFinite(Number(actorTs))) {
      return null;
    }

    const expectedSig = signOwnerAction(actorUserId, actorRole, actorTs);
    const sigOk = safeEqualText(actorSig, expectedSig);
    const isDev = process.env.NODE_ENV !== "production";

    if (!sigOk && !isDev) {
      return null;
    }

    const supabase = getAdminSupabase();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, full_name, is_frozen, force_reauth_after")
      .eq("id", actorUserId)
      .maybeSingle();

    const { data: userResult } = await supabase.auth.admin.getUserById(actorUserId);
    const user = userResult?.user;

    if (!profile?.id && !user?.id) {
      return null;
    }

    const liveRole = resolveLiveStaffRole({
      profileRole: (profile as any)?.role ?? null,
      appRole: (user as any)?.app_metadata?.role ?? null,
      userRole: (user as any)?.user_metadata?.role ?? null,
    });
    const currentSessionTs = user?.last_sign_in_at
      ? String(new Date(user.last_sign_in_at).getTime())
      : "";

    if (!allowedRoles.includes(liveRole)) {
      return null;
    }

    if (
      Boolean(
        (user as any)?.app_metadata?.is_frozen ??
          (user as any)?.user_metadata?.is_frozen ??
          (profile as any)?.is_frozen
      )
    ) {
      return null;
    }

    if (currentSessionTs && actorTs !== currentSessionTs) {
      return null;
    }

    const auth: ActionAuth = {
      user: {
        id: actorUserId,
        email: user?.email ?? null,
        last_sign_in_at: user?.last_sign_in_at ?? null,
      },
      profile: {
        id: String((profile as any)?.id || actorUserId),
        role: liveRole,
        full_name: ((profile as any).full_name as string | null) ?? null,
        is_frozen: Boolean(
          (user as any)?.app_metadata?.is_frozen ??
            (user as any)?.user_metadata?.is_frozen ??
            (profile as any).is_frozen
        ),
        force_reauth_after:
          ((user as any)?.app_metadata?.force_reauth_after as string | null) ??
          ((user as any)?.user_metadata?.force_reauth_after as string | null) ??
          ((profile as any).force_reauth_after as string | null) ??
          null,
      },
    };

    if (needsForcedReauth(auth)) {
      return null;
    }

    return auth;
  } catch {
    return null;
  }
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

async function writeSecurityLog(input: {
  event_type: string;
  route?: string | null;
  user_id?: string | null;
  role?: string | null;
  actor_user_id?: string | null;
  actor_role?: string | null;
  email?: string | null;
  success?: boolean;
  details?: Record<string, unknown>;
}) {
  try {
    const supabase = getAdminSupabase();
    const req = await getRequestMeta();
    const actorUserId = input.actor_user_id ?? input.user_id ?? null;
    const actorRole = input.actor_role ?? input.role ?? null;
    const targetUserId =
      input.user_id && input.user_id !== actorUserId ? input.user_id : null;
    const targetRole =
      input.role && input.role !== actorRole ? input.role : null;

    await supabase.from("care_security_logs").insert({
      event_type: input.event_type,
      route: input.route ?? null,
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
    // ignore log failure
  }
}

async function requireOwnerOrManager(formData?: FormData) {
  if (formData) {
    const posted = await validatePostedActor(formData, ["owner", "manager"]);
    if (posted) return posted;
  }

  const auth = await getActionAuthenticatedProfile();
  const role = auth?.profile?.role?.toLowerCase();

  if (
    auth?.profile &&
    role &&
    ["owner", "manager"].includes(role) &&
    !auth.profile.is_frozen &&
    !needsForcedReauth(auth)
  ) {
    return auth;
  }

  return null;
}

async function requireOwner(formData?: FormData) {
  if (formData) {
    const posted = await validatePostedActor(formData, ["owner"]);
    if (posted) return posted;
  }

  const auth = await getActionAuthenticatedProfile();
  const role = auth?.profile?.role?.toLowerCase();

  if (
    auth?.profile &&
    role === "owner" &&
    !auth.profile.is_frozen &&
    !needsForcedReauth(auth)
  ) {
    return auth;
  }

  return null;
}

async function requireOwnerManagerOrRider(formData?: FormData) {
  if (formData) {
    const posted = await validatePostedActor(formData, ["owner", "manager", "rider"]);
    if (posted) return posted;
  }

  const auth = await getActionAuthenticatedProfile();
  const role = auth?.profile?.role?.toLowerCase();

  if (
    auth?.profile &&
    role &&
    ["owner", "manager", "rider"].includes(role) &&
    !auth.profile.is_frozen &&
    !needsForcedReauth(auth)
  ) {
    return auth;
  }

  return null;
}

async function requireOwnerManagerOrStaff(formData?: FormData) {
  if (formData) {
    const posted = await validatePostedActor(formData, ["owner", "manager", "staff"]);
    if (posted) return posted;
  }

  const auth = await getActionAuthenticatedProfile();
  const role = auth?.profile?.role?.toLowerCase();

  if (
    auth?.profile &&
    role &&
    ["owner", "manager", "staff"].includes(role) &&
    !auth.profile.is_frozen &&
    !needsForcedReauth(auth)
  ) {
    return auth;
  }

  return null;
}

async function requireExpenseRecorder(formData?: FormData) {
  if (formData) {
    const posted = await validatePostedActor(formData, [
      "owner",
      "manager",
      "rider",
      "support",
    ]);
    if (posted) return posted;
  }

  const auth = await getActionAuthenticatedProfile();
  const role = auth?.profile?.role?.toLowerCase();

  if (
    auth?.profile &&
    role &&
    ["owner", "manager", "rider", "support"].includes(role) &&
    !auth.profile.is_frozen &&
    !needsForcedReauth(auth)
  ) {
    return auth;
  }

  return null;
}

async function resolveBookingId(lookup: string) {
  const supabase = getAdminSupabase();
  const normalized = lookup.trim();

  if (!normalized) return null;

  const asUuid = /^[0-9a-f-]{36}$/i.test(normalized);
  if (asUuid) {
    return normalized;
  }

  const { data } = await supabase
    .from("care_bookings")
    .select("id")
    .eq("tracking_code", normalized)
    .maybeSingle();

  return data?.id ?? null;
}

async function ensureLedgerEntry(input: {
  entry_type: string;
  source_table: string;
  source_id: string;
  booking_id: string | null;
  direction: "inflow" | "outflow";
  amount: number;
  narration: string;
}) {
  try {
    const supabase = getAdminSupabase();

    const { data: existing } = await supabase
      .from("care_finance_ledger")
      .select("id")
      .eq("source_table", input.source_table)
      .eq("source_id", input.source_id)
      .eq("direction", input.direction)
      .maybeSingle();

    if (existing?.id) return;

    await supabase.from("care_finance_ledger").insert({
      entry_type: input.entry_type,
      source_table: input.source_table,
      source_id: input.source_id,
      booking_id: input.booking_id,
      direction: input.direction,
      amount: input.amount,
      narration: input.narration,
    });
  } catch {
    // ignore ledger write failure
  }
}

async function upsertProfilePatch(
  userId: string,
  patch: Record<string, unknown>
): Promise<{
  error: { message?: string } | null;
  created: boolean;
  auth_meta_error?: { message?: string } | null;
  profile_write_error?: { message?: string } | null;
}> {
  const result = await syncStaffIdentity(userId, {
    role: typeof patch.role === "string" ? String(patch.role) : undefined,
    is_frozen: typeof patch.is_frozen === "boolean" ? Boolean(patch.is_frozen) : undefined,
    full_name: typeof patch.full_name === "string" ? String(patch.full_name) : undefined,
    phone: typeof patch.phone === "string" ? String(patch.phone) : undefined,
    force_reauth_after:
      patch.force_reauth_after === null
        ? null
        : typeof patch.force_reauth_after === "string"
        ? String(patch.force_reauth_after)
        : undefined,
  });

  return {
    error: result.error,
    created: result.created,
    auth_meta_error: result.auth_meta_error ?? null,
    profile_write_error: result.profile_write_error ?? null,
  };
}

async function countOwners() {
  const supabase = getAdminSupabase();
  const authUsers = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  const users = authUsers.data?.users ?? [];

  return users.filter((user) => {
    const appRole = normalizeStaffRole(String(user.app_metadata?.role || ""));
    const userRole = normalizeStaffRole(String(user.user_metadata?.role || ""));
    const deletedAt =
      String(user.app_metadata?.deleted_at || user.user_metadata?.deleted_at || "").trim();
    if (deletedAt) return false;
    return appRole === "owner" || userRole === "owner";
  }).length;
}

async function getPricingRow(pricingId: string) {
  if (!pricingId) return null;

  const supabase = getAdminSupabase();

  const { data } = await supabase
    .from("care_pricing")
    .select("id, category, item_name, description, unit, price, is_active")
    .eq("id", pricingId)
    .maybeSingle();

  if (!data) return null;
  if (!Boolean((data as any).is_active)) return null;

  return {
    id: String((data as any).id),
    category: String((data as any).category || ""),
    item_name: String((data as any).item_name || ""),
    description: ((data as any).description as string | null) ?? null,
    unit: String((data as any).unit || "item"),
    price: Number((data as any).price ?? 0),
  };
}

async function ensureSettingsRow(basePayload: Record<string, unknown>) {
  const supabase = getAdminSupabase();

  const { data: existing } = await supabase
    .from("care_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (existing?.id) return existing.id as string;

  const { data: inserted } = await supabase
    .from("care_settings")
    .insert(basePayload as any)
    .select("id")
    .maybeSingle();

  return (inserted?.id as string | undefined) ?? null;
}

async function tryUpdateOptionalSetting(
  settingsId: string,
  field: (typeof OPTIONAL_SETTINGS_FIELDS)[number],
  value: string | null
) {
  const supabase = getAdminSupabase();

  const { error } = await supabase
    .from("care_settings")
    .update({ [field]: value } as any)
    .eq("id", settingsId);

  return { field, error };
}

async function recalculateBookingTotals(bookingId: string) {
  if (!bookingId) return;

  try {
    const supabase = getAdminSupabase();
    await supabase.rpc("care_recalculate_booking_totals", {
      p_booking_id: bookingId,
    });
  } catch {
    // ignore recalculation failures
  }
}

function renderTemplate(
  template: string | null | undefined,
  variables: Record<string, string>
) {
  const source = String(template || "").trim();
  if (!source) return "";

  return Object.entries(variables).reduce(
    (output, [key, value]) => output.replaceAll(`{${key}}`, value),
    source
  );
}

function formatCurrencyAmount(amount: number, currency = "NGN") {
  return `${currency} ${Math.max(0, Number(amount || 0)).toLocaleString()}`;
}

function formatRoleLabel(role?: string | null) {
  const normalized = String(role || "staff").trim().toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function normalizeDisplayName(value?: string | null, fallback = "Staff member") {
  const text = String(value || "").trim();
  return text || fallback;
}

function createDeliveryDedupeKey(prefix: string, email: string, tokenHash?: string | null) {
  const normalizedEmail = String(email || "").trim().toLowerCase() || "missing";
  const nonce = String(tokenHash || Date.now()).trim() || String(Date.now());
  return `${prefix}:${normalizedEmail}:${nonce}`;
}

function isSupabaseAuthProvisioningError(error?: { message?: string | null; code?: string | null } | null) {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toLowerCase();

  return (
    message.includes("database error") ||
    message.includes("unexpected_failure") ||
    code === "unexpected_failure"
  );
}

type StaffProvisioningAuthError = {
  message: string;
  code: string | null;
  detail: string | null;
  constraint: string | null;
  status: number | null;
  raw: Record<string, unknown> | null;
};

type ReusableProvisioningSlot = {
  user: any;
  source: "provisioning_slot" | "archived_account";
  referenceCount: number;
};

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function extractConstraintName(message?: string | null, detail?: string | null) {
  const source = `${String(message || "")} ${String(detail || "")}`;
  const match = source.match(/constraint "([^"]+)"/i);
  return String(match?.[1] || "").trim() || null;
}

function isProvisioningSlotUser(user?: any) {
  return Boolean(user?.app_metadata?.provisioning_slot ?? user?.user_metadata?.provisioning_slot);
}

function isProfilesRoleConstraintBlock(error?: StaffProvisioningAuthError | { message?: string | null; detail?: string | null; constraint?: string | null } | null) {
  const message = String(error?.message || "").toLowerCase();
  const detail = String((error as { detail?: string | null } | null)?.detail || "").toLowerCase();
  const constraint = String((error as { constraint?: string | null } | null)?.constraint || "").toLowerCase();

  return (
    constraint === "profiles_role_check" ||
    message.includes("profiles_role_check") ||
    detail.includes("profiles_role_check") ||
    (message.includes("violates check constraint") && message.includes("profiles")) ||
    detail.includes("failing row contains") && detail.includes(", customer,")
  );
}

function summarizeProvisioningFailure(error?: StaffProvisioningAuthError | null) {
  if (!error) return "Unknown error";

  if (isProfilesRoleConstraintBlock(error)) {
    return "The live auth mirror is still inserting a customer profile, but the current profiles_role_check rule rejects customer.";
  }

  return error.message || "Unknown error";
}

function buildProvisioningSlotEmail(userId: string) {
  const safeId = String(userId || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  return `archived-slot+${safeId || randomUUID().replace(/-/g, "")}@recycled.henryco.invalid`;
}

async function createAuthUserWithDiagnostics(input: {
  email: string;
  fullName: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
}): Promise<{
  user: any | null;
  error: StaffProvisioningAuthError | null;
}> {
  const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!url || !serviceRoleKey) {
    return {
      user: null,
      error: {
        message: "Supabase admin environment variables are missing for auth provisioning.",
        code: "missing_admin_env",
        detail: null,
        constraint: null,
        status: 0,
        raw: null,
      },
    };
  }

  const response = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      password: `${randomBytes(12).toString("base64url")}!Aa`,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName,
        phone: input.phone,
        role: input.role,
        is_frozen: !input.isActive,
      },
      app_metadata: {
        role: input.role,
        is_frozen: !input.isActive,
      },
    }),
  });

  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  if (!response.ok) {
    const message = String(payload?.message || payload?.error_description || payload?.error || "").trim();
    const detail = String(payload?.detail || "").trim() || null;

    return {
      user: null,
      error: {
        message: [message, detail].filter(Boolean).join(" ") || `Supabase Auth rejected the request with status ${response.status}.`,
        code: String(payload?.code || "").trim() || null,
        detail,
        constraint: extractConstraintName(message, detail),
        status: response.status,
        raw: payload,
      },
    };
  }

  const createdId =
    String(payload?.id || "").trim() ||
    String(asRecord(payload?.user)?.id || "").trim();

  if (!createdId) {
    return {
      user: null,
      error: {
        message: "Supabase Auth accepted the request but returned no user id.",
        code: "missing_user_id",
        detail: null,
        constraint: null,
        status: response.status,
        raw: payload,
      },
    };
  }

  const verifiedUser = await getAdminSupabase().auth.admin.getUserById(createdId);

  if (verifiedUser.error || !verifiedUser.data?.user) {
    return {
      user: null,
      error: {
        message: verifiedUser.error?.message || "The new auth account could not be reloaded after creation.",
        code: (verifiedUser.error as { code?: string } | null)?.code ?? null,
        detail: null,
        constraint: null,
        status: response.status,
        raw: payload,
      },
    };
  }

  return {
    user: verifiedUser.data.user,
    error: null,
  };
}

async function findReusableProvisioningSlot(): Promise<ReusableProvisioningSlot | null> {
  const supabase = getAdminSupabase();
  let page = 1;

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      return null;
    }

    const users = data.users || [];

    for (const user of users) {
      const deletedAt = String(user.app_metadata?.deleted_at || user.user_metadata?.deleted_at || "").trim();
      if (!deletedAt) continue;

      const role = resolveLiveStaffRole({
        appRole: user.app_metadata?.role ?? null,
        userRole: user.user_metadata?.role ?? null,
      });

      if (role === "owner") continue;

      if (isProvisioningSlotUser(user)) {
        return {
          user,
          source: "provisioning_slot",
          referenceCount: 0,
        };
      }

      const references = await getStaffReferenceSummary(user.id);
      if (!references.hasHistory) {
        return {
          user,
          source: "archived_account",
          referenceCount: references.total,
        };
      }
    }

    if (users.length < 200) break;
    page += 1;
  }

  return null;
}

async function recycleProvisioningSlotIntoStaff(input: {
  candidate: ReusableProvisioningSlot;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
}): Promise<{
  user: any | null;
  error: { message?: string; code?: string } | null;
}> {
  const supabase = getAdminSupabase();
  const forceReauthAt = new Date().toISOString();
  const updateResult = await supabase.auth.admin.updateUserById(input.candidate.user.id, {
    email: input.email,
    email_confirm: true,
    password: `${randomBytes(12).toString("base64url")}!Aa`,
    user_metadata: {
      ...(input.candidate.user.user_metadata ?? {}),
      full_name: input.fullName,
      phone: input.phone,
      role: input.role,
      is_frozen: !input.isActive,
      force_reauth_after: forceReauthAt,
      deleted_at: null,
      provisioning_slot: false,
    },
    app_metadata: {
      ...(input.candidate.user.app_metadata ?? {}),
      role: input.role,
      is_frozen: !input.isActive,
      force_reauth_after: forceReauthAt,
      deleted_at: null,
      provisioning_slot: false,
    },
  });

  return {
    user: updateResult.data.user ?? null,
    error: updateResult.error ?? null,
  };
}

async function retireStaffAccountIntoProvisioningSlot(input: {
  user: any;
  deletedAt: string;
}): Promise<{
  user: any | null;
  slotEmail: string;
  error: { message?: string } | null;
}> {
  const supabase = getAdminSupabase();
  const slotEmail = buildProvisioningSlotEmail(input.user.id);
  const updateResult = await supabase.auth.admin.updateUserById(input.user.id, {
    email: slotEmail,
    email_confirm: true,
    password: `${randomBytes(12).toString("base64url")}!Aa`,
    user_metadata: {
      ...(input.user.user_metadata ?? {}),
      full_name: null,
      phone: null,
      role: "staff",
      is_frozen: false,
      force_reauth_after: null,
      deleted_at: input.deletedAt,
      provisioning_slot: true,
    },
    app_metadata: {
      ...(input.user.app_metadata ?? {}),
      role: "staff",
      is_frozen: false,
      force_reauth_after: null,
      deleted_at: input.deletedAt,
      provisioning_slot: true,
    },
  });

  return {
    user: updateResult.data.user ?? null,
    slotEmail,
    error: updateResult.error ?? null,
  };
}

function buildInviteDispatchMessage(status: "sent" | "queued" | "skipped" | "failed", reason?: string | null) {
  if (status === "sent") {
    return "A fresh setup email has been sent.";
  }

  if (status === "queued") {
    return `The setup email is queued for delivery${reason ? `: ${reason}` : "."}`;
  }

  if (status === "skipped") {
    return `The setup email was not sent${reason ? `: ${reason}` : "."}`;
  }

  return `The setup email failed${reason ? `: ${reason}` : "."}`;
}

type StaffInviteDispatchSummary = {
  delivery: Awaited<ReturnType<typeof sendStaffInvitationEmail>> | null;
  accessUrl: string | null;
  tokenHash: string | null;
  linkError: string | null;
  message: string;
  state: "ok" | "warn" | "error";
};

async function dispatchStaffSetupEmail(input: {
  email: string;
  staffName: string;
  role: string;
  invitedBy: string | null;
}) : Promise<StaffInviteDispatchSummary> {
  const link = await createStaffAccessLink(input.email, "invite");

  if (link.error || !link.url) {
    return {
      delivery: null,
      accessUrl: null,
      tokenHash: link.tokenHash,
      linkError: link.error?.message || "Secure setup link generation failed.",
      message: `The secure setup link could not be prepared${link.error?.message ? `: ${link.error.message}` : "."}`,
      state: "error",
    };
  }

  const delivery = await sendStaffInvitationEmail(
    input.email,
    {
      staffName: normalizeDisplayName(input.staffName || input.email),
      roleLabel: formatRoleLabel(input.role),
      accessUrl: link.url,
      invitedBy: input.invitedBy,
    },
    {
      dedupeKey: createDeliveryDedupeKey("staff-invite", input.email, link.tokenHash),
    }
  );

  return {
    delivery,
    accessUrl: link.url,
    tokenHash: link.tokenHash,
    linkError: null,
    message: buildInviteDispatchMessage(delivery.status, delivery.reason),
    state:
      delivery.status === "failed"
        ? "error"
        : delivery.status === "queued" || delivery.status === "skipped"
          ? "warn"
          : "ok",
  };
}

type PricingProposalPayload = {
  pricingId: string | null;
  category: string;
  itemName: string;
  description: string | null;
  unit: string;
  price: number;
  sortOrder: number;
  isFeatured: boolean;
  isActive: boolean;
};

function createPricingProposalPayload(formData: FormData): PricingProposalPayload {
  return {
    pricingId: asText(formData, "pricing_id") || asText(formData, "id") || null,
    category: asText(formData, "category"),
    itemName: asText(formData, "item_name"),
    description: asNullableText(formData, "description"),
    unit: asText(formData, "unit") || "item",
    price: Math.max(0, asNumber(formData, "price")),
    sortOrder: asNumber(formData, "sort_order"),
    isFeatured: asBool(formData, "is_featured"),
    isActive: asBool(formData, "is_active"),
  };
}

async function getStaffReferenceSummary(userId: string) {
  const supabase = getAdminSupabase();

  const [securityLogs, expensesCreated, expensesApproved, paymentsReceived, orderItemsCreated] =
    await Promise.all([
      supabase
        .from("care_security_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("care_expenses")
        .select("id", { count: "exact", head: true })
        .eq("created_by", userId),
      supabase
        .from("care_expenses")
        .select("id", { count: "exact", head: true })
        .eq("approved_by", userId),
      supabase
        .from("care_payments")
        .select("id", { count: "exact", head: true })
        .eq("received_by", userId),
      supabase
        .from("care_order_items")
        .select("id", { count: "exact", head: true })
        .eq("created_by", userId),
    ]);

  const total =
    Number(securityLogs.count || 0) +
    Number(expensesCreated.count || 0) +
    Number(expensesApproved.count || 0) +
    Number(paymentsReceived.count || 0) +
    Number(orderItemsCreated.count || 0);

  return {
    total,
    hasHistory: total > 0,
  };
}

async function sendProfileSyncAlert(input: {
  heading: string;
  summary: string;
  lines: string[];
}) {
  const settings = await getAdminSupabase().from("care_settings").select("*").limit(1).maybeSingle();
  const normalized = normalizeCareSettings((settings.data ?? null) as Record<string, unknown> | null);
  const recipients = Array.from(
    new Set(
      [
        String(process.env.OWNER_ALERT_EMAIL || "").trim(),
        normalized.support_email,
        normalized.payment_support_email,
        normalized.notification_reply_to_email,
      ]
        .map((value) => String(value || "").trim().toLowerCase())
        .filter(Boolean)
    )
  );

  if (recipients.length === 0) return;

  await Promise.all(
    recipients.map((recipient) =>
      sendAdminNotificationEmail(recipient, {
        heading: input.heading,
        summary: input.summary,
        lines: input.lines,
      })
    )
  );
}

async function getResolvedBookingById(bookingId: string) {
  const supabase = getAdminSupabase();
  const { data: booking } = await supabase
    .from("care_bookings")
    .select(
      "id, tracking_code, customer_name, email, phone, service_type, item_summary, status, pickup_date, pickup_slot, pickup_address"
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking?.id) {
    return null;
  }

  return applyEffectiveBookingStatus(booking);
}

async function sendBookingStatusEmail(input: { bookingId: string }) {
  try {
    const booking = await getResolvedBookingById(input.bookingId);

    if (!booking?.id) {
      return;
    }

    const family = inferCareServiceFamily(booking);
    const trackUrl = await buildTrackingUrl(booking.tracking_code, booking.phone);
    const statusLabel = getTrackingStatusLabel(booking.status, family);
    const statusMeaning = getTrackingStatusDescription(booking.status, family);
    const nextSteps = getTrackingCustomerGuidance(booking.status, family);

    if (booking.email) {
      await sendBookingStatusUpdateEmail(booking.email, booking.id, {
        customerName: normalizeDisplayName(booking.customer_name, "Customer"),
        trackingCode: booking.tracking_code,
        serviceFamilyLabel: getServiceFamilyLabel(family),
        serviceType: String(booking.service_type || "").trim() || "Service request",
        statusLabel,
        statusMeaning,
        nextSteps,
        trackUrl,
      });
    }

    if (booking.phone) {
      const whatsappResult = await sendWhatsAppText({
        phone: booking.phone,
        body: [
          `HenryCo Care update • ${booking.tracking_code}`,
          normalizeDisplayName(booking.customer_name, "Customer"),
          "",
          `${statusLabel}`,
          statusMeaning,
          "",
          nextSteps,
          "",
          trackUrl,
        ].join("\n"),
      });

      await writeSecurityLog({
        event_type: `booking_status_whatsapp_${whatsappResult.status}`,
        route: "/owner/bookings",
        email: booking.email ?? null,
        success: whatsappResult.status === "sent",
        details: {
          booking_id: booking.id,
          tracking_code: booking.tracking_code,
          recipient_phone: booking.phone,
          whatsapp_provider: whatsappResult.provider,
          whatsapp_status: whatsappResult.status,
          whatsapp_reason: whatsappResult.reason,
          whatsapp_message_id: whatsappResult.messageId,
          whatsapp_status_code: whatsappResult.statusCode,
          whatsapp_graph_error_code: whatsappResult.graphErrorCode,
          whatsapp_response_summary: whatsappResult.responseSummary,
        },
      });
    }
  } catch {
    // ignore status email failures
  }
}

async function maybeSendReviewRequest(input: { bookingId: string }) {
  try {
    const booking = await getResolvedBookingById(input.bookingId);

    if (!booking?.id || !booking.email) {
      return;
    }

    const family = inferCareServiceFamily({
      service_type: booking.service_type,
      item_summary: booking.item_summary,
      status: booking.status,
    });

    if (!isReviewEligibleStatus(family, booking.status)) {
      return;
    }

    const reviewUrl = await buildReviewUrl(booking.tracking_code, booking.phone);
    await sendReviewRequestEmail(booking.email, booking.id, {
      customerName: normalizeDisplayName(booking.customer_name, "Customer"),
      trackingCode: booking.tracking_code,
      serviceType: String(booking.service_type || "").trim() || "Service booking",
      serviceFamilyLabel:
        family === "office" ? "Office cleaning" : family === "home" ? "Home cleaning" : "Wardrobe care",
      reviewUrl,
    });
  } catch {
    // ignore review email failures
  }
}

async function queuePickedUpPaymentRequest(input: {
  bookingId: string;
  actorUserId: string;
  actorRole: string;
  route: string;
}) {
  try {
    const supabase = getAdminSupabase();

    const [{ data: booking }, { data: settingsRow }] = await Promise.all([
      supabase
        .from("care_bookings")
        .select(
          "id, tracking_code, customer_name, email, service_type, quoted_total, amount_paid, balance_due, payment_status, payment_requested_at"
        )
        .eq("id", input.bookingId)
        .maybeSingle(),
      supabase.from("care_settings").select("*").limit(1).maybeSingle(),
    ]);

    if (!booking?.id) {
      return;
    }

    await recalculateBookingTotals(booking.id);

    const { data: refreshedBooking } = await supabase
      .from("care_bookings")
      .select(
        "id, tracking_code, customer_name, email, service_type, quoted_total, amount_paid, balance_due, payment_status, payment_requested_at"
      )
      .eq("id", booking.id)
      .maybeSingle();

    const bookingState = refreshedBooking ?? booking;
    const amountDue = Math.max(0, Number((bookingState as any).balance_due ?? 0));

    if (!amountDue) {
      return;
    }

    const { data: existingRequest } = await supabase
      .from("care_payment_requests")
      .select("id, status")
      .eq("booking_id", booking.id)
      .eq("request_kind", "picked_up_payment_request")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingRequest?.id && existingRequest.status !== "failed") {
      return;
    }

    const settings = normalizeCareSettings((settingsRow ?? null) as Record<string, unknown> | null);
    const requestedAt = new Date();
    const dueAt = new Date(requestedAt.getTime() + 1000 * 60 * 60 * 24);
    const amountText = `NGN ${amountDue.toLocaleString()}`;
    const instructions =
      settings.payment_instructions ||
      "Please send payment confirmation to the Henry & Co. Care team.";
    const templateBody =
      settings.picked_up_email_body ||
      [
        "Hello {customer_name},",
        "",
        "Your order with tracking code {tracking_code} has now been picked up successfully.",
        "",
        "Amount due: {amount_due}",
        "",
        "Please make payment to:",
        "Account name: {account_name}",
        "Account number: {account_number}",
        "Bank: {bank_name}",
        "",
        "{payment_instructions}",
        "",
        "Thank you,",
        "Henry & Co. Fabric Care",
      ].join("\n");

    const templateVariables = {
      customer_name: String((bookingState as any).customer_name || "Customer"),
      tracking_code: String((bookingState as any).tracking_code || ""),
      amount_due: amountText,
      account_name: settings.payment_account_name || settings.company_account_name || "Henry & Co. Care",
      account_number:
        settings.payment_account_number || settings.company_account_number || "Not provided yet",
      bank_name: settings.payment_bank_name || settings.company_bank_name || "Not provided yet",
      payment_instructions: instructions,
    };

    const { data: requestRow, error: requestError } = await supabase
      .from("care_payment_requests")
      .insert({
        booking_id: booking.id,
        request_kind: "picked_up_payment_request",
        currency: settings.payment_currency || "NGN",
        amount_due: amountDue,
        bank_name: templateVariables.bank_name,
        account_name: templateVariables.account_name,
        account_number: templateVariables.account_number,
        instructions,
        recipient_email: (bookingState as any).email ?? null,
        status: "queued",
        payload: {
          service_type: (bookingState as any).service_type ?? null,
          ...templateVariables,
        },
      } as any)
      .select("id")
      .maybeSingle();

    if (requestError || !requestRow?.id) {
      return;
    }

    let queuedEmail = false;
    let sentEmail = false;

    if ((bookingState as any).email) {
      const trackUrl = await buildTrackingUrl(
        String((bookingState as any).tracking_code || ""),
        (bookingState as any).phone ?? null
      );
      const dispatch = await sendPaymentRequestEmail(
        (bookingState as any).email,
        booking.id,
        requestRow.id,
        {
          customerName: templateVariables.customer_name,
          trackingCode: templateVariables.tracking_code,
          amountDue: amountText,
          currencyLabel: settings.payment_currency || "NGN",
          accountName: templateVariables.account_name,
          accountNumber: templateVariables.account_number,
          bankName: templateVariables.bank_name,
          instructions: renderTemplate(templateBody, templateVariables),
          trackUrl,
        }
      );

      queuedEmail = dispatch.status === "queued" || dispatch.status === "sent";
      sentEmail = dispatch.status === "sent";
    }

    await supabase
      .from("care_bookings")
      .update({
        payment_requested_at: requestedAt.toISOString(),
        payment_due_at: dueAt.toISOString(),
        last_payment_email_queued_at: queuedEmail ? requestedAt.toISOString() : null,
        last_payment_email_sent_at: sentEmail ? requestedAt.toISOString() : null,
      } as any)
      .eq("id", booking.id);

    await supabase
      .from("care_payment_requests")
      .update({
        status: sentEmail ? "sent" : queuedEmail ? "queued" : "failed",
      } as any)
      .eq("id", requestRow.id);

    await supabase
      .from("care_notification_queue")
      .update({
        status: sentEmail ? "sent" : queuedEmail ? "queued" : "failed",
        payload: {
          request_kind: "picked_up_payment_request",
          booking_id: booking.id,
          payment_request_id: requestRow.id,
          amount_due: amountDue,
          sent_email: sentEmail,
          queued_email: queuedEmail,
        },
      } as any)
      .eq("payment_request_id", requestRow.id)
      .eq("template_key", "picked_up_payment_request");

    await writeSecurityLog({
      event_type: "payment_request_queued",
      route: input.route,
      actor_user_id: input.actorUserId,
      actor_role: input.actorRole,
      success: true,
      details: {
        booking_id: booking.id,
        payment_request_id: requestRow.id,
        queued_email: queuedEmail,
        sent_email: sentEmail,
        amount_due: amountDue,
      },
    });
  } catch {
    // ignore queueing failure so status changes still succeed
  }
}

function revalidateOwnerCore() {
  revalidatePath("/owner");
  revalidatePath("/owner/insights");
  revalidatePath("/owner/bookings");
  revalidatePath("/owner/pricing");
  revalidatePath("/owner/notifications");
  revalidatePath("/owner/settings");
  revalidatePath("/owner/reviews");
  revalidatePath("/owner/records");
  revalidatePath("/owner/finance");
  revalidatePath("/owner/staff");
  revalidatePath("/owner/security");
  revalidatePath(STAFF_LOGIN_ROUTE);
  revalidatePath(STAFF_RECOVERY_ROUTE);
}

function revalidateManagerCore() {
  revalidatePath("/manager");
  revalidatePath("/manager/operations");
  revalidatePath("/manager/pricing");
  revalidatePath("/manager/expenses");
  revalidatePath("/manager/notifications");
}

function revalidateRiderCore() {
  revalidatePath("/rider");
  revalidatePath("/rider/pickups");
  revalidatePath("/rider/deliveries");
  revalidatePath("/rider/history");
  revalidatePath("/rider/expenses");
  revalidatePath("/rider/notifications");
}

function revalidateSupportCore() {
  revalidatePath("/support");
  revalidatePath("/support/inbox");
  revalidatePath("/support/payments");
  revalidatePath("/support/reviews");
  revalidatePath("/support/archive");
  revalidatePath("/support/notifications");
}

function revalidateStaffCore() {
  revalidatePath("/staff");
  revalidatePath("/staff/assignments");
  revalidatePath("/staff/history");
  revalidatePath("/staff/notifications");
}

function revalidateRoleAccessCore() {
  revalidateOwnerCore();
  revalidateManagerCore();
  revalidateRiderCore();
  revalidateSupportCore();
  revalidateStaffCore();
  revalidatePath(STAFF_LOGIN_ROUTE);
  revalidatePath(STAFF_RECOVERY_ROUTE);
}

function revalidatePublicCore() {
  revalidatePath("/");
  revalidatePath("/book");
  revalidatePath("/track");
  revalidatePath("/pricing");
  revalidatePath("/services");
  revalidatePath("/about");
  revalidatePath("/contact");
}

export async function updateBookingStatusAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/owner/bookings");
  const auth = await requireOwnerOrManager(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const supabase = getAdminSupabase();
  const id = asText(formData, "id");
  const requestedStatus = asText(formData, "status").toLowerCase();

  if (!id || !requestedStatus) {
    finish(route, "error", "Missing booking update details.");
  }

  const booking = await getResolvedBookingById(id);
  if (!booking?.id) {
    finish(route, "error", "The booking could not be resolved.");
  }

  const family = inferCareServiceFamily(booking);
  const allowed = new Set(getTrackingStatusOptions(family));
  if (!allowed.has(requestedStatus)) {
    finish(route, "error", "That status is not valid for this service workflow.");
  }

  const storedStatus = toStoredBookingStatus(requestedStatus, family);
  const { error } = await supabase.from("care_bookings").update({ status: storedStatus }).eq("id", id);

  await writeSecurityLog({
    event_type: "booking_status_updated",
    route,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    email: auth.user?.email ?? null,
    success: !error,
    details: {
      booking_id: id,
      tracking_code: booking.tracking_code,
      family,
      requested_status: requestedStatus,
      effective_status: requestedStatus,
      stored_status: storedStatus,
      error: error?.message || null,
    },
  });

  if (!error && family === "garment" && requestedStatus === "picked_up") {
    await queuePickedUpPaymentRequest({
      bookingId: id,
      actorUserId: auth.profile.id,
      actorRole: auth.profile.role,
      route,
    });
  }

  if (!error) {
    await sendBookingStatusEmail({ bookingId: id });
    await maybeSendReviewRequest({
      bookingId: id,
    });
  }

  revalidateOwnerCore();
  revalidateManagerCore();
  revalidateRiderCore();
  revalidateSupportCore();
  revalidateStaffCore();
  revalidatePath("/track");

  finish(
    route,
    error ? "error" : "ok",
    error
      ? `Booking status failed: ${error.message || "Unknown error"}`
      : `${getTrackingStatusLabel(requestedStatus, family)} saved.`
  );
}

export async function updateServiceExecutionStatusAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/staff");
  const auth = await requireOwnerManagerOrStaff(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const supabase = getAdminSupabase();
  const id = asText(formData, "id");
  const requestedStatus = asText(formData, "status").toLowerCase();

  if (!id || !requestedStatus) {
    finish(route, "error", "Missing service status details.");
  }

  const booking = await getResolvedBookingById(id);
  if (!booking?.id) {
    finish(route, "error", "The service booking could not be resolved.");
  }

  if (!isServiceBookingRecord(booking)) {
    finish(route, "error", "This action is only available for home and office service bookings.");
  }

  const family = inferCareServiceFamily(booking);
  const allowed = new Set(getTrackingStatusOptions(family));

  if (!allowed.has(requestedStatus)) {
    finish(route, "error", "That status is not valid for this service workflow.");
  }

  const storedStatus = toStoredBookingStatus(requestedStatus, family);
  const { error } = await supabase
    .from("care_bookings")
    .update({ status: storedStatus })
    .eq("id", id);

  await writeSecurityLog({
    event_type: "service_execution_status_updated",
    route,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    email: auth.user?.email ?? null,
    success: !error,
    details: {
      booking_id: id,
      tracking_code: booking.tracking_code,
      family,
      requested_status: requestedStatus,
      effective_status: requestedStatus,
      stored_status: storedStatus,
      error: error?.message || null,
    },
  });

  if (!error) {
    await sendBookingStatusEmail({ bookingId: id });
    await maybeSendReviewRequest({
      bookingId: id,
    });
  }

  revalidateOwnerCore();
  revalidateManagerCore();
  revalidateSupportCore();
  revalidateStaffCore();
  revalidatePath("/track");

  finish(
    route,
    error ? "error" : "ok",
    error
      ? `Service status failed: ${error.message || "Unknown error"}`
      : `${getTrackingStatusLabel(requestedStatus, family)} saved.`
  );
}

export async function updateRiderStatusAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/rider");
  const auth = await requireOwnerManagerOrRider(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const supabase = getAdminSupabase();
  const id = asText(formData, "id");
  const requestedStatus = asText(formData, "status").toLowerCase();

  const allowed = ["picked_up", "out_for_delivery", "delivered"];
  if (!id || !allowed.includes(requestedStatus)) {
    finish(route, "error", "Invalid rider status update.");
  }

  const booking = await getResolvedBookingById(id);
  if (!booking?.id) {
    finish(route, "error", "The garment booking could not be resolved.");
  }

  const family = inferCareServiceFamily(booking);
  const storedStatus = toStoredBookingStatus(requestedStatus, family);
  const { error } = await supabase
    .from("care_bookings")
    .update({ status: storedStatus })
    .eq("id", id);

  await writeSecurityLog({
    event_type: "rider_status_updated",
    route,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    email: auth.user?.email ?? null,
    success: !error,
    details: {
      booking_id: id,
      tracking_code: booking.tracking_code,
      family,
      requested_status: requestedStatus,
      effective_status: requestedStatus,
      stored_status: storedStatus,
      error: error?.message || null,
    },
  });

  if (!error && requestedStatus === "picked_up") {
    await queuePickedUpPaymentRequest({
      bookingId: id,
      actorUserId: auth.profile.id,
      actorRole: auth.profile.role,
      route,
    });
  }

  if (!error) {
    await sendBookingStatusEmail({ bookingId: id });
    await maybeSendReviewRequest({
      bookingId: id,
    });
  }

  revalidateOwnerCore();
  revalidateManagerCore();
  revalidateRiderCore();
  revalidateStaffCore();
  revalidatePath("/track");

  finish(
    route,
    error ? "error" : "ok",
    error
      ? `Status update failed: ${error.message || "Unknown error"}`
      : `${getTrackingStatusLabel(requestedStatus, family)} saved.`
  );
}

export async function createOrderItemAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/manager/operations");
  const auth = await requireOwnerOrManager(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const supabase = getAdminSupabase();

  const bookingLookup = asText(formData, "booking_lookup");
  const bookingId = await resolveBookingId(bookingLookup);
  const pricingId = asText(formData, "pricing_id");
  const pricing = pricingId ? await getPricingRow(pricingId) : null;

  const quantity = Math.max(1, asNumber(formData, "quantity"));
  const urgent = asBool(formData, "urgent");
  const treatment = normalizeTreatment(asText(formData, "treatment"));
  const brand = asNullableText(formData, "brand");
  const color = asNullableText(formData, "color");
  const manualGarmentType = asText(formData, "garment_type");
  const manualServiceType = asNullableText(formData, "service_type");
  const rawNotes = asNullableText(formData, "notes");

  const garment_type = manualGarmentType || pricing?.item_name || "";
  const service_type = manualServiceType || pricing?.category || null;
  const unit_price = pricing ? Number(pricing.price || 0) : 0;
  const base_total = unit_price * quantity;
  const treatment_total = getTreatmentSurchargePerUnit(treatment) * quantity;
  const urgent_total = urgent ? Math.round(base_total * 0.2) : 0;
  const line_total = base_total + treatment_total + urgent_total;

  const notes = [
    rawNotes,
    `[treatment: ${treatment}]`,
    pricing
      ? `[pricing_ref: ${pricing.item_name} | ${pricing.category} | unit ${pricing.unit} | ₦${unit_price}]`
      : null,
    `[base_total: ₦${base_total}]`,
    `[treatment_total: ₦${treatment_total}]`,
    `[urgent_total: ₦${urgent_total}]`,
    `[line_total: ₦${line_total}]`,
  ]
    .filter(Boolean)
    .join(" ");

  if (!bookingId || !garment_type) {
    finish(route, "error", "Booking reference or garment type is missing.");
  }

  let error: { message?: string } | null = null;

  const extendedAttempt = await supabase.from("care_order_items").insert({
    booking_id: bookingId,
    garment_type,
    service_type,
    brand,
    color,
    quantity,
    urgent,
    intake_status: "received",
    notes,
    created_by: auth.profile.id,
    pricing_id: pricing?.id ?? null,
    pricing_category: pricing?.category ?? null,
    pricing_item_name: pricing?.item_name ?? null,
    pricing_unit: pricing?.unit ?? null,
    unit_price_snapshot: unit_price,
    urgent_fee_snapshot: urgent_total,
    line_total,
  } as any);

  if (extendedAttempt.error) {
    const fallbackAttempt = await supabase.from("care_order_items").insert({
      booking_id: bookingId,
      garment_type,
      service_type,
      brand,
      color,
      quantity,
      urgent,
      notes,
      created_by: auth.profile.id,
    });

    error = fallbackAttempt.error;
  }

  if (!error) {
    await recalculateBookingTotals(bookingId);
  }

  await writeSecurityLog({
    event_type: "order_item_created",
    route,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    email: auth.user?.email ?? null,
    success: !error,
    details: {
      booking_lookup: bookingLookup,
      booking_id: bookingId,
      pricing_id: pricing?.id ?? null,
      garment_type,
      service_type,
      quantity,
      urgent,
      treatment,
      line_total,
      error: error?.message || null,
    },
  });

  revalidateOwnerCore();
  revalidateManagerCore();
  revalidatePath("/track");

  finish(
    route,
    error ? "error" : "ok",
    error ? `Item registration failed: ${error.message || "Unknown error"}` : "Garment item recorded."
  );
}

export async function recordPaymentAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/manager/operations");
  const auth = await requireOwnerOrManager(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const supabase = getAdminSupabase();
  const bookingLookup = asText(formData, "booking_lookup");
  const bookingId = await resolveBookingId(bookingLookup);

  const amount = asNumber(formData, "amount");
  const payment_method = asText(formData, "payment_method");
  const reference = asNullableText(formData, "reference");
  const notes = asNullableText(formData, "notes");

  if (!bookingId || amount <= 0 || !payment_method) {
    finish(route, "error", "Booking, amount, and payment method are required.");
  }

  let payment:
    | {
        id: string;
        booking_id: string | null;
        amount: number;
        payment_method: string;
        reference: string | null;
      }
    | null = null;

  let error: { message?: string } | null = null;

  const extendedAttempt = await supabase
    .from("care_payments")
    .insert({
      booking_id: bookingId,
      amount,
      payment_method,
      reference,
      notes,
      received_by: auth.profile.id,
      status: "confirmed",
    } as any)
    .select("id, booking_id, amount, payment_method, reference")
    .maybeSingle();

  if (extendedAttempt.error) {
    const fallbackAttempt = await supabase
      .from("care_payments")
      .insert({
        booking_id: bookingId,
        amount,
        payment_method,
        reference,
        notes,
        received_by: auth.profile.id,
      })
      .select("id, booking_id, amount, payment_method, reference")
      .maybeSingle();

    payment = fallbackAttempt.data;
    error = fallbackAttempt.error;
  } else {
    payment = extendedAttempt.data;
    error = null;
  }

  if (!error && payment?.id) {
    await ensureLedgerEntry({
      entry_type: "payment",
      source_table: "care_payments",
      source_id: payment.id,
      booking_id: payment.booking_id,
      direction: "inflow",
      amount: Number(payment.amount ?? 0),
      narration: `Payment received via ${payment.payment_method}${payment.reference ? ` • ${payment.reference}` : ""}`,
    });

    await supabase
      .from("care_payment_requests")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      } as any)
      .eq("booking_id", bookingId)
      .neq("status", "paid");

    await recalculateBookingTotals(bookingId);

    const { data: booking } = await supabase
      .from("care_bookings")
      .select("id, tracking_code, customer_name, email, phone, balance_due")
      .eq("id", bookingId)
      .maybeSingle();

    if (booking?.id && booking.email) {
      const trackUrl = await buildTrackingUrl(booking.tracking_code, booking.phone ?? null);

      await sendPaymentReceivedEmail(booking.email, booking.id, {
        customerName: normalizeDisplayName(booking.customer_name, "Customer"),
        trackingCode: booking.tracking_code,
        amountPaid: formatCurrencyAmount(amount),
        balanceDue: formatCurrencyAmount(Number(booking.balance_due ?? 0)),
        paymentMethod: payment_method,
        reference,
        trackUrl,
      });
    }
  }

  await writeSecurityLog({
    event_type: "payment_recorded",
    route,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    email: auth.user?.email ?? null,
    success: !error,
    details: {
      booking_lookup: bookingLookup,
      booking_id: bookingId,
      amount,
      payment_method,
      reference,
      error: error?.message || null,
    },
  });

  revalidateOwnerCore();
  revalidateManagerCore();
  revalidatePath("/track");

  finish(
    route,
    error ? "error" : "ok",
    error ? `Payment save failed: ${error.message || "Unknown error"}` : "Payment recorded."
  );
}

export async function createExpenseAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/manager/expenses");
  const auth = await requireExpenseRecorder(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const supabase = getAdminSupabase();

  const booking_lookup = asText(formData, "booking_lookup");
  const booking_id = booking_lookup ? await resolveBookingId(booking_lookup) : null;
  const expense_date =
    asText(formData, "expense_date") || new Date().toISOString().slice(0, 10);
  const category = asText(formData, "category");
  const vendor = asNullableText(formData, "vendor");
  const rawDescription = asText(formData, "description");
  const notes = asNullableText(formData, "notes");
  const amount = asNumber(formData, "amount");
  const payment_method = asNullableText(formData, "payment_method");
  const manualReceiptUrl = asNullableText(formData, "receipt_url");
  const receiptFile = formData.get("receipt_file");

  if (!category || !rawDescription || amount <= 0) {
    finish(route, "error", "Expense category, description, and amount are required.");
  }

  let uploadedReceipt:
    | {
        secureUrl: string;
        publicId: string;
      }
    | null = null;

  if (receiptFile instanceof File && receiptFile.size > 0) {
    try {
      uploadedReceipt = await uploadCareImage(receiptFile, {
        folderSuffix: "expenses",
        publicIdPrefix: `${category || "expense"}-${booking_lookup || auth.profile.id}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Image upload failed.";
      finish(route, "error", message);
    }
  }

  const receipt_url = uploadedReceipt?.secureUrl || manualReceiptUrl;
  const autoApproved = auth.profile.role === "owner";

  const basePayload = {
    expense_date,
    category,
    vendor,
    description: [
      rawDescription,
      booking_lookup ? `[ref: ${booking_lookup}]` : null,
      notes ? `[note: ${notes}]` : null,
    ]
      .filter(Boolean)
      .join(" "),
    amount,
    payment_method,
    receipt_url,
    created_by: auth.profile.id,
    approval_status: autoApproved ? "approved" : "recorded",
    approved_by: autoApproved ? auth.profile.id : null,
  };

  let expense:
    | {
        id: string;
        amount: number;
        category: string;
        description: string | null;
      }
    | null = null;

  let error: { message?: string } | null = null;

  const extendedAttempt = await supabase
    .from("care_expenses")
    .insert({
      ...basePayload,
      booking_id,
      notes,
      created_by_role: auth.profile.role,
      source_route: route,
      division: "care",
    } as any)
    .select("id, amount, category, description")
    .maybeSingle();

  if (extendedAttempt.error) {
    const fallbackAttempt = await supabase
      .from("care_expenses")
      .insert(basePayload)
      .select("id, amount, category, description")
      .maybeSingle();

    expense = fallbackAttempt.data;
    error = fallbackAttempt.error;
  } else {
    expense = extendedAttempt.data;
    error = null;
  }

  if (!error && autoApproved && expense?.id) {
    await ensureLedgerEntry({
      entry_type: "expense",
      source_table: "care_expenses",
      source_id: expense.id,
      booking_id,
      direction: "outflow",
      amount: Number(expense.amount ?? 0),
      narration: `${expense.category}: ${expense.description || "Expense"}`,
    });
  }

  await writeSecurityLog({
    event_type: "expense_created",
    route,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    email: auth.user?.email ?? null,
    success: !error,
    details: {
      booking_lookup: booking_lookup || null,
      booking_id,
      expense_date,
      category,
      amount,
      payment_method,
      receipt_url,
      receipt_public_id: uploadedReceipt?.publicId || null,
      auto_approved: autoApproved,
      error: error?.message || null,
    },
  });

  revalidateOwnerCore();
  revalidateManagerCore();
  revalidateRiderCore();
  revalidateSupportCore();

  finish(
    route,
    error ? "error" : "ok",
    error ? `Expense save failed: ${error.message || "Unknown error"}` : "Expense recorded."
  );
}

export async function approveExpenseAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/owner/finance");
  const auth = await requireOwner(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const supabase = getAdminSupabase();
  const id = asText(formData, "id");
  if (!id) finish(route, "error", "Missing expense id.");

  const { data: expense, error } = await supabase
    .from("care_expenses")
    .update({
      approval_status: "approved",
      approved_by: auth.profile.id,
    })
    .eq("id", id)
    .select("id, amount, category, description")
    .maybeSingle();

  if (!error && expense?.id) {
    await ensureLedgerEntry({
      entry_type: "expense",
      source_table: "care_expenses",
      source_id: expense.id,
      booking_id: null,
      direction: "outflow",
      amount: Number(expense.amount ?? 0),
      narration: `${expense.category}: ${expense.description || "Expense"}`,
    });
  }

  await writeSecurityLog({
    event_type: "expense_approved",
    route,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    email: auth.user?.email ?? null,
    success: !error,
    details: { expense_id: id, error: error?.message || null },
  });

  revalidateOwnerCore();
  revalidateManagerCore();
  revalidateRiderCore();
  revalidateSupportCore();

  finish(
    route,
    error ? "error" : "ok",
    error ? `Expense approval failed: ${error.message || "Unknown error"}` : "Expense approved."
  );
}

export async function voidExpenseAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/owner/finance");
  const auth = await requireOwner(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const supabase = getAdminSupabase();
  const id = asText(formData, "id");
  if (!id) finish(route, "error", "Missing expense id.");

  const { data: expense } = await supabase
    .from("care_expenses")
    .select("id, amount, description")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("care_expenses")
    .update({
      approval_status: "voided",
      approved_by: auth.profile.id,
    })
    .eq("id", id);

  if (!error && expense) {
    await ensureLedgerEntry({
      entry_type: "adjustment",
      source_table: "care_expense_void",
      source_id: expense.id,
      booking_id: null,
      direction: "inflow",
      amount: Number(expense.amount ?? 0),
      narration: `Expense void reversal: ${expense.description || "Expense"}`,
    });
  }

  await writeSecurityLog({
    event_type: "expense_voided",
    route,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    email: auth.user?.email ?? null,
    success: !error,
    details: { expense_id: id, error: error?.message || null },
  });

  revalidateOwnerCore();
  revalidateManagerCore();
  revalidateRiderCore();
  revalidateSupportCore();

  finish(
    route,
    error ? "error" : "ok",
    error ? `Expense void failed: ${error.message || "Unknown error"}` : "Expense voided."
  );
}

export async function updateStaffRoleAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/owner/staff");
  const auth = await requireOwner(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const supabase = getAdminSupabase();
  const id = asText(formData, "id");
  const role = normalizeStaffRole(asText(formData, "role"));

  if (!id || !role) {
    finish(route, "error", "Invalid role update.");
  }

  if (id === auth.profile.id && role !== "owner") {
    finish(route, "error", "Owner cannot remove their own owner role.");
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", id)
    .maybeSingle();
  const { data: existingUserResult } = await supabase.auth.admin.getUserById(id);
  const existingUser = existingUserResult?.user;

  const currentRole = resolveLiveStaffRole({
    profileRole: existingProfile?.role ?? null,
    appRole: (existingUser as any)?.app_metadata?.role ?? null,
    userRole: (existingUser as any)?.user_metadata?.role ?? null,
  });

  if (currentRole === "owner" && role !== "owner") {
    const ownerCount = await countOwners();

    if (ownerCount <= 1) {
      finish(
        route,
        "error",
        "This is the last owner account. Assign another owner before removing owner access here."
      );
    }
  }

  const roleChanged = currentRole !== role;
  const forceReauthAt = roleChanged ? new Date().toISOString() : undefined;

  const result = await upsertProfilePatch(id, {
    role,
    ...(forceReauthAt ? { force_reauth_after: forceReauthAt } : {}),
  });

  await writeSecurityLog({
    event_type: "staff_role_updated",
    route,
    user_id: id,
    role,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    email: auth.user?.email ?? null,
    success: !result.error,
    details: {
      target_user_id: id,
      previous_role: currentRole,
      new_role: role,
      force_reauth_after: forceReauthAt ?? null,
      profile_auto_created: result.created,
      auth_meta_error: result.auth_meta_error?.message || null,
      error: result.error?.message || null,
    },
  });

  revalidateRoleAccessCore();

  finish(
    route,
    result.error ? "error" : "ok",
    result.error
      ? `Role save failed: ${result.error.message || "Unknown error"}`
      : result.auth_meta_error
      ? "Role saved to profile, but auth metadata sync had an issue. Check auth logic."
      : result.profile_write_error
      ? `Staff access role updated to ${role}. The dashboard route will follow ${staffRoleHome(role)}. The profile mirror is still blocked by the current database auth policy.`
      : roleChanged
      ? `Staff role updated to ${role}. The next access refresh will route this user to ${staffRoleHome(role)}.`
      : "Staff role confirmed."
  );
}

export async function setStaffFrozenAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/owner/staff");
  const auth = await requireOwner(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const id = asText(formData, "id");
  const frozen = asText(formData, "frozen") === "true";

  if (!id) finish(route, "error", "Missing user id.");
  if (id === auth.profile.id) finish(route, "error", "You cannot freeze your own owner account.");

  const nowIso = new Date().toISOString();

  const result = await upsertProfilePatch(id, {
    is_frozen: frozen,
    force_reauth_after: frozen ? nowIso : null,
  });

  await writeSecurityLog({
    event_type: frozen ? "staff_frozen" : "staff_unfrozen",
    route,
    user_id: id,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    email: auth.user?.email ?? null,
    success: !result.error,
    details: {
      target_user_id: id,
      frozen,
      profile_auto_created: result.created,
      force_reauth_after: frozen ? nowIso : null,
      auth_meta_error: result.auth_meta_error?.message || null,
      error: result.error?.message || null,
    },
  });

  revalidateRoleAccessCore();

  finish(
    route,
    result.error ? "error" : "ok",
    result.error
      ? `Account state update failed: ${result.error.message || "Unknown error"}`
      : frozen
      ? "Staff account frozen."
      : "Staff account unfrozen."
  );
}

export async function setStaffArchivedAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/owner/staff");
  const auth = await requireOwner(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const supabase = getAdminSupabase();
  const id = asText(formData, "id");
  const archived = asText(formData, "archived") === "true";

  if (!id) finish(route, "error", "Missing user id.");
  if (id === auth.profile.id) {
    finish(route, "error", "You cannot archive your own owner account.");
  }

  const { data: existingUserResult } = await supabase.auth.admin.getUserById(id);
  const existingUser = existingUserResult?.user;

  const currentRole = resolveLiveStaffRole({
    appRole: (existingUser as any)?.app_metadata?.role ?? null,
    userRole: (existingUser as any)?.user_metadata?.role ?? null,
  });

  if (archived && currentRole === "owner") {
    const ownerCount = await countOwners();
    if (ownerCount <= 1) {
      finish(
        route,
        "error",
        "This is the last active owner account. Assign another owner before archiving it."
      );
    }
  }

  const nowIso = new Date().toISOString();
  const result = await syncStaffIdentity(id, {
    user: existingUser ?? undefined,
    // Archive is a deactivation state, not a freeze state. Deleted access should
    // remain the first-class reason shown at login and in owner tooling.
    is_frozen: false,
    force_reauth_after: archived ? nowIso : null,
    deleted_at: archived ? nowIso : null,
  });

  await writeSecurityLog({
    event_type: archived ? "staff_archived" : "staff_restored",
    route,
    user_id: id,
    role: currentRole,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    email: auth.user?.email ?? null,
    success: !result.error,
    details: {
      target_user_id: id,
      archived,
      deleted_at: archived ? nowIso : null,
      profile_auto_created: result.created,
      auth_meta_error: result.auth_meta_error?.message || null,
      profile_write_error: result.profile_write_error?.message || null,
      error: result.error?.message || null,
    },
  });

  revalidateRoleAccessCore();

  finish(
    route,
    result.error ? "error" : "ok",
    result.error
      ? `Account archive update failed: ${result.error.message || "Unknown error"}`
      : archived
      ? "Staff access archived. Sign-in is now blocked until restored."
      : "Staff access restored."
  );
}

export async function forceStaffReauthAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/owner/staff");
  const auth = await requireOwner(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const id = asText(formData, "id");

  if (!id) finish(route, "error", "Missing user id.");
  if (id === auth.profile.id) {
    finish(route, "error", "You cannot force reauth on your own owner account from here.");
  }

  const nowIso = new Date().toISOString();

  const result = await upsertProfilePatch(id, {
    force_reauth_after: nowIso,
  });

  await writeSecurityLog({
    event_type: "staff_force_reauth",
    route,
    user_id: id,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    email: auth.user?.email ?? null,
    success: !result.error,
    details: {
      target_user_id: id,
      force_reauth_after: nowIso,
      profile_auto_created: result.created,
      auth_meta_error: result.auth_meta_error?.message || null,
      error: result.error?.message || null,
    },
  });

  revalidateRoleAccessCore();

  finish(
    route,
    result.error ? "error" : "ok",
    result.error
      ? `Reauth flag failed: ${result.error.message || "Unknown error"}`
      : "Forced re-login has been set."
  );
}

export async function clearStaffReauthAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/owner/staff");
  const auth = await requireOwner(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const id = asText(formData, "id");
  if (!id) finish(route, "error", "Missing user id.");

  const result = await upsertProfilePatch(id, {
    force_reauth_after: null,
  });

  await writeSecurityLog({
    event_type: "staff_force_reauth_cleared",
    route,
    user_id: id,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    email: auth.user?.email ?? null,
    success: !result.error,
    details: {
      target_user_id: id,
      profile_auto_created: result.created,
      auth_meta_error: result.auth_meta_error?.message || null,
      error: result.error?.message || null,
    },
  });

  revalidateRoleAccessCore();

  finish(
    route,
    result.error ? "error" : "ok",
    result.error
      ? `Clearing reauth flag failed: ${result.error.message || "Unknown error"}`
      : "Forced re-login flag cleared."
  );
}

export async function createStaffAccountAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/owner/staff");
  const auth = await requireOwner(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const supabase = getAdminSupabase();
  const email = asText(formData, "email").toLowerCase();
  const fullName = asNullableText(formData, "full_name");
  const phone = asNullableText(formData, "phone");
  const role = normalizeStaffRole(asText(formData, "role"));
  const isActive = asText(formData, "is_active") !== "false";
  const sendInvite = asText(formData, "send_invite") !== "false";

  if (!email || !role) {
    finish(route, "error", "Email and role are required for staff setup.");
  }

  let user = await findAuthUserByEmail(email);
  let createdNew = false;
  let provisioningSource: "fresh_insert" | "recycled_slot" | "existing_user" = "existing_user";
  let existingProfileRole: string | null = null;
  let provisioningFailureReason: string | null = null;
  let provisioningFailureCode: string | null = null;
  let provisioningFailureDetail: string | null = null;
  let provisioningFailureConstraint: string | null = null;
  let recycledSlotSource: ReusableProvisioningSlot["source"] | null = null;

  if (user) {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    existingProfileRole = existingProfile?.role ?? null;

    const currentRole = resolveLiveStaffRole({
      profileRole: existingProfileRole,
      appRole: (user as any)?.app_metadata?.role ?? null,
      userRole: (user as any)?.user_metadata?.role ?? null,
    });

    if (currentRole === "owner" && role !== "owner") {
      const ownerCount = await countOwners();
      if (ownerCount <= 1) {
        finish(
          route,
          "error",
          "This is the last owner account. Assign another owner before removing owner access here."
        );
      }
    }

    const updateResult = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata ?? {}),
        full_name: fullName,
        phone,
        role,
        is_frozen: !isActive,
      },
      app_metadata: {
        ...(user.app_metadata ?? {}),
        role,
        is_frozen: !isActive,
      },
    });

    if (updateResult.error) {
      finish(route, "error", `Staff update failed: ${updateResult.error.message || "Unknown error"}`);
    }

    user = updateResult.data.user ?? user;
  } else {
    const createResult = await createAuthUserWithDiagnostics({
      email,
      fullName,
      phone,
      role,
      isActive,
    });

    if (createResult.error || !createResult.user) {
      provisioningFailureReason = summarizeProvisioningFailure(createResult.error);
      provisioningFailureCode = createResult.error?.code ?? null;
      provisioningFailureDetail = createResult.error?.detail ?? null;
      provisioningFailureConstraint = createResult.error?.constraint ?? null;

      await writeSecurityLog({
        event_type: "staff_create_primary_insert_blocked",
        route,
        actor_user_id: auth.profile.id,
        actor_role: auth.profile.role,
        email: auth.user?.email ?? null,
        success: false,
        details: {
          target_email: email,
          requested_role: role,
          is_active: isActive,
          reason: provisioningFailureReason,
          code: provisioningFailureCode,
          detail: provisioningFailureDetail,
          constraint: provisioningFailureConstraint,
          status: createResult.error?.status ?? null,
        },
      });

      if (isSupabaseAuthProvisioningError(createResult.error)) {
        await sendProfileSyncAlert({
          heading: "Staff auth provisioning is blocked",
          summary:
            "Owner staff provisioning attempted to create a new auth user, but the live auth mirror rejected the insert before the account could exist.",
          lines: [
            `Staff email: ${email}`,
            `Requested role: ${role}`,
            `Failure: ${provisioningFailureReason}`,
            ...(provisioningFailureConstraint ? [`Constraint: ${provisioningFailureConstraint}`] : []),
          ],
        });
      }

      let recycledUser: any | null = null;
      if (isProfilesRoleConstraintBlock(createResult.error)) {
        const candidate = await findReusableProvisioningSlot();

        if (candidate) {
          const recycleResult = await recycleProvisioningSlotIntoStaff({
            candidate,
            email,
            fullName,
            phone,
            role,
            isActive,
          });

          if (!recycleResult.error && recycleResult.user) {
            recycledUser = recycleResult.user;
            recycledSlotSource = candidate.source;
          } else {
            provisioningFailureReason = recycleResult.error?.message || provisioningFailureReason;
          }
        }
      }

      if (!recycledUser) {
        await writeSecurityLog({
          event_type: "staff_create_failed",
          route,
          actor_user_id: auth.profile.id,
          actor_role: auth.profile.role,
          email: auth.user?.email ?? null,
          success: false,
          details: {
            target_email: email,
            requested_role: role,
            is_active: isActive,
            reason: provisioningFailureReason,
            code: provisioningFailureCode,
            detail: provisioningFailureDetail,
            constraint: provisioningFailureConstraint,
          },
        });

        finish(
          route,
          "error",
          isProfilesRoleConstraintBlock(createResult.error)
            ? "Fresh auth inserts are currently blocked because the live profile mirror still defaults new users to customer, while the database rejects customer through profiles_role_check. Existing staff can still be managed and setup emails still send, but a new dormant slot is needed until the database rule is repaired."
            : isSupabaseAuthProvisioningError(createResult.error)
              ? "Supabase Auth rejected the new staff account before it could be created. Existing staff can still be managed, but new user provisioning is blocked until the auth insert issue is repaired."
              : `Staff creation failed: ${provisioningFailureReason}`
        );
      }

      user = recycledUser;
      createdNew = true;
      provisioningSource = "recycled_slot";
    } else {
      user = createResult.user;
      createdNew = true;
      provisioningSource = "fresh_insert";
    }
  }

  if (!user?.id) {
    finish(route, "error", "Staff account could not be provisioned.");
  }

  const forceReauthAt = new Date().toISOString();
  const syncResult = await syncStaffIdentity(user.id, {
    user,
    role,
    full_name: fullName,
    phone,
    is_frozen: !isActive,
    force_reauth_after: forceReauthAt,
    deleted_at: null,
  });

  let inviteStatus: string | null = null;
  let inviteDispatch: Awaited<ReturnType<typeof sendStaffInvitationEmail>> | null = null;
  let inviteLinkError: string | null = null;
  let inviteAccessUrl: string | null = null;
  let inviteTokenHash: string | null = null;
  let inviteState: "ok" | "warn" | "error" = "ok";

  if (sendInvite && user.email) {
    const inviteOutcome = await dispatchStaffSetupEmail({
      email: user.email,
      staffName: normalizeDisplayName(fullName || (user.user_metadata as any)?.full_name || user.email),
      role,
      invitedBy: auth.profile.full_name ?? auth.user.email ?? null,
    });

    inviteDispatch = inviteOutcome.delivery;
    inviteLinkError = inviteOutcome.linkError;
    inviteAccessUrl = inviteOutcome.accessUrl;
    inviteTokenHash = inviteOutcome.tokenHash;
    inviteState = inviteOutcome.state;
    inviteStatus = inviteOutcome.message;
  }

  if (syncResult.profile_write_error || syncResult.auth_meta_error) {
    await sendProfileSyncAlert({
      heading: "Staff identity mirror needs attention",
      summary: "A staff account changed, but part of the profile mirror or auth metadata flow reported an issue.",
      lines: [
        `Staff email: ${email}`,
        `Role: ${role}`,
        `Profile write issue: ${syncResult.profile_write_error?.message || "none"}`,
        `Auth metadata issue: ${syncResult.auth_meta_error?.message || "none"}`,
      ],
    });
  }

  await writeSecurityLog({
    event_type: createdNew ? "staff_created" : "staff_updated_from_owner_directory",
    route,
    user_id: user.id,
    role,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    email: auth.user?.email ?? null,
    success: !syncResult.error,
    details: {
      target_email: email,
      created_new: createdNew,
      is_active: isActive,
      invite_requested: sendInvite,
      invite_status: inviteStatus,
      invite_state: inviteState,
      invite_reason: inviteDispatch?.reason ?? inviteLinkError,
      invite_notification_id: inviteDispatch?.notificationId ?? null,
      invite_message_id: inviteDispatch?.messageId ?? null,
      invite_link_ready: Boolean(inviteAccessUrl),
      invite_token_hash_preview: inviteTokenHash ? inviteTokenHash.slice(0, 12) : null,
      provisioning_source: provisioningSource,
      recycled_slot_source: recycledSlotSource,
      primary_insert_block_reason: provisioningFailureReason,
      primary_insert_block_code: provisioningFailureCode,
      primary_insert_constraint: provisioningFailureConstraint,
      profile_auto_created: syncResult.created,
      profile_write_error: syncResult.profile_write_error?.message || null,
      auth_meta_error: syncResult.auth_meta_error?.message || null,
      error: syncResult.error?.message || null,
    },
  });

  revalidateRoleAccessCore();

  finish(
    route,
    syncResult.error ? "error" : inviteState,
    syncResult.error
      ? `Staff setup failed: ${syncResult.error.message || "Unknown error"}`
      : createdNew
      ? provisioningSource === "recycled_slot"
        ? `Staff account created as ${role} by reactivating a retired access slot. ${inviteStatus || "Setup email was not requested."}`
        : `Staff account created as ${role}. ${inviteStatus || "Setup email was not requested."}`
      : `Staff account updated to ${role}. ${inviteStatus || "Access routing was refreshed."}`
  );
}

export async function resendStaffSetupAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/owner/staff");
  const auth = await requireOwner(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const id = asText(formData, "id");
  if (!id) finish(route, "error", "Missing staff user id.");

  const supabase = getAdminSupabase();
  const { data: userResult, error } = await supabase.auth.admin.getUserById(id);
  const user = userResult?.user;

  if (error || !user?.email) {
    finish(route, "error", "Staff account could not be resolved for setup delivery.");
  }

  const role = resolveLiveStaffRole({
    appRole: (user as any)?.app_metadata?.role ?? null,
    userRole: (user as any)?.user_metadata?.role ?? null,
  });
  const archivedAt =
    String((user as any)?.app_metadata?.deleted_at || (user as any)?.user_metadata?.deleted_at || "").trim() ||
    null;

  if (archivedAt) {
    finish(route, "warn", "Restore this account before sending a fresh setup email.");
  }

  const inviteOutcome = await dispatchStaffSetupEmail({
    email: user.email,
    staffName: normalizeDisplayName((user.user_metadata as any)?.full_name || user.email),
    role,
    invitedBy: auth.profile.full_name ?? auth.user.email ?? null,
  });
  const inviteResult = inviteOutcome.delivery;

  await writeSecurityLog({
    event_type: "staff_setup_email_resent",
    route,
    user_id: user.id,
    role,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    email: auth.user?.email ?? null,
    success: inviteResult ? inviteResult.status !== "failed" : false,
    details: {
      target_email: user.email,
      notification_status: inviteResult?.status ?? "failed",
      notification_reason: inviteResult?.reason ?? inviteOutcome.linkError,
      notification_id: inviteResult?.notificationId ?? null,
      message_id: inviteResult?.messageId ?? null,
      link_error: inviteOutcome.linkError,
      token_hash_preview: inviteOutcome.tokenHash ? inviteOutcome.tokenHash.slice(0, 12) : null,
    },
  });

  revalidateRoleAccessCore();

  finish(
    route,
    inviteOutcome.state,
    inviteOutcome.message
  );
}

export async function repairStaffIdentityAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/owner/staff");
  const auth = await requireOwner(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const id = asText(formData, "id");
  if (!id) finish(route, "error", "Missing staff user id.");

  const supabase = getAdminSupabase();
  const { data: userResult, error } = await supabase.auth.admin.getUserById(id);
  const user = userResult?.user ?? null;

  if (error || !user) {
    await writeSecurityLog({
      event_type: "staff_identity_repair_failed",
      route,
      actor_user_id: auth.profile.id,
      actor_role: auth.profile.role,
      email: auth.user?.email ?? null,
      success: false,
      details: {
        target_user_id: id,
        reason: error?.message || "Auth user could not be resolved.",
      },
    });

    finish(
      route,
      "error",
      "The auth account could not be resolved for repair. Restore or recreate the auth user before retrying."
    );
  }

  const repairResult = await syncStaffIdentity(id, { user });

  await writeSecurityLog({
    event_type: "staff_identity_repaired",
    route,
    user_id: id,
    role: repairResult.profile.role,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    email: auth.user?.email ?? null,
    success: !repairResult.error,
    details: {
      target_email: user.email ?? null,
      created_profile: repairResult.created,
      profile_write_error: repairResult.profile_write_error?.message || null,
      auth_meta_error: repairResult.auth_meta_error?.message || null,
      auth_role_aligned: repairResult.auth_role_aligned,
      deleted_at: repairResult.deleted_at,
      error: repairResult.error?.message || null,
    },
  });

  revalidateRoleAccessCore();

  finish(
    route,
    repairResult.error ? "error" : "ok",
    repairResult.error
      ? `Access repair failed: ${repairResult.error.message || "Unknown error"}`
      : "Staff access record was repaired and rechecked against the live auth account."
  );
}

export async function deleteStaffAccountAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/owner/staff");
  const auth = await requireOwner(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const id = asText(formData, "id");
  if (!id) finish(route, "error", "Missing staff user id.");
  if (id === auth.profile.id) {
    finish(route, "error", "You cannot permanently delete your own owner account from here.");
  }

  const supabase = getAdminSupabase();
  const [{ data: profile }, userResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, role, deleted_at, full_name")
      .eq("id", id)
      .maybeSingle(),
    supabase.auth.admin.getUserById(id),
  ]);

  const user = userResult.data?.user ?? null;
  if (!profile?.id && !user?.id) {
    finish(route, "error", "The staff record could not be found for deletion.");
  }

  const currentRole = resolveLiveStaffRole({
    profileRole: profile?.role ?? null,
    appRole: (user as any)?.app_metadata?.role ?? null,
    userRole: (user as any)?.user_metadata?.role ?? null,
  });

  if (currentRole === "owner") {
    const ownerCount = await countOwners();
    if (ownerCount <= 1) {
      finish(route, "error", "Assign another owner before permanently deleting this owner account.");
    }
  }

  const archived =
    Boolean(profile?.deleted_at) ||
    Boolean(
      String((user as any)?.app_metadata?.deleted_at || (user as any)?.user_metadata?.deleted_at || "").trim()
    );

  if (!archived) {
    finish(route, "warn", "Archive this account first so historical actions stay protected before deletion.");
  }

  const references = await getStaffReferenceSummary(id);
  let authDeleteError: { message?: string } | null = null;
  let profileDeleteError: { message?: string } | null = null;
  let profileDeleted = false;
  let recycledToProvisioningSlot = false;
  let recycledSlotEmail: string | null = null;

  if (user?.id) {
    const existingUser = user;

    if (!references.hasHistory) {
      const deletedAt =
        String((existingUser as any)?.app_metadata?.deleted_at || (existingUser as any)?.user_metadata?.deleted_at || "").trim() ||
        new Date().toISOString();
      const retireResult = await retireStaffAccountIntoProvisioningSlot({
        user: existingUser,
        deletedAt,
      });

      authDeleteError = retireResult.error ?? null;
      recycledToProvisioningSlot = !retireResult.error;
      recycledSlotEmail = retireResult.slotEmail;

      if (!retireResult.error && retireResult.user) {
        await syncStaffIdentity(existingUser.id, {
          user: retireResult.user,
          role: "staff",
          full_name: null,
          phone: null,
          is_frozen: false,
          force_reauth_after: null,
          deleted_at: deletedAt,
        });
      }
    } else {
      const deleteResult = await supabase.auth.admin.deleteUser(existingUser.id);
      authDeleteError = deleteResult.error ?? null;
    }
  }

  if (profile?.id && !references.hasHistory && !authDeleteError && !recycledToProvisioningSlot) {
    const deleteProfileResult = await supabase.from("profiles").delete().eq("id", id);
    profileDeleteError = deleteProfileResult.error ?? null;
    profileDeleted = !deleteProfileResult.error;
  }

  const success = !authDeleteError && !profileDeleteError;

  await writeSecurityLog({
    event_type: "staff_deleted",
    route,
    user_id: id,
    role: currentRole,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    email: auth.user?.email ?? null,
    success,
    details: {
      target_user_id: id,
      target_email: user?.email ?? null,
      target_name: profile?.full_name ?? (user?.user_metadata as any)?.full_name ?? null,
      auth_deleted: Boolean(user?.id) && !authDeleteError && !recycledToProvisioningSlot,
      recycled_to_provisioning_slot: recycledToProvisioningSlot,
      recycled_slot_email: recycledSlotEmail,
      profile_deleted: profileDeleted,
      profile_preserved_for_history: Boolean(profile?.id) && references.hasHistory,
      reference_count: references.total,
      auth_error: authDeleteError?.message || null,
      profile_error: profileDeleteError?.message || null,
    },
  });

  revalidateRoleAccessCore();

  if (authDeleteError || profileDeleteError) {
    finish(
      route,
      "error",
      `Permanent delete failed: ${authDeleteError?.message || profileDeleteError?.message || "Unknown error"}`
    );
  }

  if (recycledToProvisioningSlot) {
    finish(
      route,
      "ok",
      "Active sign-in access was retired and the account has been removed from the staff directory."
    );
  }

  if (references.hasHistory) {
    finish(
      route,
      "warn",
      "Sign-in access was permanently removed. The archived profile record was preserved because historical activity still references this staff member."
    );
  }

  finish(route, "ok", "The archived staff account was permanently deleted.");
}

async function writePricingProposalLog(input: {
  eventType: string;
  route: string;
  auth: ActionAuth;
  proposalId: string;
  payload: PricingProposalPayload;
  note?: string | null;
  decisionNote?: string | null;
  publishedPricingId?: string | null;
  success?: boolean;
}) {
  await writeSecurityLog({
    event_type: input.eventType,
    route: input.route,
    actor_user_id: input.auth.profile.id,
    actor_role: input.auth.profile.role,
    email: input.auth.user?.email ?? null,
    success: input.success ?? true,
    details: {
      proposal_id: input.proposalId,
      actor_name: input.auth.profile.full_name ?? input.auth.user?.email ?? null,
      note: input.note ?? null,
      decision_note: input.decisionNote ?? null,
      published_pricing_id: input.publishedPricingId ?? null,
      payload: {
        pricing_id: input.payload.pricingId,
        category: input.payload.category,
        item_name: input.payload.itemName,
        description: input.payload.description,
        unit: input.payload.unit,
        price: input.payload.price,
        sort_order: input.payload.sortOrder,
        is_featured: input.payload.isFeatured,
        is_active: input.payload.isActive,
      },
    },
  });
}

export async function savePricingProposalAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/manager/pricing");
  const auth = await requireOwnerOrManager(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const payload = createPricingProposalPayload(formData);
  const proposalId = asText(formData, "proposal_id") || randomUUID();
  const intent = asText(formData, "proposal_intent").toLowerCase() === "submitted" ? "submitted" : "draft";
  const note = asNullableText(formData, "note");

  if (!payload.category || !payload.itemName) {
    finish(route, "error", "Category and item name are required before the proposal can be saved.");
  }

  await writePricingProposalLog({
    eventType: intent === "submitted" ? "pricing_proposal_submitted" : "pricing_proposal_saved",
    route,
    auth,
    proposalId,
    payload,
    note,
  });

  revalidateOwnerCore();
  revalidateManagerCore();

  finish(
    route,
    "ok",
    intent === "submitted"
      ? "Pricing proposal submitted for owner approval."
      : "Pricing draft saved. It can be refined or submitted for approval later."
  );
}

export async function submitPricingProposalAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/manager/pricing");
  const auth = await requireOwnerOrManager(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const proposalId = asText(formData, "proposal_id");
  if (!proposalId) finish(route, "error", "Missing proposal reference.");

  const proposal = await getPricingProposalById(proposalId);
  if (!proposal) {
    finish(route, "error", "The pricing proposal could not be found.");
  }

  await writePricingProposalLog({
    eventType: "pricing_proposal_submitted",
    route,
    auth,
    proposalId: proposal.proposalId,
    payload: proposal.payload,
    note: asNullableText(formData, "note") || proposal.decisionNote,
  });

  revalidateOwnerCore();
  revalidateManagerCore();

  finish(route, "ok", "Pricing proposal submitted for owner approval.");
}

export async function reviewPricingProposalAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/owner/pricing");
  const auth = await requireOwner(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const supabase = getAdminSupabase();
  const proposalId = asText(formData, "proposal_id");
  const decision = asText(formData, "decision").toLowerCase();
  const decisionNote = asNullableText(formData, "decision_note");

  if (!proposalId) finish(route, "error", "Missing pricing proposal id.");
  if (!["approved", "rejected", "superseded"].includes(decision)) {
    finish(route, "error", "Invalid proposal decision.");
  }

  const proposal = await getPricingProposalById(proposalId);
  if (!proposal) {
    finish(route, "error", "The pricing proposal could not be found.");
  }

  let publishedPricingId: string | null = null;

  if (decision === "approved") {
    const payload = {
      category: proposal.payload.category,
      item_name: proposal.payload.itemName,
      description: proposal.payload.description,
      unit: proposal.payload.unit,
      price: proposal.payload.price,
      sort_order: proposal.payload.sortOrder,
      is_featured: proposal.payload.isFeatured,
      is_active: proposal.payload.isActive,
    };

    if (proposal.payload.pricingId) {
      const { error } = await supabase.from("care_pricing").update(payload).eq("id", proposal.payload.pricingId);
      if (error) {
        finish(route, "error", `Publishing pricing failed: ${error.message || "Unknown error"}`);
      }
      publishedPricingId = proposal.payload.pricingId;
    } else {
      const { data, error } = await supabase
        .from("care_pricing")
        .insert(payload)
        .select("id")
        .maybeSingle();

      if (error || !data?.id) {
        finish(route, "error", `Publishing pricing failed: ${error?.message || "Unknown error"}`);
      }

      publishedPricingId = String(data.id);
    }
  }

  await writePricingProposalLog({
    eventType: `pricing_proposal_${decision}`,
    route,
    auth,
    proposalId: proposal.proposalId,
    payload: proposal.payload,
    decisionNote,
    publishedPricingId,
  });

  revalidateOwnerCore();
  revalidateManagerCore();
  revalidatePublicCore();

  finish(
    route,
    "ok",
    decision === "approved"
      ? "Pricing proposal approved and published."
      : decision === "rejected"
        ? "Pricing proposal rejected."
        : "Pricing proposal marked as superseded."
  );
}

export async function savePricingAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/owner/pricing");
  const auth = await requireOwner(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const supabase = getAdminSupabase();

  const id = asText(formData, "id");
  const category = asText(formData, "category");
  const item_name = asText(formData, "item_name");
  const description = asNullableText(formData, "description");
  const unit = asText(formData, "unit") || "item";
  const price = Math.max(0, asNumber(formData, "price"));
  const sort_order = asNumber(formData, "sort_order");
  const is_featured = asBool(formData, "is_featured");
  const is_active = asBool(formData, "is_active");

  if (!category || !item_name) {
    finish(route, "error", "Category and item name are required.");
  }

  const payload = {
    category,
    item_name,
    description,
    unit,
    price,
    sort_order,
    is_featured,
    is_active,
  };

  const query = id
    ? supabase.from("care_pricing").update(payload).eq("id", id)
    : supabase.from("care_pricing").insert(payload);

  const { error } = await query;

  await writeSecurityLog({
    event_type: id ? "pricing_updated" : "pricing_created",
    route,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    email: auth.user?.email ?? null,
    success: !error,
    details: {
      pricing_id: id || null,
      category,
      item_name,
      price,
      is_featured,
      is_active,
      error: error?.message || null,
    },
  });

  revalidateOwnerCore();
  revalidatePublicCore();

  finish(
    route,
    error ? "error" : "ok",
    error ? `Pricing save failed: ${error.message || "Unknown error"}` : "Pricing saved."
  );
}

export async function deletePricingAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/owner/pricing");
  const auth = await requireOwner(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const supabase = getAdminSupabase();
  const id = asText(formData, "id");
  if (!id) finish(route, "error", "Missing pricing id.");

  const { error } = await supabase.from("care_pricing").delete().eq("id", id);

  await writeSecurityLog({
    event_type: "pricing_deleted",
    route,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    email: auth.user?.email ?? null,
    success: !error,
    details: { pricing_id: id, error: error?.message || null },
  });

  revalidateOwnerCore();
  revalidatePublicCore();

  finish(
    route,
    error ? "error" : "ok",
    error ? `Pricing delete failed: ${error.message || "Unknown error"}` : "Pricing deleted."
  );
}

export async function saveSettingsAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/owner/settings");
  const auth = await requireOwner(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const supabase = getAdminSupabase();

  const basePayload = {
    hero_badge: asText(formData, "hero_badge"),
    hero_title: asText(formData, "hero_title"),
    hero_subtitle: asText(formData, "hero_subtitle"),
    about_title: asText(formData, "about_title"),
    about_body: asText(formData, "about_body"),
    pickup_hours: asNullableText(formData, "pickup_hours"),
    pricing_note: asNullableText(formData, "pricing_note"),
    support_email: asNullableText(formData, "support_email"),
    support_phone: asNullableText(formData, "support_phone"),
    logo_url: asNullableText(formData, "logo_url"),
    favicon_url: asNullableText(formData, "favicon_url"),
    hero_image_url: asNullableText(formData, "hero_image_url"),
    promo_video_url: asNullableText(formData, "promo_video_url"),
    promo_video_title: asNullableText(formData, "promo_video_title"),
    promo_video_body: asNullableText(formData, "promo_video_body"),
  };

  const optionalPayload: Record<(typeof OPTIONAL_SETTINGS_FIELDS)[number], string | null> = {
    public_site_url: asNullableText(formData, "public_site_url"),
    care_domain: asNullableText(formData, "care_domain"),
    hub_domain: asNullableText(formData, "hub_domain"),
    company_account_name: asNullableText(formData, "company_account_name"),
    company_account_number: asNullableText(formData, "company_account_number"),
    company_bank_name: asNullableText(formData, "company_bank_name"),
    payment_currency: asNullableText(formData, "payment_currency"),
    payment_instructions: asNullableText(formData, "payment_instructions"),
    payment_whatsapp: asNullableText(formData, "payment_whatsapp"),
    payment_support_email: asNullableText(formData, "payment_support_email"),
    payment_support_whatsapp: asNullableText(formData, "payment_support_whatsapp"),
    notification_sender_name: asNullableText(formData, "notification_sender_name"),
    notification_reply_to_email: asNullableText(formData, "notification_reply_to_email"),
    picked_up_email_subject: asNullableText(formData, "picked_up_email_subject"),
    picked_up_email_body: asNullableText(formData, "picked_up_email_body"),
  };

  const settingsId = await ensureSettingsRow(basePayload);

  if (!settingsId) {
    await writeSecurityLog({
      event_type: "settings_update_failed",
      route,
      actor_user_id: auth.profile.id,
      actor_role: auth.profile.role,
      email: auth.user?.email ?? null,
      success: false,
      details: {
        reason: "Unable to create or resolve care_settings row.",
      },
    });

    finish(route, "error", "Settings row could not be created.");
  }

  const baseResult = await supabase
    .from("care_settings")
    .update(basePayload as any)
    .eq("id", settingsId);

  const optionalResults = await Promise.all(
    OPTIONAL_SETTINGS_FIELDS.map((field) =>
      tryUpdateOptionalSetting(settingsId, field, optionalPayload[field])
    )
  );

  const unsupportedFields = optionalResults
    .filter((item) => item.error)
    .map((item) => ({
      field: item.field,
      error: item.error?.message || "Unknown error",
    }));

  const failed = Boolean(baseResult.error);

  await writeSecurityLog({
    event_type: "settings_updated",
    route,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    email: auth.user?.email ?? null,
    success: !failed,
    details: {
      settings_id: settingsId,
      base_error: baseResult.error?.message || null,
      unsupported_optional_fields: unsupportedFields,
      updated_base_fields: Object.keys(basePayload),
      attempted_optional_fields: OPTIONAL_SETTINGS_FIELDS,
    },
  });

  revalidateOwnerCore();
  revalidatePublicCore();

  if (baseResult.error) {
    finish(route, "error", `Settings save failed: ${baseResult.error.message || "Unknown error"}`);
  }

  if (unsupportedFields.length > 0) {
    finish(
      route,
      "ok",
      "Core settings saved. Some newer optional fields were skipped because the current database schema does not support them yet."
    );
  }

  finish(route, "ok", "Settings saved.");
}

export async function setReviewApprovalAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/owner/reviews");
  const auth = await requireOwner(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const supabase = getAdminSupabase();
  const id = asText(formData, "id");
  const approved = asText(formData, "approved") === "true";

  if (!id) finish(route, "error", "Missing review id.");

  const { error } = await supabase
    .from("care_reviews")
    .update({ is_approved: approved })
    .eq("id", id);

  await writeSecurityLog({
    event_type: approved ? "review_approved" : "review_unapproved",
    route,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    email: auth.user?.email ?? null,
    success: !error,
    details: { review_id: id, approved, error: error?.message || null },
  });

  revalidateOwnerCore();
  revalidatePublicCore();

  finish(
    route,
    error ? "error" : "ok",
    error
      ? `Review update failed: ${error.message || "Unknown error"}`
      : approved
      ? "Review approved."
      : "Review hidden."
  );
}

export async function approveReviewAction(formData: FormData) {
  const patched = new FormData();
  patched.set("id", asText(formData, "id"));
  patched.set("approved", "true");
  patched.set("source_route", asText(formData, "source_route") || "/owner/reviews");
  patched.set("actor_user_id", asText(formData, "actor_user_id"));
  patched.set("actor_role", asText(formData, "actor_role"));
  patched.set("actor_ts", asText(formData, "actor_ts"));
  patched.set("actor_sig", asText(formData, "actor_sig"));
  await setReviewApprovalAction(patched);
}

export async function unapproveReviewAction(formData: FormData) {
  const patched = new FormData();
  patched.set("id", asText(formData, "id"));
  patched.set("approved", "false");
  patched.set("source_route", asText(formData, "source_route") || "/owner/reviews");
  patched.set("actor_user_id", asText(formData, "actor_user_id"));
  patched.set("actor_role", asText(formData, "actor_role"));
  patched.set("actor_ts", asText(formData, "actor_ts"));
  patched.set("actor_sig", asText(formData, "actor_sig"));
  await setReviewApprovalAction(patched);
}

export async function deleteReviewAction(formData: FormData) {
  const route = normalizeRoute(asText(formData, "source_route"), "/owner/reviews");
  const auth = await requireOwner(formData);
  if (!auth) finish(route, "error", "Not authenticated.");

  const supabase = getAdminSupabase();
  const id = asText(formData, "id");
  if (!id) finish(route, "error", "Missing review id.");

  const { error } = await supabase.from("care_reviews").delete().eq("id", id);

  await writeSecurityLog({
    event_type: "review_deleted",
    route,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    email: auth.user?.email ?? null,
    success: !error,
    details: { review_id: id, error: error?.message || null },
  });

  revalidateOwnerCore();
  revalidatePublicCore();

  finish(
    route,
    error ? "error" : "ok",
    error ? `Review delete failed: ${error.message || "Unknown error"}` : "Review deleted."
  );
}
