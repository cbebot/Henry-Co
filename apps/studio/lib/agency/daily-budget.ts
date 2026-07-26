/**
 * SA-3 — the agency-wide DAILY provider-spend ceiling (SAFETY-MODEL §4.3). PURE
 * math (no server import) so it is unit-testable; the accompanying spend query
 * lives in store.ts (server-only).
 *
 * The per-job envelope (envelope.ts) stops one job from running away. This is
 * the layer above it: N concurrent jobs cannot compound past a COMPANY-day line.
 * It is enforced at DISPATCH — the tick refuses to spawn or resume an executor
 * once the day's accrued provider cost reaches the ceiling — so a runaway ARC
 * (many jobs, each individually under cap) still aborts before it overspends,
 * and it is enforced OUTSIDE the model: it reads accrued cost, it never trusts
 * an agent. The ceiling is live-tunable via env without a deploy.
 */

/** Company-day provider-spend ceiling, in kobo. Default ₦300,000 (≈3 max-cap jobs). */
export const DEFAULT_DAILY_CEILING_KOBO = 30_000_000;

const DAILY_CEILING_ENV = "STUDIO_AGENCY_DAILY_CEILING_KOBO";

function toInt(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

/** Resolve the tunable ceiling from env, clamped to a sane positive floor. */
export function resolveDailyCeilingKobo(
  env: Record<string, string | undefined> = process.env,
): number {
  const raw = toInt(env[DAILY_CEILING_ENV], DEFAULT_DAILY_CEILING_KOBO);
  // A non-positive/garbage value must never DISABLE the ceiling — fall back to
  // the default rather than to "unlimited".
  return raw > 0 ? raw : DEFAULT_DAILY_CEILING_KOBO;
}

/**
 * Has the company day's accrued provider cost reached the ceiling? `true` means
 * the tick must refuse to dispatch or resume new executor work until the day
 * rolls over (belt-and-braces above every per-job kill).
 */
export function isDailyCeilingReached(spentKobo: number, ceilingKobo: number): boolean {
  return toInt(spentKobo) >= toInt(ceilingKobo);
}

/** UTC calendar-day key (YYYY-MM-DD) for a moment — the day the ceiling scopes to. */
export function utcDayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** Start-of-UTC-day ISO string — the lower bound for "spent today" queries. */
export function utcDayStartIso(now: Date): string {
  return `${utcDayKey(now)}T00:00:00.000Z`;
}
