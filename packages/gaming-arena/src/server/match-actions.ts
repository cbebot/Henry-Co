import "server-only";

/**
 * Match orchestrators — the server-authoritative execution layer.
 *
 * THE anti-cheat chokepoint is submitMove: it loads authoritative state, runs
 * the PURE validator server-side, rejects illegal moves (state never advances),
 * and decides the winner server-side via resolveOutcome — NEVER a client claim.
 * Every write goes through a grant-locked SECDEF RPC the client cannot reach.
 *
 * Callers (apps/account server actions) MUST pass a server-resolved `userId`
 * (from the authenticated session) — never a client-supplied id.
 */

import { logger } from "@henryco/observability";
import { emitEvent } from "@henryco/observability/events";

import { getGame } from "../catalog/index";
import { commitSeed, deriveDrawSeed } from "../fairness/commit-reveal";
import { randomSeedHex, sha256, stableStringify } from "../fairness/web-crypto";
import { applyElo, resultForSeatA } from "../rating/elo";
import { assertMatchTransition } from "../state/state-machine";
import { GamingError, MoveRejectedError } from "../errors";
import type { GameId, GameMove, MatchStatus, Seat } from "../types";
import {
  abandonMatchRow,
  applyMoveRow,
  insertMatch,
  joinMatchRow,
  loadMatch,
  startMatchRow,
} from "./persistence";
import type { GamingDbClient } from "./supabase";

const log = logger.child({ module: "gaming.match-actions" });

export type CreateMatchResult = { matchId: string; commitment: string | null };
export type JoinResult =
  | { joined: false; reason: "already_in_match" | "match_full" }
  | { joined: true; started: boolean; matchId: string };
export type SubmitMoveResult =
  | { applied: true; status: MatchStatus; winnerSeat: Seat | null; newSeq: number | null }
  | { applied: false; reason: "stale_or_conflict" };

/** Create a free-play match and seat the creator (seat 0). RNG games commit a seed. */
export async function createMatch(
  client: GamingDbClient,
  input: { gameId: GameId; createdBy: string; clientSeed?: string },
): Promise<CreateMatchResult> {
  const game = getGame(input.gameId);
  let serverSeed: string | null = null;
  let commitment: string | null = null;
  if (game.usesRandomness) {
    serverSeed = randomSeedHex();
    commitment = await commitSeed(serverSeed); // PUBLISHED before any move
  }
  const matchId = await insertMatch(client, {
    gameId: input.gameId,
    createdBy: input.createdBy,
    commitment,
    serverSeed,
    usesRandomness: game.usesRandomness,
    clientSeed: input.clientSeed ?? randomSeedHex(),
  });
  emitEvent({
    name: "henry.gaming.match.created",
    classification: "user_action",
    outcome: "started",
    actorId: input.createdBy,
    traceId: matchId,
    payload: { game_id: input.gameId },
  });
  emitEvent({
    name: "henry.gaming.session.started",
    classification: "user_action",
    outcome: "started",
    actorId: input.createdBy,
    payload: { game_id: input.gameId },
  });
  return { matchId, commitment };
}

/** Join an open match; when it fills, START it (derive draw seed, build state). */
export async function joinAndMaybeStart(
  client: GamingDbClient,
  input: { matchId: string; userId: string; clientSeed?: string },
): Promise<JoinResult> {
  const join = await joinMatchRow(client, {
    matchId: input.matchId,
    userId: input.userId,
    clientSeed: input.clientSeed ?? randomSeedHex(),
  });
  if (!join.joined) {
    return { joined: false, reason: join.full ? "match_full" : "already_in_match" };
  }
  if (!join.full) {
    return { joined: true, started: false, matchId: input.matchId };
  }

  // Both seats present -> start the match (matchmaking -> in_progress).
  const match = await loadMatch(client, input.matchId);
  if (!match) throw new GamingError("match_not_found", "match not found after join");
  const game = getGame(match.gameId);
  const seat0 = match.players.find((p) => p.seat === 0);
  const seat1 = match.players.find((p) => p.seat === 1);
  if (!seat0 || !seat1) throw new GamingError("match_not_found", "incomplete seating at start");

  let drawSeed = "";
  if (game.usesRandomness && match.serverSeed) {
    drawSeed = await deriveDrawSeed(match.serverSeed, [
      seat0.clientSeed ?? "",
      seat1.clientSeed ?? "",
    ]);
  }
  const state = game.initialState(drawSeed, [
    { userId: seat0.userId, seat: 0 },
    { userId: seat1.userId, seat: 1 },
  ]);

  assertMatchTransition(match.status, "in_progress"); // in-process mirror of the DB guard
  await startMatchRow(client, { matchId: input.matchId, state, drawSeed: drawSeed || null });

  emitEvent({
    name: "henry.gaming.match.started",
    classification: "system_state",
    outcome: "started",
    actorId: input.userId,
    traceId: input.matchId,
    payload: { game_id: match.gameId },
  });
  emitEvent({
    name: "henry.gaming.session.started",
    classification: "user_action",
    outcome: "started",
    actorId: input.userId,
    payload: { game_id: match.gameId },
  });
  return { joined: true, started: true, matchId: input.matchId };
}

