import "server-only";

import { resolveGamingAdminClient } from "@henryco/gaming-arena/server";

export type GamingProfileView = {
  handle: string;
  rating: number;
  wins: number;
  losses: number;
  ties: number;
};

export type PlayModuleData = {
  profile: GamingProfileView | null;
  leaderboard: GamingProfileView[];
};

function asProfile(row: Record<string, unknown> | null | undefined): GamingProfileView | null {
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
 * Per-user arena summary for the landing page: the viewer's profile + the public
 * leaderboard. Returns empty/null on any failure — the page degrades to a
 * branded empty-state, never a 500 (the read is wrapped in withTimeout upstream).
 */
export async function getPlayModuleData(userId: string): Promise<PlayModuleData> {
  const resolved = resolveGamingAdminClient();
  if (!resolved.ok) return { profile: null, leaderboard: [] };
  const client = resolved.client;

  const [profileRes, leaderboardRes] = await Promise.all([
    client
      .from("gaming_profiles")
      .select("handle,rating,wins,losses,ties")
      .eq("user_id", userId)
      .maybeSingle(),
    client.rpc("get_gaming_leaderboard", { p_limit: 10 }),
  ]);

  const profile = asProfile(profileRes.data as Record<string, unknown> | null);
  const rawBoard = leaderboardRes.data;
  const leaderboard = Array.isArray(rawBoard)
    ? (rawBoard as Array<Record<string, unknown>>)
        .map((r) => asProfile(r))
        .filter((p): p is GamingProfileView => p !== null)
    : [];

  return { profile, leaderboard };
}
