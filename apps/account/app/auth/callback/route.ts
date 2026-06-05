import { NextResponse, after } from "next/server";
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
  resolveRequestOrigin,
} from "@henryco/config";
import { emitEvent } from "@henryco/observability/events";
import {
  writeOAuthErrorCookie,
  type OAuthErrorCode,
} from "@henryco/auth/server/oauth-error-cookie";
import {
  writeOAuthLinkIntent,
  isOAuthLinkIntentEnabled,
} from "@henryco/auth/server/oauth-link-intent";
import { emitDeepLinkReturnedAfterAuth } from "@henryco/auth/server/deep-link-middleware";
import { ensureAccountProfileRecords } from "@/lib/account-profile";
import { scheduleLinkedCareBookingsSync } from "@/lib/care-sync";
import { DASHBOARD_PREFERENCE_COOKIE, resolveUserDashboard } from "@/lib/post-auth-routing";
import { recordReferralConversion } from "@/lib/referral-data";
import { detectSecurityRequestContext, logSecurityEvent } from "@/lib/security-events";
import {
  HC_DEVICE_COOKIE,
  HC_DEVICE_COOKIE_MAX_AGE,
  generateDeviceId,
  signDeviceId,
  verifyDeviceCookie,
} from "@/lib/security/device-cookie";
import { recordSignInAndMaybeAlert } from "@/lib/security/sign-in-alert";

const REFERRAL_COOKIE_NAME = "hc_ref";

/**
 * Detect an identity that Supabase just attached during this code
 * exchange. Heuristic: the user has BOTH password + oauth identities
 * AND the most recently created identity is OAuth AND it was created
 * within the last 60 seconds.
 *
 * When this fires AND `HENRYCO_AUTH_OAUTH_LINK_INTENT` is enabled,
 * the callback diverts through the link-account confirmation page
 * (Addendum A1) — auto-link without password confirmation is an
 * account-takeover vector.
 */
function detectNewlyAttachedOAuthIdentity(
  user: {
    identities?: Array<{
      provider?: string;
      created_at?: string;
      identity_data?: { email?: string };
    }> | null;
  },
  now: number = Date.now(),
): { provider: string; email: string | null } | null {
  const identities = user.identities ?? [];
  if (identities.length < 2) return null;
  const hasPassword = identities.some((i) => i.provider === "email");
  if (!hasPassword) return null;
  const oauthIdentities = identities.filter(
    (i) => i.provider && i.provider !== "email" && i.provider !== "phone",
  );
  if (oauthIdentities.length === 0) return null;
  const latest = [...oauthIdentities].sort((a, b) => {
    const aTs = a.created_at ? Date.parse(a.created_at) : 0;
    const bTs = b.created_at ? Date.parse(b.created_at) : 0;
    return bTs - aTs;
  })[0];
  if (!latest?.provider || !latest.created_at) return null;
  const createdMs = Date.parse(latest.created_at);
  if (Number.isNaN(createdMs)) return null;
  if (now - createdMs > 60_000) return null;
  return {
    provider: latest.provider,
    email: latest.identity_data?.email ?? null,
  };
}

function redirectWithOAuthError(
  origin: string,
  code: OAuthErrorCode,
  provider?: string,
): NextResponse {
  const response = NextResponse.redirect(new URL("/auth/choose", origin));
  writeOAuthErrorCookie(response, code, provider);
  emitEvent({
    name: "henry.auth.oauth.failed",
    classification: "system_state",
    outcome: "failed",
    payload: { code, provider: provider ?? null },
  });
  return response;
}

