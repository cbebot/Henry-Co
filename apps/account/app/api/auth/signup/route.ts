import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  buildSharedCookieHandlers,
  buildSupabaseCookieOptions,
  getAccountUrl,
  getSharedCookieDomain,
  normalizeEmail,
  normalizeTrustedRedirect,
  resolveRequestCookieDomain,
} from "@henryco/config";
import { checkSignupRate, extractClientIp } from "@/lib/auth/signup-rate-limit";

/**
 * Server-side wrapper for Supabase signUp.
 *
 * Adds an IP-keyed rate limit (5 attempts / 30s) on top of Supabase's
 * own per-email throttling. The endpoint is deliberately neutral: it
 * accepts the same payload the previous client-side flow built and
 * returns a small, stable error vocabulary so the client never has to
 * surface raw provider messages.
 */

type Body = {
  email?: unknown;
  password?: unknown;
  fullName?: unknown;
  country?: unknown;
  phone?: unknown;
  contactPreference?: unknown;
  currency?: unknown;
  timezone?: unknown;
  next?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const ip = extractClientIp(request.headers);
  const rateCheck = checkSignupRate(ip || "");
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message: "Too many signup attempts from this network. Try again in a moment.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateCheck.retryAfterSeconds) },
      },
    );
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: "invalid_request", message: "Invalid request body." },
      { status: 400 },
    );
  }

  const email = normalizeEmail(asString(body.email));
  const password = asString(body.password);
  const fullName = asString(body.fullName).trim();

  if (!email) {
    return NextResponse.json(
      { error: "missing_email", message: "Email is required." },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "weak_password", message: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }
  if (!fullName) {
    return NextResponse.json(
      { error: "missing_full_name", message: "Full name is required." },
      { status: 400 },
    );
  }

  const safeNext = normalizeTrustedRedirect(asString(body.next) || null);
  const callback = getAccountUrl("/auth/callback");
  const emailRedirectTo = safeNext === "/" ? callback : `${callback}?next=${encodeURIComponent(safeNext)}`;

  const cookieStore = await cookies();
  const cookieDomain =
    resolveRequestCookieDomain((name) => request.headers.get(name)) ||
    getSharedCookieDomain(new URL(request.url).hostname);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: buildSupabaseCookieOptions(cookieDomain),
      cookies: buildSharedCookieHandlers(cookieStore, cookieDomain),
    },
  );

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        full_name: fullName,
        country: asString(body.country) || "NG",
        phone: asString(body.phone) || null,
        contact_preference: asString(body.contactPreference) || "email",
        currency: asString(body.currency) || "NGN",
        timezone: asString(body.timezone) || "Africa/Lagos",
      },
    },
  });

  if (error) {
    console.error("[auth/signup] supabase.auth.signUp failed", {
      ip,
      message: error.message,
      status: error.status ?? null,
    });

    // Map provider errors to a small stable vocabulary the client can
    // localize. Anything we can't classify becomes a generic failure —
    // we never echo the raw provider message back to the user.
    const lower = String(error.message || "").toLowerCase();
    if (lower.includes("rate") || lower.includes("limit")) {
      return NextResponse.json(
        { error: "rate_limited", message: "Too many signup attempts. Try again shortly." },
        { status: 429 },
      );
    }
    if (lower.includes("already") || lower.includes("registered") || lower.includes("exists")) {
      return NextResponse.json(
        { error: "email_already_registered", message: "That email is already registered." },
        { status: 409 },
      );
    }
    if (lower.includes("password")) {
      return NextResponse.json(
        { error: "weak_password", message: "Choose a stronger password (at least 8 characters)." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "signup_failed", message: "We couldn't create your account. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
