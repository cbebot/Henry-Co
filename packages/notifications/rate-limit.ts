/**
 * In-memory rate limit per (userId, eventType).
 *
 * Limits enforced (per the V2-NOT-01-A spec):
 *   - 5 publishes per minute
 *   - 30 publishes per hour
 *
 * Scope notes:
 *   - State lives in the Node.js process. On serverless platforms each lambda
 *     instance has its own buckets, so in steady state the effective limit is
 *     instance-count * 5/min. Adequate for foundation; a Redis-backed limiter
 *     is NOT-01-D scope if the publisher endpoint becomes externally callable.
 *   - The minute window is sliding-floor: it resets at the next 60s boundary.
 *     The hour window is the same on the 3600s boundary. Bursting at boundaries
 *     is bounded by `min(5/min, 30/hr)` so it cannot exceed the hour cap.
 */

const MIN_WINDOW_MS = 60_000;
const HOUR_WINDOW_MS = 3_600_000;
const MIN_LIMIT = 5;
const HOUR_LIMIT = 30;

type Bucket = {
  minuteCount: number;
  minuteStart: number;
  hourCount: number;
  hourStart: number;
};

const buckets = new Map<string, Bucket>();

export type RateCheck = { allowed: true } | { allowed: false; reason: "minute" | "hour" };

export function checkRate(userId: string, eventType: string, now: number = Date.now()): RateCheck {
  const key = `${userId}|${eventType}`;
  const existing = buckets.get(key);

  if (!existing) {
    buckets.set(key, {
      minuteCount: 1,
      minuteStart: now,
      hourCount: 1,
      hourStart: now,
    });
    return { allowed: true };
  }

  if (now - existing.minuteStart > MIN_WINDOW_MS) {
    existing.minuteCount = 0;
    existing.minuteStart = now;
  }
  if (now - existing.hourStart > HOUR_WINDOW_MS) {
    existing.hourCount = 0;
    existing.hourStart = now;
  }

  if (existing.minuteCount >= MIN_LIMIT) return { allowed: false, reason: "minute" };
  if (existing.hourCount >= HOUR_LIMIT) return { allowed: false, reason: "hour" };

  existing.minuteCount += 1;
  existing.hourCount += 1;
  return { allowed: true };
}

/**
 * Test-only reset. Not exported from the package's public entry point.
 */
export function _resetRateBucketsForTests(): void {
  buckets.clear();
}
