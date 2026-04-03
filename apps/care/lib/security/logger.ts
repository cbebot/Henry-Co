import "server-only";

import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { STAFF_LOGIN_ROUTE } from "@/lib/auth/routes";
import { getAuthenticatedProfile } from "@/lib/auth/server";
import { getOptionalEnv } from "@/lib/env";

type SecurityEventInput = {
  event_type: string;
  route?: string | null;
  success?: boolean;
  email?: string | null;
  user_id?: string | null;
  role?: string | null;
  actor_user_id?: string | null;
  actor_role?: string | null;
  details?: Record<string, unknown>;
};

function getAdminSupabase() {
  const url = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRole = getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRole) {
    return null;
  }

  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
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

export async function logSecurityEvent(input: SecurityEventInput) {
  try {
    const supabase = getAdminSupabase();
    if (!supabase) return;

    const [meta, auth] = await Promise.all([
      getRequestMeta(),
      getAuthenticatedProfile().catch(() => null),
    ]);

    const actorUserId = input.actor_user_id ?? auth?.profile?.id ?? null;
    const actorRole = input.actor_role ?? auth?.profile?.role ?? null;
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
      ip_address: meta.ip_address,
      user_agent: meta.user_agent,
      country: meta.country,
      city: meta.city,
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
    // silent on purpose
  }
}

export async function logProtectedPageAccess(
  route: string,
  details?: Record<string, unknown>
) {
  const auth = await getAuthenticatedProfile().catch(() => null);

  await logSecurityEvent({
    event_type: "protected_page_access",
    route,
    success: Boolean(auth?.profile),
    user_id: auth?.profile?.id ?? null,
    role: auth?.profile?.role ?? null,
    details: details ?? {},
  });
}

export async function logLoginPageView(details?: Record<string, unknown>) {
  await logSecurityEvent({
    event_type: "login_page_view",
    route: STAFF_LOGIN_ROUTE,
    success: true,
    details: details ?? {},
  });
}
