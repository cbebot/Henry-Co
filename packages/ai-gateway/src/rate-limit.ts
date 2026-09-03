import type { AiSurfaceKey } from "./surfaces";

/** A velocity check: at most `maxPerWindow` calls per `actorId`+`surface` within `windowMs`.
 *  An undefined `maxPerWindow` means unlimited. */
export interface RateLimitCheck {
  actorId: string;
  surface: AiSurfaceKey;
  maxPerWindow?: number;
  windowMs: number;
}

/**
 * The rate-limit seam — an injected port so the gateway's anti-abuse caps are enforced once,
 * uniformly, and the storage backend is swappable (in-memory per instance; a DB/KV-backed
 * implementation for durable cross-instance limits). `consume` is an atomic
 * check-and-increment: it records the attempt and reports whether it was within the cap.
 */
export interface AiRateLimitPort {
  consume(check: RateLimitCheck): Promise<{ allowed: boolean; remaining?: number }>;
}

interface Bucket {
  windowStart: number;
  count: number;
}

/**
 * A pure, windowed in-memory rate limiter (fixed-window counter). Correct and dependency-free;
 * use it for tests and as a PER-INSTANCE backstop. For durable, cross-instance limits in
 * production (multiple serverless instances), back the same `AiRateLimitPort` with a shared
 * store (a Postgres counter table or KV) — the orchestrator is unchanged either way.
 */
export class InMemoryRateLimiter implements AiRateLimitPort {
  private readonly buckets = new Map<string, Bucket>();
  private readonly now: () => number;

  constructor(now: () => number = () => Date.now()) {
    this.now = now;
  }

  async consume(check: RateLimitCheck): Promise<{ allowed: boolean; remaining?: number }> {
    if (check.maxPerWindow == null) return { allowed: true };
    if (check.maxPerWindow <= 0) return { allowed: false, remaining: 0 };

    const key = `${check.actorId}::${check.surface}`;
    const t = this.now();
    const existing = this.buckets.get(key);

    if (!existing || t - existing.windowStart >= check.windowMs) {
      // New window — this attempt is the first.
      this.buckets.set(key, { windowStart: t, count: 1 });
      return { allowed: true, remaining: check.maxPerWindow - 1 };
    }

    if (existing.count >= check.maxPerWindow) {
      return { allowed: false, remaining: 0 };
    }
    existing.count += 1;
    return { allowed: true, remaining: check.maxPerWindow - existing.count };
  }
}

export const DAY_MS = 24 * 60 * 60 * 1000;
