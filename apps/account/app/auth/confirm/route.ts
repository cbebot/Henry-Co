import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";
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

const ALLOWED_TYPES: ReadonlySet<EmailOtpType> = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";

  // Supabase emits "email_change_new" for the confirm-new-address email; both
  // sides verify with the same OTP type "email_change".
  const normalizedRawType = rawType === "email_change_new" ? "email_change" : rawType;
  const type = (normalizedRawType && ALLOWED_TYPES.has(normalizedRawType as EmailOtpType)
    ? normalizedRawType
    : null) as EmailOtpType | null;

  if (tokenHash && type) {
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

    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const justConfirmed =
          typeof user.email_confirmed_at === "string" &&
          (() => {
            const confirmedMs = Date.parse(user.email_confirmed_at as string);
            if (Number.isNaN(confirmedMs)) return false;
            return Date.now() - confirmedMs < 10 * 60 * 1000;
          })();

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
          eventType: type === "recovery" ? "account_password_reset_request" : "account_sign_in",
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          locationSummary: context.locationSummary,
          metadata: {
            source: "auth_confirm",
            email: user.email || null,
            otp_type: type,
          },
        });

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
              source: "auth_confirm",
            });
          } catch {
            // Referral capture must never block the signup flow itself.
          }
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

        // Recovery flows must drop the user on the password reset screen, not
        // the workspace, so they can choose a new password while authenticated.
        if (type === "recovery") {
          const resetUrl = new URL("/reset-password", origin);
          const safeNext = normalizeTrustedRedirect(next);
          if (safeNext !== "/") resetUrl.searchParams.set("next", safeNext);
          return NextResponse.redirect(resetUrl);
        }

        if (justConfirmed) {
          const verifiedUrl = new URL("/auth/verified", origin);
          const safeNext = normalizeTrustedRedirect(next);
          if (safeNext !== "/") verifiedUrl.searchParams.set("next", safeNext);
          return NextResponse.redirect(verifiedUrl);
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
  if (safeNext !== "/") loginUrl.searchParams.set("next", safeNext);
  return NextResponse.redirect(loginUrl);
}
