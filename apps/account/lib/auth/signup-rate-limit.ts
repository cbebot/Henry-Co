import "server-only";

/**
 * In-memory IP-keyed rate limit for the public signup endpoint.
 *
 * Limit: 5 attempts per 30 seconds per IP. Sliding-floor window — bucket
 * resets at the next 30s boundary after first hit.
 *
 * Modeled on packages/notifications/rate-limit.ts. State lives in the
 * Node.js process — on serverless deployments each lambda instance has
 * its own buckets, so the effective ceiling is roughly
 * (instance-count * 5) per 30s. Adequate for absorbing scripted abuse
 * against signup; a Redis-backed limiter is the right next step if
 * signup ever becomes a high-volume target.
 */

const WINDOW_MS = 30_000;
const LIMIT = 5;

type Bucket = {
  count: number;
  windowStart: number;
};

const buckets = new Map<string, Bucket>();

export type SignupRateCheck =
  | { allowed: true; remaining: number; resetAtMs: number }
  | { allowed: false; retryAfterSeconds: number };

export function checkSignupRate(ipKey: string, now: number = Date.now()): SignupRateCheck {
  if (!ipKey) {
    // No IP attribution available — fail closed at the cap so the absence
    // of x-forwarded-for cannot be used to skip the limit.
    return { allowed: false, retryAfterSeconds: Math.ceil(WINDOW_MS / 1000) };
  }

  const existing = buckets.get(ipKey);

  if (!existing || now - existing.windowStart > WINDOW_MS) {
    buckets.set(ipKey, { count: 1, windowStart: now });
    return { allowed: true, remaining: LIMIT - 1, resetAtMs: now + WINDOW_MS };
  }

  if (existing.count >= LIMIT) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.windowStart + WINDOW_MS - now) / 1000),
    );
    return { allowed: false, retryAfterSeconds };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: LIMIT - existing.count,
    resetAtMs: existing.windowStart + WINDOW_MS,
  };
}

export function _resetSignupRateBucketsForTests(): void {
  buckets.clear();
}

/**
 * Extract the caller's IP from a Next.js request's headers. Mirrors the
 * x-forwarded-for / x-real-ip / cf-connecting-ip / x-vercel-forwarded-for
 * fallback chain used by detectSecurityRequestContext().
 */
export function extractClientIp(headers: Headers): string | null {
  const forwardedFor = headers.get("x-forwarded-for") || "";
  const candidate =
    forwardedFor.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    headers.get("x-vercel-forwarded-for") ||
    null;

  return candidate ? candidate.trim() || null : null;
}
