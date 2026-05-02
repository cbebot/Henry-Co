import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAccountUrl, resolveRequestCookieDomain } from "@henryco/config";
import { createSupabaseServer } from "@/lib/supabase/server";
import { detectSecurityRequestContext, logSecurityEvent } from "@/lib/security-events";
import { DASHBOARD_PREFERENCE_COOKIE } from "@/lib/post-auth-routing";
import { USER_FACING_GENERIC, logApiError } from "@/lib/user-facing-error";

/**
 * Clears the dashboard preference cookie on the shared `.henrycogroup.com`
 * domain so a subsequent login lands on the chooser again. The cookie is
 * scoped to the apex so a single response is enough — no per-app
 * tear-down required.
 */
function clearDashboardPreferenceCookie(
  response: NextResponse,
  cookieDomain: string | undefined,
) {
  response.cookies.set({
    name: DASHBOARD_PREFERENCE_COOKIE,
    value: "",
    ...(cookieDomain ? { domain: cookieDomain } : {}),
    path: "/",
    maxAge: 0,
  });
}

export async function POST() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const context = await detectSecurityRequestContext();
    await logSecurityEvent({
      userId: user.id,
      eventType: "account_sign_out",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      locationSummary: context.locationSummary,
      metadata: {
        source: "account_logout_route",
        scope: "global",
      },
    });
  }

  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) {
    logApiError("auth/logout", error);
    return NextResponse.json({ error: USER_FACING_GENERIC }, { status: 500 });
  }

  const headerStore = await headers();
  const cookieDomain = resolveRequestCookieDomain((name) => headerStore.get(name));
  const response = NextResponse.json({ ok: true });
  clearDashboardPreferenceCookie(response, cookieDomain);
  return response;
}

/**
 * GET form-friendly logout used by the role chooser's "Sign out" link
 * (anchor tags can't issue POST without JS). Mirrors the POST flow but
 * returns a 303 to /login so the browser cleanly transitions out of the
 * chooser surface.
 */
export async function GET(request: Request) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const context = await detectSecurityRequestContext();
    await logSecurityEvent({
      userId: user.id,
      eventType: "account_sign_out",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      locationSummary: context.locationSummary,
      metadata: {
        source: "account_logout_route_get",
        scope: "global",
      },
    });
  }

  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) {
    logApiError("auth/logout", error);
  }

  const headerStore = await headers();
  const cookieDomain = resolveRequestCookieDomain((name) => headerStore.get(name));
  const targetUrl = new URL(getAccountUrl("/login"));
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next");
  if (next) targetUrl.searchParams.set("next", next);
  const response = NextResponse.redirect(targetUrl, 303);
  clearDashboardPreferenceCookie(response, cookieDomain);
  return response;
}
