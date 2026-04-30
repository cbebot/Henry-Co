import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import {
  buildSharedCookieHandlers,
  buildSupabaseCookieOptions,
  getAccountUrl,
  getSharedCookieDomain,
  normalizeEmail,
  normalizeTrustedRedirect,
  resolveRequestCookieDomain,
} from "@henryco/config";

/**
 * Resend the email-confirmation link for a signup that hasn't been confirmed yet.
 *
 * This is a public endpoint — Supabase enforces its own rate limit per email,
 * and we keep the response shape neutral so we don't leak whether an account
 * exists. Always responds 200 with `{ ok: true }` on legitimate input even
 * if the underlying Supabase call rate-limits or finds no unconfirmed user.
 */
export async function POST(request: Request) {
  let body: { email?: unknown; next?: unknown } = {};
  try {
    body = (await request.json()) as { email?: unknown; next?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = normalizeEmail(typeof body.email === "string" ? body.email : null);
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const safeNext = normalizeTrustedRedirect(typeof body.next === "string" ? body.next : null);
  const callback = getAccountUrl("/auth/callback");
  const emailRedirectTo = safeNext === "/" ? callback : `${callback}?next=${encodeURIComponent(safeNext)}`;

  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieDomain =
    resolveRequestCookieDomain((name) => headerStore.get(name)) ||
    getSharedCookieDomain(new URL(request.url).hostname);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: buildSupabaseCookieOptions(cookieDomain),
      cookies: buildSharedCookieHandlers(cookieStore, cookieDomain),
    },
  );

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo },
  });

  // Treat Supabase-side rate limits and "user not found / already confirmed"
  // as success from the caller's perspective so we don't leak account existence.
  if (error) {
    const message = String(error.message || "").toLowerCase();
    if (message.includes("rate") || message.includes("already") || message.includes("not found")) {
      return NextResponse.json({ ok: true, throttled: message.includes("rate") });
    }
    return NextResponse.json({ error: "Could not resend verification email." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
