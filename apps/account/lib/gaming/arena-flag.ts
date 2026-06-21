import "server-only";

/**
 * GAMING-ARENA — free-play activation gate. Mirrors
 * apps/marketplace/lib/checkout/card-rail.ts: an `enabled` predicate (raw flag)
 * + a `ready` predicate (flag AND every operability dependency), so a
 * misconfigured env can never half-activate the arena.
 *
 * The FREE foundation has NO money/legal gate (no consideration + no prize = not
 * gambling), so readiness checks ONLY realtime + persistence, never a payments DB.
 * Production leaves GAMING_ARENA_ENABLED unset -> the arena stays dark.
 */
export function isGamingArenaEnabled(): boolean {
  return process.env.GAMING_ARENA_ENABLED === "1" || process.env.GAMING_ARENA_ENABLED === "true";
}

/** Persistence + service-role write path must be configured. */
export function isGamingPersistenceConfigured(): boolean {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Realtime needs the public client envs for the per-match channel to connect. */
export function isGamingRealtimeConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** The arena is OFFERED only when it is also operable. Use at match-start / CTA. */
export function isGamingArenaReady(): boolean {
  return isGamingArenaEnabled() && isGamingPersistenceConfigured();
}
