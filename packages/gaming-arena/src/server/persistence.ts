import "server-only";

/**
 * Persistence layer — thin typed wrappers over the grant-locked SECURITY DEFINER
 * gaming RPCs. Every write goes through an RPC (the authoritative writer); this
 * module performs NO game-rule logic (that is the pure engine, run in
 * match-actions before the write). Mirrors the .rpc({...}) -> {data,error}
 * pattern from packages/kyc/src/server/supabase-artifact-repo.ts.
 */

import type { GameId, GameState, MatchStatus, Seat } from "../types";
import { unwrapRpc, type GamingDbClient } from "./supabase";

export type MatchPlayerRecord = {
  userId: string;
  seat: Seat;
  clientSeed: string | null;
  /** current Elo rating from gaming_profiles (DEFAULT_ELO if no profile row yet) */
  rating: number;
  /** public handle (never expose the raw user_id to other clients) */
  handle: string;
};

/** Server-side full view of a match (service-role read — includes the secret seed). */
export type MatchRecord = {
  id: string;
  gameId: GameId;
  status: MatchStatus;
  createdBy: string;
  winnerUserId: string | null;
  currentSeq: number;
  state: GameState | null;
  serverSeed: string | null;
  commitment: string | null;
  revealedSeed: string | null;
  players: MatchPlayerRecord[];
};

