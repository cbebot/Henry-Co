import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import {
  getAccountUrl,
  isRecoverableSupabaseAuthError,
  normalizeTrustedRedirect,
  resolveRequestCookieDomain,
} from "@henryco/config";
import {
  DASHBOARD_PREFERENCE_COOKIE,
  loadDashboardOptions,
  resolveUserDashboard,
  type DashboardOption,
} from "@/lib/post-auth-routing";
import { createSupabaseServer } from "@/lib/supabase/server";

const REMEMBER_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days

/**
 * Form-target for the role chooser screen.
 *
 *   - Validates the user is signed in.
 *   - Re-validates the picked option against the live access snapshot
 *     (the form value is a UX hint, not a trust boundary). If the user
 *     submits a key they don't actually have access to (form tampering,
 *     stale cookie, revoked membership), we fall through to the canonical
 *     resolver so they still land somewhere safe.
 *   - Sets the remember-choice cookie on the shared `.henrycogroup.com`
 *     domain so all subdomains can read it on subsequent logins.
 *   - Issues a 303 to the chosen dashboard URL — explicitly using 303 so
 *     the browser converts the POST to a GET on the destination.
 *   - If the user originally arrived with a deep-link `next` that maps to
 *     the picked space (e.g. /finance on staffhq), routes them there
 *     instead of the dashboard root.
 */
export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const pickedKeyRaw = formData?.get("dashboard");
  const remember = formData?.get("remember") === "1";
  const nextRaw = formData?.get("next");

  const supabase = await createSupabaseServer();
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] | null = null;

  try {
    const auth = await supabase.auth.getUser();
    user = auth.data.user;
  } catch (error) {
    if (!isRecoverableSupabaseAuthError(error)) throw error;
  }

  const url = new URL(request.url);
  const next = typeof nextRaw === "string" ? normalizeTrustedRedirect(nextRaw) : "/";

  if (!user) {
    const loginUrl = new URL(getAccountUrl("/login"));
    if (next !== "/") {
      loginUrl.searchParams.set("next", next);
    }
    return NextResponse.redirect(loginUrl, 303);
  }

  const options = await loadDashboardOptions(user);

  const pickedKey = typeof pickedKeyRaw === "string" ? pickedKeyRaw : "";
  const chosen: DashboardOption | undefined = options.find((option) => option.key === pickedKey);

  if (!chosen) {
    const cookieStore = await cookies();
    const preferredDashboardKey = cookieStore.get(DASHBOARD_PREFERENCE_COOKIE)?.value || null;
    const resolution = await resolveUserDashboard({
      user,
      next,
      origin: url.origin,
      preferredDashboardKey,
    });
    return NextResponse.redirect(
      resolution.kind === "redirect" ? resolution.redirectUrl : resolution.chooserUrl,
      303
    );
  }

  // If the user originally tried to deep-link into a specific URL and that
  // URL maps to the same space they just picked, route them there instead
  // of the dashboard root. We do this by asking the canonical resolver
  // with the picked option treated as the remembered preference — the
  // existing `next`-honoring branch then does the right thing for owner
  // and staff deep links and falls back to `chosen.href` for unrelated
  // next targets.
  const deepLinkResolution = await resolveUserDashboard({
    user,
    next,
    origin: url.origin,
    preferredDashboardKey: chosen.key,
  });
  const finalDestination =
    deepLinkResolution.kind === "redirect" ? deepLinkResolution.redirectUrl : chosen.href;

  const response = NextResponse.redirect(finalDestination, 303);

  const headerStore = await headers();
  const cookieDomain = resolveRequestCookieDomain((name) => headerStore.get(name));

  if (remember) {
    response.cookies.set({
      name: DASHBOARD_PREFERENCE_COOKIE,
      value: chosen.key,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
      path: "/",
      httpOnly: false,
      secure: cookieDomain ? true : false,
      sameSite: "lax",
      maxAge: REMEMBER_MAX_AGE_SECONDS,
    });
  } else {
    response.cookies.set({
      name: DASHBOARD_PREFERENCE_COOKIE,
      value: "",
      ...(cookieDomain ? { domain: cookieDomain } : {}),
      path: "/",
      maxAge: 0,
    });
  }

  return response;
}

export async function GET(request: Request) {
  // GET fallback: redirect to the chooser UI so a stray navigation
  // (e.g. a bookmark of the API URL) doesn't 404 — the page itself does
  // the access check and falls through if there's nothing to choose.
  const url = new URL(request.url);
  url.pathname = "/auth/choose";
  return NextResponse.redirect(url);
}
