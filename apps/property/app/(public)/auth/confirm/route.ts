import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { EmailOtpType } from "@supabase/supabase-js";
import "@/lib/server-env";
import { getRequiredEnv } from "@/lib/env";

function cleanNext(value: string | null) {
  if (!value || !value.startsWith("/")) return "/account";
  return value;
}

function getAuthCookieName(supabaseUrl: string) {
  return `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = String(url.searchParams.get("token_hash") || "").trim();
  const type = String(url.searchParams.get("type") || "magiclink").trim() as EmailOtpType;
  const nextPath = cleanNext(url.searchParams.get("next"));

  if (!tokenHash) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(nextPath)}&error=missing-token`, request.url),
      { status: 303 }
    );
  }

  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL", "Missing NEXT_PUBLIC_SUPABASE_URL for auth confirm.");
  const anonKey = getRequiredEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY for auth confirm."
  );
  const supabase = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error || !data.session) {
    return NextResponse.redirect(
      new URL(
        `/login?next=${encodeURIComponent(nextPath)}&error=${encodeURIComponent(
          (error?.message || "verify-failed").slice(0, 80)
        )}`,
        request.url
      ),
      { status: 303 }
    );
  }

  const redirect = NextResponse.redirect(new URL(nextPath, request.url), { status: 303 });
  redirect.cookies.set({
    name: getAuthCookieName(supabaseUrl),
    value: `base64-${Buffer.from(JSON.stringify(data.session)).toString("base64url")}`,
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 400,
  });

  return redirect;
}
