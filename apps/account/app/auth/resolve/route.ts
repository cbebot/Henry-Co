import { NextResponse, after } from "next/server";
import { cookies, headers } from "next/headers";
import {
  getSharedCookieDomain,
  isRecoverableSupabaseAuthError,
  resolveRequestCookieDomain,
  resolveRequestOrigin,
} from "@henryco/config";
import { DASHBOARD_PREFERENCE_COOKIE, resolveUserDashboard } from "@/lib/post-auth-routing";
import { createSupabaseServer } from "@/lib/supabase/server";
import { detectSecurityRequestContext, logSecurityEvent } from "@/lib/security-events";
import {
  HC_DEVICE_COOKIE,
  HC_DEVICE_COOKIE_MAX_AGE,
  generateDeviceId,
  signDeviceId,
  verifyDeviceCookie,
} from "@/lib/security/device-cookie";
import { recordSignInAndMaybeAlert } from "@/lib/security/sign-in-alert";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const headerStore = await headers();
  // Vercel route handlers can resolve `request.url` to the internal
  // deployment host (*.vercel.app). Derive the real public origin from
  // the proxy headers so post-auth redirects stay on account.<baseDomain>
  // — otherwise the session cookie (scoped to .<baseDomain>) is dropped
  // and the dashboard collapses to its signed-out state.
  const origin = resolveRequestOrigin((name) => headerStore.get(name), url.origin);
  const supabase = await createSupabaseServer();
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
    const loginUrl = new URL("/login", origin);
    const next = url.searchParams.get("next");
    if (next) {
      loginUrl.searchParams.set("next", next);
    }
    return NextResponse.redirect(loginUrl);
  }

  const cookieStore = await cookies();

  // Close the password-login blind spot (2026-07-16). Unlike /auth/callback
  // (OAuth / magic-link), THIS router is where password sign-ins land — and it
  // recorded nothing, so the owner threat console was half-blind to the most
  // common sign-in path. Mirror the callback's telemetry here, but ONLY for a
  // genuinely fresh sign-in (last_sign_in_at within 2 minutes) so ordinary
  // navigation to /auth/resolve never fabricates a sign-in event. Best-effort
  // and non-blocking — security telemetry must never break login.
  const authedUser = user;
  const lastSignInMs = authedUser.last_sign_in_at ? Date.parse(authedUser.last_sign_in_at) : NaN;
  const isFreshSignIn = Number.isFinite(lastSignInMs) && Date.now() - lastSignInMs < 2 * 60 * 1000;
  if (isFreshSignIn) {
    try {
      const cookieDomain =
        resolveRequestCookieDomain((name) => headerStore.get(name)) ||
        getSharedCookieDomain(new URL(origin).hostname);
      const context = await detectSecurityRequestContext();
      await logSecurityEvent({
        userId: authedUser.id,
        eventType: "account_sign_in",
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        locationSummary: context.locationSummary,
        metadata: { source: "auth_resolve_password", email: authedUser.email || null },
      });

      // Recognise the device + alert on a new device/location, exactly as the
      // OAuth callback does. Device id lives in a signed httpOnly cookie;
      // detection runs AFTER the response so it adds no latency to the redirect.
      let deviceId = verifyDeviceCookie(cookieStore.get(HC_DEVICE_COOKIE)?.value);
      if (!deviceId) {
        deviceId = generateDeviceId();
        try {
          cookieStore.set(HC_DEVICE_COOKIE, signDeviceId(deviceId), {
            path: "/",
            domain: cookieDomain,
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: HC_DEVICE_COOKIE_MAX_AGE,
          });
        } catch {
          // Signing needs SUPABASE_JWT_SECRET; without it we skip device memory.
        }
      }
      const signInDeviceId = deviceId;
      after(() =>
        recordSignInAndMaybeAlert({
          userId: authedUser.id,
          email: authedUser.email ?? null,
          deviceId: signInDeviceId,
          userAgent: context.userAgent,
          country: context.country,
          locationSummary: context.locationSummary,
          ipAddress: context.ipAddress,
          origin,
          justConfirmed: false,
        }),
      );
    } catch {
      // Telemetry must never block a real sign-in.
    }
  }

  const preferredDashboardKey = cookieStore.get(DASHBOARD_PREFERENCE_COOKIE)?.value || null;

  const resolution = await resolveUserDashboard({
    user,
    next: url.searchParams.get("next"),
    origin,
    preferredDashboardKey,
  });

  return NextResponse.redirect(
    resolution.kind === "redirect" ? resolution.redirectUrl : resolution.chooserUrl
  );
}
