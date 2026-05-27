import "server-only";

/**
 * V3-02 S4 — sensitive-action guard.
 *
 * Wraps a Next.js route handler. Before the handler runs, the guard:
 *
 *   1. Resolves the active Supabase session. No session → 401.
 *   2. Verifies the `hc_last_reauth` signed cookie matches the
 *      session sub AND is younger than 5 minutes. Absent / stale →
 *      401 with `WWW-Authenticate: SensitiveActionReauth` and
 *      `X-HenryCo-Reauth-Intent: <action>`. The client surfaces a
 *      modal; on success the original request retries with the
 *      same idempotency key (Addendum A11).
 *   3. Hits the Upstash-backed rate limiter (5 attempts per user
 *      per 5 minutes). Over the limit → 429 with Retry-After.
 *   4. On success, writes an audit-log entry via the supplied
 *      logger or the default `writeAuditLog` helper.
 *
 * The guard is intentionally a thin wrapper rather than a Next.js
 * `middleware.ts` install — middleware runs on every request to the
 * app, and the audit + rate-limit costs only make sense on actual
 * sensitive routes. Wrapping at the handler keeps the contract
 * explicit at each call site.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { emitEvent } from "@henryco/observability/events";
import {
  writeAuditLog,
  type AuditLogSupabaseClient,
} from "@henryco/observability/audit-log";

import { readVerifiedReauth, HC_LAST_REAUTH_COOKIE } from "./reauth-cookie";
import {
  SENSITIVE_ACTION_RATE_LIMIT,
  checkSensitiveActionRate,
  type RateLimitCheck,
} from "./sensitive-action-rate-limit";

export type SensitiveActionGuardContext<TUser> = {
  user: TUser;
  reauthAt: number;
  request: Request;
};

export type SensitiveActionGuardOptions<TUser> = {
  /**
   * Stable identifier emitted in the X-HenryCo-Reauth-Intent header,
   * the audit log, and telemetry. Use dot-separated path e.g.
   * `wallet.transfer` or `auth.change_password`. The client modal
   * reads the header to render the right "confirm to continue" copy.
   */
  action: string;
  /**
   * Entity type recorded in the audit log. Pair with `entityId` from
   * the handler context once it is known.
   */
  entityType: string;
  /**
   * Optional Supabase client used to resolve the active session. The
   * caller passes whichever supabase helper they already use in the
   * handler; the guard only touches `auth.getUser()` and the rpc
   * for audit-log writes.
   */
  resolveUser: () => Promise<TUser | null>;
  /** Pull the user id from a TUser. */
  userId: (user: TUser) => string;
  /**
   * Optional supabase client used to write the audit-log entry. When
   * omitted, the guard skips the audit write and the handler is
   * expected to call `writeAuditLog` itself.
   */
  auditClient?: AuditLogSupabaseClient;
  /**
   * Optional override for the audit-log entityId — usually the
   * handler knows this after parsing the request body, so the
   * default omits it and lets the handler call `writeAuditLog`
   * with the entityId after the action completes.
   */
  entityId?: string | null;
  /**
   * Optional override for the now() timestamp; injectable for tests.
   */
  now?: () => number;
};

type GuardResult<TUser> =
  | { ok: true; context: SensitiveActionGuardContext<TUser> }
  | { ok: false; response: NextResponse };

