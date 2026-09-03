import "server-only";

/**
 * V3-02 S4 Addendum A3 — sensitive-action reauth rate limiter.
 *
 * Contract:
 *   - 5 attempts per 5-minute fixed window per user id (sub).
 *   - Cross-instance safe when UPSTASH_REDIS_REST_URL +
 *     UPSTASH_REDIS_REST_TOKEN are configured: writes through the
 *     Upstash REST API via INCR + EXPIRE, so every Vercel lambda
 *     sees the same counter.
 *   - Local fallback: when the env is absent (dev / preview), an
 *     in-memory counter mirrors the same semantics within a single
 *     Node.js process. The fallback is deliberately not
 *     cross-instance — operators see the structured log line
 *     `sensitive-reauth.rate-limit.local-fallback` so the gap is
 *     visible.
 *
 * Window choice: fixed (not sliding) — matches the 5-minute reauth
 * window and lets a successful reauth ALSO clear / age out the
 * rate counter naturally as the next window opens.
 *
 * Key shape (per spec): `ratelimit:sensitive-reauth:<sub>:<window>`.
 * `<window>` is `floor(now / 300_000)` so concurrent attempts inside
 * a window land on the same counter.
 */

import { logger } from "@henryco/observability/logger";

const WINDOW_MS = 5 * 60 * 1000;
const LIMIT = 5;

export type RateLimitCheck =
  | { ok: true; remaining: number; resetMs: number; transport: "upstash" | "local" }
  | { ok: false; retryAfterSeconds: number; resetMs: number; transport: "upstash" | "local" };

type Bucket = {
  count: number;
  windowStart: number;
};

const localBuckets = new Map<string, Bucket>();

function currentWindowStart(now: number): number {
  return Math.floor(now / WINDOW_MS) * WINDOW_MS;
}

function localKey(userId: string, windowStart: number): string {
  return `${userId}:${windowStart}`;
}

function checkLocal(userId: string, now: number): RateLimitCheck {
  const windowStart = currentWindowStart(now);
  const key = localKey(userId, windowStart);
  const existing = localBuckets.get(key);
  const nextWindow = windowStart + WINDOW_MS;
  if (!existing || existing.windowStart !== windowStart) {
    localBuckets.set(key, { count: 1, windowStart });
    return {
      ok: true,
      remaining: LIMIT - 1,
      resetMs: nextWindow,
      transport: "local",
    };
  }
  if (existing.count >= LIMIT) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((nextWindow - now) / 1000)),
      resetMs: nextWindow,
      transport: "local",
    };
  }
  existing.count += 1;
  return {
    ok: true,
    remaining: LIMIT - existing.count,
    resetMs: nextWindow,
    transport: "local",
  };
}

type UpstashIncrResponse =
  | { result: number; error?: undefined }
  | { result?: undefined; error: string };

type UpstashExpireResponse =
  | { result: number; error?: undefined }
  | { result?: undefined; error: string };