/**
 * THE chokepoint. Validate server-side; persist via the grant-locked RPC; decide
 * the winner server-side. A hostile client cannot forge a move or an outcome.
 */
export async function submitMove(
  client: GamingDbClient,
  input: { matchId: string; userId: string; move: GameMove },
): Promise<SubmitMoveResult> {
  const match = await loadMatch(client, input.matchId);
  if (!match) throw new GamingError("match_not_found", "match not found");
  if (match.status !== "in_progress") throw new MoveRejectedError("match_not_active");

  // resolve the actor's seat from the SERVER-RESOLVED userId — never the client's claim
  const seatRow = match.players.find((p) => p.userId === input.userId);
  if (!seatRow) throw new MoveRejectedError("not_a_participant");
  const seat: Seat = seatRow.seat;

  const state = match.state;
  if (!state) throw new GamingError("match_not_found", "match has no authoritative state");
  const game = getGame(match.gameId);

  // 1) PURE validation, server-side. Illegal -> reject, state never advances.
  const validation = game.validateMove(state, input.move, seat);
  if (!validation.ok) throw new MoveRejectedError(validation.reason);

  // 2) apply + recompute the authoritative state hash (the replay/audit binding)
  const newState = game.applyMove(state, input.move, seat);
  const stateHash = await sha256(stableStringify(newState));

  // 3) winner decided SERVER-SIDE from the recomputed state — never a client claim
  const outcome = game.resolveOutcome(newState);
  const terminal = newState.phase === "complete";
  const newStatus: MatchStatus = terminal ? "completed" : "in_progress";
  const winnerSeat: Seat | null = terminal && outcome.kind === "win" ? outcome.winnerSeat : null;
  const winnerUserId =
    winnerSeat !== null ? (match.players.find((p) => p.seat === winnerSeat)?.userId ?? null) : null;
  assertMatchTransition(match.status, newStatus);

  // On a terminal move, compute Elo NOW so the RPC records ratings + the
  // completion in ONE atomic transaction (a crash can't strand stats).
  const seat0 = match.players.find((p) => p.seat === 0);
  const seat1 = match.players.find((p) => p.seat === 1);
  let rating0: number | null = null;
  let rating1: number | null = null;
  let result0: number | null = null;
  let ratingDelta0 = 0;
  if (terminal && seat0 && seat1) {
    const r0 = resultForSeatA(winnerSeat); // 0 | 0.5 | 1
    const elo = applyElo(seat0.rating, seat1.rating, r0);
    rating0 = elo.ratingA;
    rating1 = elo.ratingB;
    result0 = r0;
    ratingDelta0 = elo.ratingA - seat0.rating;
  }

  // 4) persist via the optimistic-mutex RPC (exactly one move per turn wins);
  //    on completion this atomically records ratings/stats too.
  const result = await applyMoveRow(client, {
    matchId: input.matchId,
    expectedSeq: state.seq,
    seat,
    actor: input.userId,
    move: input.move,
    newState,
    stateHash,
    newStatus,
    winnerUserId,
    rating0,
    rating1,
    resultForSeat0: result0,
  });
  if (!result.applied) return { applied: false, reason: "stale_or_conflict" };

  // 5) observability on completion (the DB already recorded the result atomically)
  if (terminal) {
    emitEvent({
      name: "henry.gaming.match.completed",
      classification: "system_state",
      outcome: "completed",
      actorId: input.userId,
      traceId: input.matchId,
      payload: { game_id: match.gameId, result: winnerSeat === null ? "tie" : "win" },
    });
    emitEvent({
      name: "henry.gaming.profile.updated",
      classification: "system_state",
      outcome: "updated",
      actorId: seat0?.userId,
      payload: { rating_delta: ratingDelta0 },
    });
  }

  return { applied: true, status: newStatus, winnerSeat, newSeq: result.newSeq };
}

/** Leave / forfeit. Pass-1 free play: marked abandoned, no rating penalty. */
export async function abandonMatch(
  client: GamingDbClient,
  input: { matchId: string; userId: string },
): Promise<{ abandoned: boolean }> {
  const match = await loadMatch(client, input.matchId);
  if (!match) throw new GamingError("match_not_found", "match not found");
  if (match.status === "completed" || match.status === "abandoned") {
    return { abandoned: false };
  }
  assertMatchTransition(match.status, "abandoned");
  await abandonMatchRow(client, { matchId: input.matchId, actor: input.userId });
  emitEvent({
    name: "henry.gaming.match.abandoned",
    classification: "system_state",
    outcome: "removed",
    actorId: input.userId,
    traceId: input.matchId,
    payload: { game_id: match.gameId },
  });
  return { abandoned: true };
}
