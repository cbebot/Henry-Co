import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  buildSharedCookieHandlers,
  buildSupabaseCookieOptions,
  getSharedCookieDomain,
} from "@henryco/config";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const next = searchParams.get("next") || "/";

  if (!tokenHash) {
    return NextResponse.redirect(new URL("/owner", request.url));
  }

  const cookieStore = await cookies();
  const cookieDomain = getSharedCookieDomain(request.nextUrl.hostname);
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: buildSupabaseCookieOptions(cookieDomain),
      cookies: buildSharedCookieHandlers(cookieStore, cookieDomain),
    }
  );

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "magiclink",
  });

  if (error) {
    return NextResponse.redirect(
      new URL("/owner?error=impersonation_failed", request.url)
    );
  }

  return NextResponse.redirect(new URL(next, request.url));
}
