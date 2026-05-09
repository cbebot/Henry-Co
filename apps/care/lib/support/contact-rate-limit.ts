import "server-only";

/**
 * In-memory IP-keyed rate limit for the public care/contact endpoint.
 *
 * Limit: 5 contact submissions per 60 seconds per IP. Sliding-floor window.
 * Modeled on apps/account/lib/auth/signup-rate-limit.ts.
 *
 * State lives in the Node.js process — on serverless deployments each lambda
 * instance has its own buckets, so the effective ceiling is roughly
 * (instance-count * 5) per minute. Adequate for absorbing scripted abuse
 * against the public contact form; a Redis-backed limiter is the right next
 * step if care contact ever becomes a high-volume target.
 *
 * V5-3 deep-sweep finding B4: prior route had no rate limiter.
 */

const WINDOW_MS = 60_000;
const LIMIT = 5;

type Bucket = {
  count: number;
  windowStart: number;
};

const buckets = new Map<string, Bucket>();

export type ContactRateCheck =
  | { allowed: true; remaining: number; resetAtMs: number }
  | { allowed: false; retryAfterSeconds: number };

export function checkContactRate(
  ipKey: string,
  now: number = Date.now(),
): ContactRateCheck {
  if (!ipKey) {
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

export function _resetContactRateBucketsForTests(): void {
  buckets.clear();
}

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
