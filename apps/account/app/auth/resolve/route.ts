import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { isRecoverableSupabaseAuthError, resolveRequestOrigin } from "@henryco/config";
import { DASHBOARD_PREFERENCE_COOKIE, resolveUserDashboard } from "@/lib/post-auth-routing";
import { createSupabaseServer } from "@/lib/supabase/server";

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
