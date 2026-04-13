import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import {
  buildSharedCookieHandlers,
  buildSupabaseCookieOptions,
  getSharedCookieDomain,
  normalizeEmail,
  normalizePhone,
  normalizeTrustedRedirect,
  resolveRequestCookieDomain,
} from "@henryco/config";
import { ensureAccountProfileRecords } from "@/lib/account-profile";
import { scheduleLinkedCareBookingsSync } from "@/lib/care-sync";
import { resolveAuthenticatedDestination } from "@/lib/post-auth-routing";
import { recordReferralConversion } from "@/lib/referral-data";
import { detectSecurityRequestContext, logSecurityEvent } from "@/lib/security-events";

const REFERRAL_COOKIE_NAME = "hc_ref";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const cookieDomain =
      resolveRequestCookieDomain((name) => headerStore.get(name)) ||
      getSharedCookieDomain(new URL(origin).hostname);
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: buildSupabaseCookieOptions(cookieDomain),
        cookies: buildSharedCookieHandlers(cookieStore, cookieDomain),
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await ensureAccountProfileRecords(user);
        const fullName =
          (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
          (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null) ||
          null;
        const phone =
          normalizePhone(
            typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : null
          ) || null;
        scheduleLinkedCareBookingsSync({
          userId: user.id,
          email: normalizeEmail(user.email),
          fullName,
          phone,
        });
        const context = await detectSecurityRequestContext();
        await logSecurityEvent({
          userId: user.id,
          eventType: "account_sign_in",
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          locationSummary: context.locationSummary,
          metadata: {
            source: "auth_callback",
            email: user.email || null,
          },
        });

        // Referral conversion — only fires if a referral code was captured
        // in the hc_ref cookie (or ?ref= query param) at signup time. Idempotent
        // on referred_user_id, so duplicate callbacks don't double-count.
        const referralCode =
          searchParams.get("ref") || cookieStore.get(REFERRAL_COOKIE_NAME)?.value || null;
        if (referralCode) {
          try {
            await recordReferralConversion({
              referralCode,
              refereeId: user.id,
              refereeEmail: user.email || null,
              refereePhone: phone,
              refereeIp: context.ipAddress,
              refereeUserAgent: context.userAgent,
              source: "auth_callback",
            });
          } catch {
            // Referral capture must never block the signup flow itself.
          }
          // Clear the cookie regardless of outcome so the guard can't be
          // retried by replaying the callback.
          try {
            cookieStore.set(REFERRAL_COOKIE_NAME, "", {
              domain: cookieDomain,
              path: "/",
              maxAge: 0,
            });
          } catch {
            // read-only cookie context — ignore.
          }
        }

        const destination = await resolveAuthenticatedDestination({
          user,
          next,
          origin,
        });
        return NextResponse.redirect(destination);
      }
    }
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "auth");
  const safeNext = normalizeTrustedRedirect(next);
  if (safeNext !== "/") {
    loginUrl.searchParams.set("next", safeNext);
  }
  return NextResponse.redirect(loginUrl);
}
