import "server-only";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAccountUrl, normalizeTrustedRedirect } from "@henryco/config";
import { emitEvent } from "@henryco/observability/events";

/**
 * V3-04 (S1) — Deep-link auth round-trip preservation.
 *
 * A deep link (from a notification, email, or share) can point at a
 * protected surface. When an *anonymous* visitor follows one, we must
 * bounce them through sign-in and land them back EXACTLY where the link
 * pointed — otherwise the deep link is broken for logged-out users
 * (the single most common real-world case: tap an email CTA on a fresh
 * device).
 *
 * This is distinct from V3-01's `reauthRedirectFor()`:
 *   - `reauthRedirectFor` handles an EXPIRED session (cookies present,
 *     refresh failed) → `/auth/reauth?return=…` (the password-only
 *     re-entry surface).
 *   - `signInRedirectFor` (here) handles a FIRST-TIME / signed-out
 *     visitor (no session at all) → the account SSO sign-in
 *     (`/login?next=…`), which is the convention `apps/account`'s
 *     `/login` + `/auth/choose` + `/auth/callback` already speak.
 *
 * Domain abstraction: the redirect target is built with
 * `getAccountUrl()` (env-driven `NEXT_PUBLIC_ACCOUNT_URL` + live-alias
 * fallback), never a hardcoded host. The preserved target is run
 * through `normalizeTrustedRedirect()` so an attacker can't smuggle an
 * off-platform `next=` through a HenryCo link.
 */

const SIGN_IN_PATH = "/login";
const RETURN_PARAM = "next";

/** Inbound aliases a deep link may carry the post-auth target under. */
const RETURN_ALIASES = ["next", "return", "returnTo", "redirect"] as const;

/**
 * The auth path that completed a deep-link round trip. Mirrors
 * `DeepLinkReturnedAfterAuthPayload["via"]` in
 * `@henryco/seo/deeplinks`.
 */
export type DeepLinkReturnVia = "sign_in" | "sign_up" | "oauth" | "reauth";

function isLoopbackHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized.endsWith(".localhost")
  );
}

/**
 * Resolve the absolute path (+ search) the user was trying to reach.
 * Prefers an explicit inbound `next=`/`return=` alias (the link itself
 * already named a post-auth target — e.g. a cross-domain notification
 * link that bounced once); otherwise uses the current request path.
 *
 * The result is a *relative* path so it round-trips cleanly through the
 * `next=` query convention; the SSO host normalises it again on the way
 * back out.
 */
export function resolveDeepLinkTarget(req: NextRequest): string {
  for (const alias of RETURN_ALIASES) {
    const inbound = req.nextUrl.searchParams.get(alias);
    if (inbound) {
      const normalized = normalizeTrustedRedirect(inbound);
      if (normalized !== "/") return normalized;
    }
  }
  return `${req.nextUrl.pathname}${req.nextUrl.search}`;
}

/**
 * Build the absolute account sign-in URL for a signed-out visitor,
 * preserving `target` under `?next=` so the existing
 * `/login → /auth/callback → resolveUserDashboard({next})` chain lands
 * them back on the deep-link surface.
 *
 * On loopback hosts the redirect stays same-origin (`/login?next=…`)
 * so local dev does not bounce to a production account host.
 */
export function buildSignInRedirectUrl(req: NextRequest, target: string): URL {
  const safeTarget = normalizeTrustedRedirect(target);

  if (isLoopbackHostname(req.nextUrl.hostname)) {
    const local = new URL(SIGN_IN_PATH, req.nextUrl);
    if (safeTarget !== "/") local.searchParams.set(RETURN_PARAM, safeTarget);
    return local;
  }

  // Cross-domain: the account app is the SSO root. `getAccountUrl`
  // resolves the canonical account origin from config (never hardcoded).
  // When the deep link lives on a division subdomain, the preserved
  // target must be an ABSOLUTE url so the post-auth redirect can leave
  // the account origin and land back on that division.
  const absoluteTarget =
    safeTarget.startsWith("/") && safeTarget !== "/"
      ? new URL(safeTarget, req.nextUrl.origin).toString()
      : safeTarget;

  const signInUrl = new URL(getAccountUrl(SIGN_IN_PATH));
  if (absoluteTarget !== "/") {
    // Re-normalise the now-absolute target so the value we hand to the
    // SSO host is itself trusted (defence in depth — the host will
    // normalise again, but we never want to emit an untrusted `next`).
    signInUrl.searchParams.set(RETURN_PARAM, normalizeTrustedRedirect(absoluteTarget));
  }
  return signInUrl;
}