async function checkUpstash(
  url: string,
  token: string,
  userId: string,
  now: number,
): Promise<RateLimitCheck | null> {
  const windowStart = currentWindowStart(now);
  const nextWindow = windowStart + WINDOW_MS;
  const key = `ratelimit:sensitive-reauth:${userId}:${windowStart}`;
  // Upstash REST pipeline — INCR then EXPIRE (no-op when already set).
  // EXPIRE re-applies every call which is fine for a 5-min window.
  try {
    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["PEXPIRE", key, String(WINDOW_MS)],
      ]),
      // Edge runtime + serverless — short timeout so a stuck Redis
      // does not stall the auth flow longer than necessary.
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) {
      logger.warn("sensitive-reauth.rate-limit.upstash-non-2xx", {
        status: response.status,
      });
      return null;
    }
    const body = (await response.json()) as [UpstashIncrResponse, UpstashExpireResponse];
    if (!Array.isArray(body) || body.length < 1) return null;
    const incr = body[0];
    if (incr.error !== undefined || typeof incr.result !== "number") {
      logger.warn("sensitive-reauth.rate-limit.upstash-incr-error", {
        error: incr.error ?? "unknown",
      });
      return null;
    }
    const count = incr.result;
    if (count > LIMIT) {
      return {
        ok: false,
        retryAfterSeconds: Math.max(1, Math.ceil((nextWindow - now) / 1000)),
        resetMs: nextWindow,
        transport: "upstash",
      };
    }
    return {
      ok: true,
      remaining: Math.max(0, LIMIT - count),
      resetMs: nextWindow,
      transport: "upstash",
    };
  } catch (e) {
    logger.warn("sensitive-reauth.rate-limit.upstash-threw", {
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

/**
 * Check (and atomically increment) the rate counter for a user. The
 * counter is incremented regardless of whether the action ultimately
 * succeeds — a flurry of failed attempts AND a flurry of successful
 * reauths both count toward the same 5-attempt ceiling, because the
 * abuse signal is "rapid sensitive-action traffic", not "rapid
 * failed-reauth traffic".
 */
export async function checkSensitiveActionRate(
  userId: string,
  now: number = Date.now(),
): Promise<RateLimitCheck> {
  if (!userId) {
    // Fail-closed when we cannot attribute the attempt.
    return {
      ok: false,
      retryAfterSeconds: Math.ceil(WINDOW_MS / 1000),
      resetMs: now + WINDOW_MS,
      transport: "local",
    };
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    const result = await checkUpstash(url, token, userId, now);
    if (result) return result;
    // Upstash unreachable — fall through to local fallback so the
    // auth flow does not depend on Redis liveness.
    logger.info("sensitive-reauth.rate-limit.local-fallback", {
      reason: "upstash-unreachable",
    });
    return checkLocal(userId, now);
  }

  logger.info("sensitive-reauth.rate-limit.local-fallback", {
    reason: "no-upstash-env",
  });
  return checkLocal(userId, now);
}

/** Test-only — clears the in-memory bucket store. */
export function _resetSensitiveActionRateBucketsForTests(): void {
  localBuckets.clear();
}

export const SENSITIVE_ACTION_RATE_LIMIT = {
  windowMs: WINDOW_MS,
  limit: LIMIT,
} as const;

/* -------------------------------------------------------------------------- */
/*  Parameterised limiter for ancillary auth surfaces                         */
/* -------------------------------------------------------------------------- */

const ancillaryBuckets = new Map<string, Bucket>();

export type AncillaryRateOptions = {
  /** Stable identifier — included in the Redis key. */
  key: string;
  /** Subject (typically user id) the counter is scoped to. */
  subject: string;
  /** Window length in ms. */
  windowMs: number;
  /** Max attempts in window. */
  limit: number;
};

function checkLocalAncillary(
  options: AncillaryRateOptions,
  now: number,
): RateLimitCheck {
  const windowStart = Math.floor(now / options.windowMs) * options.windowMs;
  const cacheKey = `${options.key}:${options.subject}:${windowStart}`;
  const existing = ancillaryBuckets.get(cacheKey);
  const nextWindow = windowStart + options.windowMs;
  if (!existing || existing.windowStart !== windowStart) {
    ancillaryBuckets.set(cacheKey, { count: 1, windowStart });
    return {
      ok: true,
      remaining: options.limit - 1,
      resetMs: nextWindow,
      transport: "local",
    };
  }
  if (existing.count >= options.limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((nextWindow - now) / 1000)),
      resetMs: nextWindow,
      transport: "local",
    };
  }
  existing.count += 1;
  return {
    ok: true,
    remaining: options.limit - existing.count,
    resetMs: nextWindow,
    transport: "local",
  };
}

async function checkUpstashAncillary(
  url: string,
  token: string,
  options: AncillaryRateOptions,
  now: number,
): Promise<RateLimitCheck | null> {
  const windowStart = Math.floor(now / options.windowMs) * options.windowMs;
  const nextWindow = windowStart + options.windowMs;
  const key = `ratelimit:${options.key}:${options.subject}:${windowStart}`;
  try {
    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["PEXPIRE", key, String(options.windowMs)],
      ]),
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as [UpstashIncrResponse, UpstashExpireResponse];
    if (!Array.isArray(body) || body.length < 1) return null;
    const incr = body[0];
    if (incr.error !== undefined || typeof incr.result !== "number") return null;
    const count = incr.result;
    if (count > options.limit) {
      return {
        ok: false,
        retryAfterSeconds: Math.max(1, Math.ceil((nextWindow - now) / 1000)),
        resetMs: nextWindow,
        transport: "upstash",
      };
    }
    return {
      ok: true,
      remaining: Math.max(0, options.limit - count),
      resetMs: nextWindow,
      transport: "upstash",
    };
  } catch {
    return null;
  }
}

/**
 * General-purpose per-subject rate limiter. Used by ancillary auth
 * surfaces (role-status endpoint at 10/min, sign-out-everywhere at
 * 3/min, etc.) that need the same Upstash-or-local semantics as the
 * sensitive-action limiter but with different window + limit knobs.
 */
export async function checkAncillaryRate(
  options: AncillaryRateOptions,
  now: number = Date.now(),
): Promise<RateLimitCheck> {
  if (!options.subject) {
    return {
      ok: false,
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
      resetMs: now + options.windowMs,
      transport: "local",
    };
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    const result = await checkUpstashAncillary(url, token, options, now);
    if (result) return result;
  }
  return checkLocalAncillary(options, now);
}

export function _resetAncillaryRateBucketsForTests(): void {
  ancillaryBuckets.clear();
}
