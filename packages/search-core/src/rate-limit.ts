/**
 * Per-user rate limit for search.
 *
 * Limits:
 *   - 60 queries / minute / user
 *   - 600 queries / hour / user
 *
 * Implementation: in-memory counter for single-instance dev; for
 * production we expect callers to wire a Redis-backed counter via the
 * `store` parameter. The default in-memory store is correct on a single
 * process and provides a graceful fallback when no shared store is
 * configured.
 *
 * For an entirely anonymous user (no user_id) we key on a stable IP
 * derived hash supplied by the caller.
 */

export interface RateLimitStore {
  incrementAndExpire(key: string, ttlSeconds: number): Promise<number>;
}

export class InMemoryRateLimitStore implements RateLimitStore {
  private buckets = new Map<string, { count: number; resetAt: number }>();

  async incrementAndExpire(key: string, ttlSeconds: number): Promise<number> {
    const now = Date.now();
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + ttlSeconds * 1000 });
      return 1;
    }
    bucket.count += 1;
    return bucket.count;
  }
}

const defaultStore = new InMemoryRateLimitStore();

export interface RateLimitDecision {
  allowed: boolean;
  remaining_minute: number;
  remaining_hour: number;
}

export async function checkSearchRateLimit(input: {
  identityKey: string;
  store?: RateLimitStore;
}): Promise<RateLimitDecision> {
  const store = input.store ?? defaultStore;
  const minuteKey = `search:rate:m:${input.identityKey}`;
  const hourKey = `search:rate:h:${input.identityKey}`;

  const minuteCount = await store.incrementAndExpire(minuteKey, 60);
  const hourCount = await store.incrementAndExpire(hourKey, 3600);

  const allowed = minuteCount <= 60 && hourCount <= 600;
  return {
    allowed,
    remaining_minute: Math.max(0, 60 - minuteCount),
    remaining_hour: Math.max(0, 600 - hourCount),
  };
}
