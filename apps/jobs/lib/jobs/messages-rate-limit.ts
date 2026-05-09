import "server-only";

/**
 * In-memory user-keyed rate limit for the hiring messages endpoint.
 *
 * Limit: 20 messages per 60 seconds per user. Sliding-floor window.
 *
 * State lives in the Node.js process — on serverless deployments each lambda
 * instance has its own buckets, so the effective ceiling per minute is roughly
 * (instance-count * 20). Adequate for absorbing scripted abuse against the
 * messaging endpoint without blocking legitimate burst typing. A Redis-backed
 * limiter is the right next step if hiring messaging becomes high-volume.
 */

const WINDOW_MS = 60_000;
const LIMIT = 20;

type Bucket = {
  count: number;
  windowStart: number;
};

const buckets = new Map<string, Bucket>();

export type MessagesRateCheck =
  | { allowed: true; remaining: number; resetAtMs: number }
  | { allowed: false; retryAfterSeconds: number };

export function checkMessagesRate(
  key: string,
  now: number = Date.now(),
): MessagesRateCheck {
  if (!key) {
    return { allowed: false, retryAfterSeconds: Math.ceil(WINDOW_MS / 1000) };
  }

  const existing = buckets.get(key);

  if (!existing || now - existing.windowStart > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
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

export function _resetMessagesRateBucketsForTests(): void {
  buckets.clear();
}
