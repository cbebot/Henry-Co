import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { buildStaffLoginUrl, STAFF_RECOVERY_ROUTE } from "@/lib/auth/routes";

function createRouteSupabase(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const tokenHash = String(request.nextUrl.searchParams.get("token_hash") || "").trim();
  const code = String(request.nextUrl.searchParams.get("code") || "").trim();
  const type = String(request.nextUrl.searchParams.get("type") || "recovery").trim().toLowerCase();
  const intent = String(request.nextUrl.searchParams.get("intent") || "recovery").trim().toLowerCase();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.redirect(
      new URL(buildStaffLoginUrl(null, { error: "Supabase auth env is missing." }), request.url)
    );
  }

  const redirectUrl = new URL(STAFF_RECOVERY_ROUTE, request.url);
  const response = NextResponse.redirect(redirectUrl);
  const supabase = createRouteSupabase(request, response);

  let error: { message?: string } | null = null;

  if (tokenHash) {
    const verifyResult = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "recovery" | "invite" | "magiclink" | "signup" | "email_change" | "email",
    });
    error = verifyResult.error;
  } else if (code) {
    const exchangeResult = await supabase.auth.exchangeCodeForSession(code);
    error = exchangeResult.error;
  } else {
    error = { message: "Recovery token is missing." };
  }

  if (error) {
    return NextResponse.redirect(
      new URL(
        buildStaffLoginUrl(null, {
          error: error.message || "Recovery verification failed.",
        }),
        request.url
      )
    );
  }

  const nextUrl = new URL(STAFF_RECOVERY_ROUTE, request.url);
  nextUrl.searchParams.set("mode", "set-password");
  nextUrl.searchParams.set("intent", intent === "invite" ? "invite" : "recovery");
  nextUrl.searchParams.set(
    "message",
    intent === "invite"
      ? "The setup link is active. Create a password to finish staff onboarding."
      : "Recovery verified. Create a new password now."
  );

  response.headers.set("Location", nextUrl.toString());
  return response;
}
