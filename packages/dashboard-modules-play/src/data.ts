import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import { resolveGamingAdminClient } from "@henryco/gaming-arena/server";
import { GAME_IDS, getGame } from "@henryco/gaming-arena";

/**
 * Module-local data layer for the play (Henry Onyx Live) home widgets.
 *
 * Every read here is read-only and degrades to an empty/locked snapshot
 * on any failure — the home grid must never 500 because the arena is
 * dark or a gaming read times out.
 *
 * IMPORTANT — flag-dark by default. The free-play arena ships "off" in
 * production: live data (`gaming_profiles`, the `get_gaming_leaderboard`
 * RPC) is only loaded when the arena is BOTH flag-enabled AND operable.
 * This mirrors the live page (`apps/account/app/(account)/play/page.tsx`)
 * which renders the practice/learn foyer with no metrics until
 * `isGamingArenaReady()` is true. We replicate that capability gate here
 * (rather than importing the app's `@/lib/gaming/*`, which is not a
 * shared package) so the module behaves identically: calm entry-point
 * when dark, real ranked metrics once the owner flips the flag.
 */

export type PlayGame = {
  id: (typeof GAME_IDS)[number];
  skillWeight: number;
};

export type PlayProfileView = {
  handle: string;
  rating: number;
  wins: number;
  losses: number;
  ties: number;
};

export type PlayLeaderboardEntry = {
  handle: string;
  rating: number;
};

export type PlaySnapshot = {
  /** True only when the arena flag is set AND persistence is configured. */
  ready: boolean;
  /** The viewer's ranked profile, or null when they have not played yet. */
  profile: PlayProfileView | null;
  /** Public leaderboard (top players). Empty until matches are recorded. */
  leaderboard: ReadonlyArray<PlayLeaderboardEntry>;
  /** The arena's game catalog (static, always available). */
  games: ReadonlyArray<PlayGame>;
};

/**
 * Free-play activation flag. Mirrors
 * `apps/account/lib/gaming/arena-flag.ts:isGamingArenaEnabled`.
 */
function isGamingArenaEnabled(): boolean {
  return (
    process.env.GAMING_ARENA_ENABLED === "1" ||
    process.env.GAMING_ARENA_ENABLED === "true"
  );
}

/**
 * Persistence + service-role write path must be configured. Mirrors
 * `apps/account/lib/gaming/arena-flag.ts:isGamingPersistenceConfigured`.
 */
function isGamingPersistenceConfigured(): boolean {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * The arena is OFFERED only when it is also operable. Mirrors
 * `apps/account/lib/gaming/arena-flag.ts:isGamingArenaReady`. Production
 * leaves the flag unset, so this is `false` and the module surfaces the
 * calm entry-point widget only.
 */
export function isPlayArenaReady(): boolean {
  return isGamingArenaEnabled() && isGamingPersistenceConfigured();
}

const ARENA_GAMES: ReadonlyArray<PlayGame> = GAME_IDS.map((id) => ({
  id,
  skillWeight: getGame(id).skillWeight,
}));

function asProfile(
  row: Record<string, unknown> | null | undefined,
): PlayProfileView | null {
  if (!row) return null;
  return {
    handle: String(row.handle ?? "player"),
    rating: Number(row.rating ?? 1200),
    wins: Number(row.wins ?? 0),
    losses: Number(row.losses ?? 0),
    ties: Number(row.ties ?? 0),
  };
}

/**
 * Build the play snapshot for the current viewer.
 *
 * Returns `null` for non-customer viewers (owner/staff lanes), matching
 * the data-layer gate convention in the marketplace/wallet modules:
 * `gaming_profiles` is a user-scoped table that only has rows for
 * customer-lane viewers. The entry-point widget is rendered by the
 * module manifest regardless, so non-customer viewers still see the
 * arena's calm entry point — they just get no ranked metrics.
 *
 * When the arena is dark (`isPlayArenaReady() === false`, the production
 * default) the snapshot is returned with `ready: false` and no metrics —
 * NO live tables are touched.
 */
export async function loadPlaySnapshot(
  viewer: UnifiedViewer,
): Promise<PlaySnapshot | null> {
  if (viewer.kind !== "customer") return null;

  if (!isPlayArenaReady()) {
    return { ready: false, profile: null, leaderboard: [], games: ARENA_GAMES };
  }

  const resolved = resolveGamingAdminClient();
  if (!resolved.ok) {
    return { ready: false, profile: null, leaderboard: [], games: ARENA_GAMES };
  }

  const client = resolved.client;
  const userId = viewer.user.id;

  // Mirrors apps/account/lib/gaming/play-module.ts:getPlayModuleData.
  const [profileRes, leaderboardRes] = await Promise.all([
    client
      .from("gaming_profiles")
      .select("handle,rating,wins,losses,ties")
      .eq("user_id", userId)
      .maybeSingle()
      .then((r) => r, () => ({ data: null })),
    client.rpc("get_gaming_leaderboard", { p_limit: 10 }).then(
      (r) => r,
      () => ({ data: null }),
    ),
  ]);

  const profile = asProfile(profileRes.data as Record<string, unknown> | null);

  const rawBoard = leaderboardRes.data;
  const leaderboard: PlayLeaderboardEntry[] = Array.isArray(rawBoard)
    ? (rawBoard as Array<Record<string, unknown>>)
        .map((row) => {
          const p = asProfile(row);
          return p ? { handle: p.handle, rating: p.rating } : null;
        })
        .filter((row): row is PlayLeaderboardEntry => row !== null)
    : [];

  return { ready: true, profile, leaderboard, games: ARENA_GAMES };
}

/**
 * True when the snapshot has real ranked content worth surfacing as
 * metric widgets (a profile or at least one leaderboard row). When this
 * is false the module shows the calm entry-point widget instead — never
 * fabricated zeros dressed up as stats.
 */
export function hasRankedContent(snapshot: PlaySnapshot | null): boolean {
  if (!snapshot || !snapshot.ready) return false;
  return Boolean(snapshot.profile) || snapshot.leaderboard.length > 0;
}
