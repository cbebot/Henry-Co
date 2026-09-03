import "server-only";

// User-keyed in-memory sliding window for the /api/report route. Mirrors the
// jobs messages-rate-limit pattern. Empty key fails CLOSED (a missing user id
// can't bypass the limit). Buckets need a long-lived Node process — the route
// declares `runtime = "nodejs"`.

const WINDOW_MS = 60_000;
const LIMIT = 10; // reports per minute per user

type Bucket = { count: number; windowStart: number };
const buckets = new Map<string, Bucket>();

export type ReportRateCheck =
  | { allowed: true; remaining: number; resetAtMs: number }
  | { allowed: false; retryAfterSeconds: number };

export function checkReportRate(key: string, now: number = Date.now()): ReportRateCheck {
  if (!key) return { allowed: false, retryAfterSeconds: Math.ceil(WINDOW_MS / 1000) };
  const existing = buckets.get(key);
  if (!existing || now - existing.windowStart > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: LIMIT - 1, resetAtMs: now + WINDOW_MS };
  }
  if (existing.count >= LIMIT) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.windowStart + WINDOW_MS - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }
  existing.count += 1;
  return { allowed: true, remaining: LIMIT - existing.count, resetAtMs: existing.windowStart + WINDOW_MS };
}

export function _resetReportRateBucketsForTests(): void {
  buckets.clear();
}