export type SignInRedirectOptions = {
  /** Where the deep link came from (notification / email / share). */
  source?: "notification" | "email" | "share" | "sms" | "unknown";
  /** Actor id, when a prior (now-expired) identity is known. */
  userId?: string;
  /**
   * Override the resolved target. When omitted, `resolveDeepLinkTarget`
   * derives it from the request (inbound alias or current path).
   */
  target?: string;
  /** Forward Set-Cookie writes from an inner response onto the redirect. */
  carryCookiesFrom?: NextResponse;
};

/**
 * Build the sign-in redirect for an anonymous visitor who followed a
 * deep link into a protected surface, and emit `henry.deeplink.arrived`
 * with `outcome: "auth_gated"` so the owner deep-link-health tile can
 * see how often deep links bounce through auth.
 *
 * @example
 *   // inside apps/<division>/proxy.ts, for a gated deep-link target:
 *   if (session.status === "anonymous" && isGatedDeepLink(pathname)) {
 *     return signInRedirectFor(request, {
 *       source: "notification",
 *       carryCookiesFrom: response,
 *     });
 *   }
 */
export function signInRedirectFor(
  req: NextRequest,
  options: SignInRedirectOptions = {},
): NextResponse {
  const target = options.target ?? resolveDeepLinkTarget(req);

  emitEvent({
    name: "henry.deeplink.arrived",
    classification: "system_state",
    outcome: "blocked",
    actorId: options.userId,
    payload: {
      source: options.source ?? "unknown",
      target,
      outcome: "auth_gated",
    },
  });

  const signInUrl = buildSignInRedirectUrl(req, target);
  const res = NextResponse.redirect(signInUrl, 307);

  if (options.carryCookiesFrom) {
    for (const cookie of options.carryCookiesFrom.cookies.getAll()) {
      res.cookies.set(cookie);
    }
  }

  return res;
}

/**
 * Emit `henry.deeplink.returned_after_auth` — call this from the
 * post-auth landing (e.g. `apps/account`'s `/auth/callback`) when a
 * sign-in round trip completes AND a deep-link target was preserved.
 *
 * Kept as a thin emit helper (not a redirect) because the callback
 * already owns its redirect; it just needs to record that the deep
 * link survived the detour.
 */
export function emitDeepLinkReturnedAfterAuth(params: {
  target: string;
  via: DeepLinkReturnVia;
  userId?: string;
}): void {
  emitEvent({
    name: "henry.deeplink.returned_after_auth",
    classification: "system_state",
    outcome: "completed",
    actorId: params.userId,
    payload: {
      target: params.target,
      via: params.via,
    },
  });
}

export type DeepLinkGateOptions = {
  /**
   * Decide whether a given request is a protected deep-link target that
   * an anonymous visitor must sign in to reach. Receives the request so
   * a caller can gate by path prefix, method, or query.
   */
  isGated: (req: NextRequest) => boolean;
  /** Resolve the current session status for the request. */
  resolve: (
    req: NextRequest,
  ) => Promise<"authenticated" | "anonymous"> | "authenticated" | "anonymous";
  /** Where the deep link came from, for telemetry. */
  source?: SignInRedirectOptions["source"];
};

/**
 * Wrap a Next.js middleware so anonymous hits on a gated deep-link
 * target bounce through the account SSO sign-in with the target
 * preserved, while every other request flows through untouched.
 *
 * Division apps that currently do passive auth (care / jobs / learn /
 * logistics / property / studio) can opt specific protected deep-link
 * surfaces into the round trip without rewriting their proxy:
 *
 *   export const proxy = withDeepLinkGate(existingProxy, {
 *     resolve: async (req) => (await isSignedIn(req)) ? "authenticated" : "anonymous",
 *     isGated: (req) => req.nextUrl.pathname.startsWith("/account/"),
 *     source: "notification",
 *   });
 */
export function withDeepLinkGate<Args extends unknown[]>(
  next: (
    req: NextRequest,
    ...rest: Args
  ) => Promise<NextResponse | undefined> | NextResponse | undefined,
  options: DeepLinkGateOptions,
) {
  return async (req: NextRequest, ...rest: Args): Promise<NextResponse> => {
    if (options.isGated(req)) {
      const status = await options.resolve(req);
      if (status === "anonymous") {
        return signInRedirectFor(req, { source: options.source });
      }
    }
    return (await next(req, ...rest)) ?? NextResponse.next();
  };
}