export async function evaluateSensitiveActionGuard<TUser>(
  request: Request,
  options: SensitiveActionGuardOptions<TUser>,
): Promise<GuardResult<TUser>> {
  const now = options.now ? options.now() : Date.now();
  const user = await options.resolveUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  const userId = options.userId(user);
  const headerStore = await headers();
  const ip = pickIp(headerStore);
  const ua = headerStore.get("user-agent") ?? "unknown";

  const rate = await checkSensitiveActionRate(userId, now);
  if (!rate.ok) {
    return {
      ok: false,
      response: rateLimitedResponse(options.action, rate, userId),
    };
  }

  const reauth = await readVerifiedReauth(userId, now);
  if (!reauth) {
    emitEvent({
      name: "henry.auth.sensitive_action.reauth_required",
      classification: "system_state",
      outcome: "blocked",
      actorId: userId,
      payload: {
        action: options.action,
        ip,
        ua,
      },
    });
    const response = NextResponse.json(
      {
        error: "Re-authentication required.",
        code: "sensitive_action_reauth_required",
        intent: options.action,
      },
      { status: 401 },
    );
    response.headers.set(
      "WWW-Authenticate",
      `SensitiveActionReauth intent="${options.action}", reauth_url="/auth/reauth"`,
    );
    response.headers.set("X-HenryCo-Reauth-Intent", options.action);
    response.headers.set(
      "X-HenryCo-Rate-Remaining",
      String(rate.ok ? rate.remaining : 0),
    );
    return { ok: false, response };
  }

  if (options.auditClient) {
    await writeAuditLog(options.auditClient, {
      action: `sensitive_action.${options.action}.attempted`,
      entityType: options.entityType,
      entityId: options.entityId ?? null,
      newValues: {
        ip,
        ua,
        reauthAt: reauth.ts,
      },
      reason: null,
    });
  }

  return {
    ok: true,
    context: {
      user,
      reauthAt: reauth.ts,
      request,
    },
  };
}

/**
 * Wrap a route handler with the guard. Returns a handler with the
 * same signature; the inner handler only runs when the guard passes.
 *
 * The wrapped handler receives the original Request plus the guard
 * context as the second argument.
 */
export function withSensitiveAction<TUser>(
  options: SensitiveActionGuardOptions<TUser>,
  handler: (
    request: Request,
    ctx: SensitiveActionGuardContext<TUser>,
  ) => Promise<Response> | Response,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const guard = await evaluateSensitiveActionGuard(request, options);
    if (!guard.ok) return guard.response;
    return handler(request, guard.context);
  };
}

/**
 * Convenience for handlers that prefer the imperative form (use
 * inside an existing POST/PUT handler). Returns null when the guard
 * passes, otherwise returns the response to return immediately.
 */
export async function requireSensitiveAction<TUser>(
  request: Request,
  options: SensitiveActionGuardOptions<TUser>,
): Promise<{ ok: true; context: SensitiveActionGuardContext<TUser> } | { ok: false; response: NextResponse }> {
  return evaluateSensitiveActionGuard(request, options);
}

function rateLimitedResponse(
  action: string,
  rate: Extract<RateLimitCheck, { ok: false }>,
  userId: string,
): NextResponse {
  emitEvent({
    name: "henry.auth.sensitive_action.rate_limited",
    classification: "system_state",
    outcome: "blocked",
    actorId: userId,
    payload: {
      action,
      transport: rate.transport,
      retryAfterSeconds: rate.retryAfterSeconds,
      limit: SENSITIVE_ACTION_RATE_LIMIT.limit,
      windowMs: SENSITIVE_ACTION_RATE_LIMIT.windowMs,
    },
  });
  const response = NextResponse.json(
    {
      error: "Too many re-authentication attempts. Please wait and try again.",
      code: "sensitive_action_rate_limited",
      retryAfterSeconds: rate.retryAfterSeconds,
    },
    { status: 429 },
  );
  response.headers.set("Retry-After", String(rate.retryAfterSeconds));
  response.headers.set("X-HenryCo-Reauth-Intent", action);
  return response;
}

function pickIp(headerStore: Headers): string {
  const forwardedFor = headerStore.get("x-forwarded-for") ?? "";
  const candidate =
    forwardedFor.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    headerStore.get("cf-connecting-ip") ||
    headerStore.get("x-vercel-forwarded-for") ||
    "";
  return candidate.trim() || "unknown";
}

export { HC_LAST_REAUTH_COOKIE };
export { writeReauthCookieToJar as recordSuccessfulReauth } from "./reauth-cookie";