export async function GET(request: Request) {
  const { searchParams, origin: rawOrigin } = new URL(request.url);
  const headerStore = await headers();
  // Use the real public origin (proxy headers), not the internal Vercel
  // deployment host, so post-auth redirects keep the .<baseDomain>
  // session cookie intact.
  const origin = resolveRequestOrigin((name) => headerStore.get(name), rawOrigin);
  const code = searchParams.get("code");
  const providerError = searchParams.get("error");
  const next = searchParams.get("next") ?? "/";

  // Provider-side error surfaced via the OAuth redirect (user
  // cancelled, provider failure). Sanitise — do not echo the raw
  // upstream message into the URL. Land at the chooser with a
  // signed cookie carrying the reason (A6).
  if (providerError) {
    const code: OAuthErrorCode =
      providerError === "access_denied" || providerError === "user_cancelled"
        ? "cancelled"
        : "provider_error";
    return redirectWithOAuthError(origin, code);
  }

  if (code) {
    const cookieStore = await cookies();
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
        // Addendum A1: detect a freshly-attached OAuth identity on
        // an existing password account. When the feature flag is on,
        // sign the user out and redirect through the link-account
        // confirmation page. The cookie carries the email + provider
        // so /auth/link-account can render targeted copy.
        const newlyAttached = detectNewlyAttachedOAuthIdentity(user);
        if (newlyAttached) {
          emitEvent({
            name: "henry.auth.oauth.link_required",
            classification: "system_state",
            outcome: "started",
            actorId: user.id,
            payload: {
              provider: newlyAttached.provider,
              enforced: isOAuthLinkIntentEnabled(),
            },
          });
          if (isOAuthLinkIntentEnabled()) {
            // Sign out the freshly-minted session so the user cannot
            // proceed under the unverified link. Then redirect to
            // /auth/link-account?intent=oauth_link&provider=<name>.
            await supabase.auth.signOut();
            const linkUrl = new URL("/auth/link-account", origin);
            linkUrl.searchParams.set("intent", "oauth_link");
            linkUrl.searchParams.set("provider", newlyAttached.provider);
            const safeNext = normalizeTrustedRedirect(next);
            if (safeNext !== "/") linkUrl.searchParams.set("next", safeNext);
            const response = NextResponse.redirect(linkUrl);
            writeOAuthLinkIntent(response, {
              email: newlyAttached.email ?? user.email ?? "",
              provider: newlyAttached.provider,
            });
            return response;
          }
        }

        const justConfirmed =
          typeof user.email_confirmed_at === "string" &&
          (() => {
            const confirmedMs = Date.parse(user.email_confirmed_at as string);
            if (Number.isNaN(confirmedMs)) return false;
            // If confirmation happened in the last ~10 minutes, treat this as
            // a fresh signup confirmation and route through the premium
            // /auth/verified landing instead of dropping the user straight
            // into their workspace.
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
          eventType: "account_sign_in",
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          locationSummary: context.locationSummary,
          metadata: {
            source: "auth_callback",
            email: user.email || null,
          },
        });

        // V3-AUTH-SEC — recognise the device + alert on a new device/location.
        // The device id lives in a signed httpOnly cookie; detection + the
        // (email/in-app/push) fan-out run AFTER the response so they never add
        // latency to the redirect.
        let deviceId = verifyDeviceCookie(cookieStore.get(HC_DEVICE_COOKIE)?.value);
        if (!deviceId) {
          deviceId = generateDeviceId();
          try {
            cookieStore.set(HC_DEVICE_COOKIE, signDeviceId(deviceId), {
              path: "/",
              domain: cookieDomain,
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              maxAge: HC_DEVICE_COOKIE_MAX_AGE,
            });
          } catch {
            // Signing needs SUPABASE_JWT_SECRET; without it we skip device memory.
          }
        }
        const signInDeviceId = deviceId;
        after(() =>
          recordSignInAndMaybeAlert({
            userId: user.id,
            email: user.email ?? null,
            deviceId: signInDeviceId,
            userAgent: context.userAgent,
            country: context.country,
            locationSummary: context.locationSummary,
            ipAddress: context.ipAddress,
            origin,
            justConfirmed,
          }),
        );

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

        // Telemetry — record completion. Provider is best-effort:
        // we read from app_metadata (Supabase sets `provider`) and
        // fall back to "email" for password / magic-link callbacks.
        const provider =
          (typeof user.app_metadata?.provider === "string"
            ? user.app_metadata.provider
            : null) ?? "email";
        emitEvent({
          name: "henry.auth.oauth.completed",
          classification: "user_action",
          outcome: "completed",
          actorId: user.id,
          payload: {
            provider,
            firstSignIn: justConfirmed,
          },
        });

        // V3-04 (S1): a deep link that bounced an anonymous visitor
        // through sign-in carried its target in `next`. When that
        // target survived the round trip (not the bare "/" default),
        // record that the deep link completed its auth detour so the
        // owner deep-link-health tile can measure round-trip success.
        const deepLinkTarget = normalizeTrustedRedirect(next);
        if (deepLinkTarget !== "/") {
          emitDeepLinkReturnedAfterAuth({
            target: deepLinkTarget,
            via:
              justConfirmed
                ? "sign_up"
                : provider === "email"
                  ? "sign_in"
                  : "oauth",
            userId: user.id,
          });
        }

        if (justConfirmed) {
          const verifiedUrl = new URL("/auth/verified", origin);
          const safeNext = normalizeTrustedRedirect(next);
          if (safeNext !== "/") {
            verifiedUrl.searchParams.set("next", safeNext);
          }
          return NextResponse.redirect(verifiedUrl);
        }

        const preferredDashboardKey = cookieStore.get(DASHBOARD_PREFERENCE_COOKIE)?.value || null;
        const resolution = await resolveUserDashboard({
          user,
          next,
          origin,
          preferredDashboardKey,
        });
        return NextResponse.redirect(
          resolution.kind === "redirect" ? resolution.redirectUrl : resolution.chooserUrl
        );
      }
    } else {
      // Code exchange itself failed — sanitised redirect with the
      // signed error cookie. The chooser surfaces a generic
      // "couldn't sign you in" message.
      return redirectWithOAuthError(origin, "session_exchange_failed");
    }
  }

  // Code missing or no user resolved — generic failure path.
  // Preserve the original /login fallback for legacy clients but
  // also surface the error cookie so the chooser can render the
  // inline message if the user reaches it.
  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "auth");
  const safeNext = normalizeTrustedRedirect(next);
  if (safeNext !== "/") {
    loginUrl.searchParams.set("next", safeNext);
  }
  const response = NextResponse.redirect(loginUrl);
  writeOAuthErrorCookie(response, "callback_invalid");
  return response;
}