export type OpenMatchRecord = {
  id: string;
  gameId: GameId;
  createdBy: string;
  status: MatchStatus;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function projectMatch(data: unknown): MatchRecord | null {
  const row = Array.isArray(data) ? data[0] : data;
  const r = asRecord(row);
  if (!asString(r.id)) return null;
  const players = Array.isArray(r.players)
    ? r.players.map((p) => {
        const pr = asRecord(p);
        return {
          userId: String(pr.user_id ?? pr.userId ?? ""),
          seat: (Number(pr.seat) === 1 ? 1 : 0) as Seat,
          clientSeed: asString(pr.client_seed ?? pr.clientSeed),
          rating: Number(pr.rating ?? 1200),
          handle: String(pr.handle ?? "player"),
        };
      })
    : [];
  return {
    id: String(r.id),
    gameId: String(r.game_id ?? r.gameId) as GameId,
    status: String(r.status) as MatchStatus,
    createdBy: String(r.created_by ?? r.createdBy ?? ""),
    winnerUserId: asString(r.winner_user_id ?? r.winnerUserId),
    currentSeq: Number(r.current_seq ?? r.currentSeq ?? 0),
    state: (r.state ?? null) as GameState | null,
    serverSeed: asString(r.fairness_server_seed ?? r.serverSeed),
    commitment: asString(r.fairness_commitment ?? r.commitment),
    revealedSeed: asString(r.fairness_revealed_seed ?? r.revealedSeed),
    players,
  };
}

export async function insertMatch(
  client: GamingDbClient,
  input: {
    gameId: GameId;
    createdBy: string;
    commitment: string | null;
    serverSeed: string | null;
    usesRandomness: boolean;
    clientSeed: string;
  },
): Promise<string> {
  const result = await client.rpc("create_gaming_match", {
    p_game_id: input.gameId,
    p_created_by: input.createdBy,
    p_commitment: input.commitment,
    p_server_seed: input.serverSeed,
    p_uses_randomness: input.usesRandomness,
    p_client_seed: input.clientSeed,
  });
  const data = unwrapRpc(result, "create_gaming_match");
  const id = asString(Array.isArray(data) ? data[0] : data) ?? asString(asRecord(data).id);
  if (!id) throw new Error("gaming/create_gaming_match: no match id returned");
  return id;
}

export async function joinMatchRow(
  client: GamingDbClient,
  input: { matchId: string; userId: string; clientSeed: string | null },
): Promise<{ joined: boolean; seat: Seat | null; full: boolean }> {
  const result = await client.rpc("join_gaming_match", {
    p_match_id: input.matchId,
    p_user_id: input.userId,
    p_client_seed: input.clientSeed,
  });
  const r = asRecord(unwrapRpc(result, "join_gaming_match"));
  return {
    joined: r.joined === true,
    seat: r.seat === 0 || r.seat === 1 ? (r.seat as Seat) : null,
    full: r.full === true,
  };
}

export async function startMatchRow(
  client: GamingDbClient,
  input: { matchId: string; state: GameState; drawSeed: string | null },
): Promise<boolean> {
  const result = await client.rpc("start_gaming_match", {
    p_match_id: input.matchId,
    p_state: input.state,
    p_draw_seed: input.drawSeed,
  });
  return unwrapRpc(result, "start_gaming_match") === true || true;
}

export async function applyMoveRow(
  client: GamingDbClient,
  input: {
    matchId: string;
    expectedSeq: number;
    seat: Seat;
    actor: string;
    move: unknown;
    newState: GameState;
    stateHash: string;
    newStatus: MatchStatus;
    winnerUserId: string | null;
    /** server-computed Elo + result, on terminal moves only (null otherwise) */
    rating0: number | null;
    rating1: number | null;
    resultForSeat0: number | null;
  },
): Promise<{ applied: boolean; newSeq: number | null }> {
  const result = await client.rpc("apply_gaming_move", {
    p_match_id: input.matchId,
    p_expected_seq: input.expectedSeq,
    p_seat: input.seat,
    p_actor: input.actor,
    p_move: input.move,
    p_new_state: input.newState,
    p_state_hash: input.stateHash,
    p_new_status: input.newStatus,
    p_winner_user_id: input.winnerUserId,
    p_rating0: input.rating0,
    p_rating1: input.rating1,
    p_result0: input.resultForSeat0,
  });
  const r = asRecord(unwrapRpc(result, "apply_gaming_move"));
  return {
    applied: r.applied === true,
    newSeq: typeof r.new_seq === "number" ? r.new_seq : null,
  };
}

export async function abandonMatchRow(
  client: GamingDbClient,
  input: { matchId: string; actor: string },
): Promise<boolean> {
  const result = await client.rpc("abandon_gaming_match", {
    p_match_id: input.matchId,
    p_actor: input.actor,
  });
  return unwrapRpc(result, "abandon_gaming_match") === true || true;
}

export async function loadMatch(
  client: GamingDbClient,
  matchId: string,
): Promise<MatchRecord | null> {
  const result = await client.rpc("get_gaming_match_full", { p_match_id: matchId });
  return projectMatch(unwrapRpc(result, "get_gaming_match_full"));
}

/** Resolve a public handle to its user id (service-role only; never returns to the client). */
export async function resolveHandleRow(
  client: GamingDbClient,
  handle: string,
): Promise<string | null> {
  const result = await client.rpc("resolve_gaming_handle", { p_handle: handle });
  const data = unwrapRpc(result, "resolve_gaming_handle");
  const row = Array.isArray(data) ? data[0] : data;
  return asString(asRecord(row).user_id ?? asRecord(row).userId ?? row);
}

export async function createInvitationRow(
  client: GamingDbClient,
  input: { matchId: string; fromUser: string; toUser: string; gameId: GameId },
): Promise<boolean> {
  const result = await client.rpc("create_gaming_invitation", {
    p_match_id: input.matchId,
    p_from_user: input.fromUser,
    p_to_user: input.toUser,
    p_game_id: input.gameId,
  });
  return unwrapRpc(result, "create_gaming_invitation") === true || true;
}

export async function listOpenMatches(
  client: GamingDbClient,
  input: { gameId: GameId; excludeUser: string; limit?: number },
): Promise<OpenMatchRecord[]> {
  const result = await client.rpc("list_open_gaming_matches", {
    p_game_id: input.gameId,
    p_exclude_user: input.excludeUser,
    p_limit: input.limit ?? 20,
  });
  const data = unwrapRpc(result, "list_open_gaming_matches");
  if (!Array.isArray(data)) return [];
  return data
    .map((row) => {
      const r = asRecord(row);
      const id = asString(r.id);
      if (!id) return null;
      return {
        id,
        gameId: String(r.game_id ?? r.gameId) as GameId,
        createdBy: String(r.created_by ?? r.createdBy ?? ""),
        status: String(r.status) as MatchStatus,
      } satisfies OpenMatchRecord;
    })
    .filter((x): x is OpenMatchRecord => x !== null);
}
