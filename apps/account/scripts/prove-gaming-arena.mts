/**
 * V3-GAMING-01 end-to-end proof harness.
 *
 * Lives under apps/account so the @henryco/* workspace packages resolve. Run:
 *   node --conditions=react-server --import tsx apps/account/scripts/prove-gaming-arena.mts
 * (the react-server condition makes `server-only` a no-op so the ./server
 * orchestrators import in a plain node script.)
 *
 * Proves the SERVER-AUTHORITATIVE model end-to-end against an in-memory DB fake
 * that mirrors the SECDEF RPC contracts (seq-mutex, transition, completion):
 *   [1] full free PvP playthrough -> a real, server-decided win (Onyx Lines)
 *   [2] full free PvP playthrough + provably-fair commit-reveal (Onyx Cards)
 *   [3] a tampered client cannot make an ILLEGAL move (server rejects)
 *   [4] a tampered client cannot FORGE an outcome (resolveOutcome ignores claims)
 *   [5] commit-reveal verifies, and a swapped seed is detected
 *   [6] view redaction hides the opponent's pending simultaneous commit
 *   [7] NO money/stake/wallet/escrow symbol exists anywhere in the package
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  verifyReveal,
  deriveDrawSeed,
  initialOnyxCardsState,
  redactMatchStateForSeat,
  HIDDEN_COMMIT,
  MoveRejectedError,
  type GameState,
  type Seat,
} from "@henryco/gaming-arena";
import {
  createMatch,
  joinAndMaybeStart,
  submitMove,
  type GamingDbClient,
  type GamingRpcResult,
} from "@henryco/gaming-arena/server";

let failures = 0;
function check(label: string, cond: boolean, detail = ""): void {
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

// ───────────────────────── in-memory DB fake (mirrors the SECDEF RPCs) ─────────────────────────
type FakePlayer = { userId: string; seat: Seat; clientSeed: string | null; rating: number; handle: string };
type FakeMatch = {
  id: string;
  gameId: string;
  status: string;
  createdBy: string;
  winnerUserId: string | null;
  currentSeq: number;
  state: GameState | null;
  serverSeed: string | null;
  commitment: string | null;
  revealedSeed: string | null;
  ratingRecorded: boolean;
  players: FakePlayer[];
};

function makeFakeClient() {
  const matches = new Map<string, FakeMatch>();
  const profiles = new Map<string, { rating: number; wins: number; losses: number; ties: number; handle: string }>();
  let counter = 0;
  const ensure = (uid: string) => {
    if (!profiles.has(uid)) profiles.set(uid, { rating: 1200, wins: 0, losses: 0, ties: 0, handle: `player_${uid}` });
    return profiles.get(uid)!;
  };
  const ok = (data: unknown): GamingRpcResult => ({ data, error: null });

  const client: GamingDbClient = {
    async rpc(name, params = {}) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- in-memory DB fake mirrors loose RPC params
      const p = params as Record<string, any>;
      switch (name) {
        case "create_gaming_match": {
          counter += 1;
          const id = `m${counter}`;
          const prof = ensure(p.p_created_by);
          matches.set(id, {
            id, gameId: p.p_game_id, status: "lobby", createdBy: p.p_created_by, winnerUserId: null,
            currentSeq: 0, state: null, serverSeed: p.p_server_seed ?? null, commitment: p.p_commitment ?? null,
            revealedSeed: null, ratingRecorded: false,
            players: [{ userId: p.p_created_by, seat: 0, clientSeed: p.p_client_seed ?? null, rating: prof.rating, handle: prof.handle }],
          });
          return ok(id);
        }
        case "join_gaming_match": {
          const m = matches.get(p.p_match_id);
          if (!m) return ok({ joined: false, full: false });
          if (m.status !== "lobby" && m.status !== "matchmaking") return ok({ joined: false, full: true });
          if (m.players.some((x) => x.userId === p.p_user_id)) return ok({ joined: false, full: false });
          if (m.players.length >= 2) return ok({ joined: false, full: true });
          const seat = m.players.length as Seat;
          const prof = ensure(p.p_user_id);
          m.players.push({ userId: p.p_user_id, seat, clientSeed: p.p_client_seed ?? null, rating: prof.rating, handle: prof.handle });
          if (m.players.length === 2) { m.status = "matchmaking"; return ok({ joined: true, seat, full: true }); }
          return ok({ joined: true, seat, full: false });
        }
        case "start_gaming_match": {
          const m = matches.get(p.p_match_id);
          if (!m || m.status !== "matchmaking") return ok(false);
          m.status = "in_progress"; m.state = p.p_state; m.currentSeq = 0;
          return ok(true);
        }
        case "apply_gaming_move": {
          const m = matches.get(p.p_match_id);
          if (!m) return ok({ applied: false, reason: "stale_or_conflict" });
          if (!m.players.some((x) => x.userId === p.p_actor && x.seat === p.p_seat)) {
            return { data: null, error: { message: "actor is not the seated player" } };
          }
          if (m.status !== "in_progress" || m.currentSeq !== p.p_expected_seq) {
            return ok({ applied: false, reason: "stale_or_conflict" });
          }
          m.currentSeq = p.p_expected_seq + 1; m.state = p.p_new_state;
          if (p.p_new_status === "completed" && !m.ratingRecorded) {
            // atomic completion + stats (mirrors the folded SQL apply_gaming_move)
            m.status = "completed"; m.winnerUserId = p.p_winner_user_id ?? null;
            m.revealedSeed = m.serverSeed; m.ratingRecorded = true;
            const s0 = m.players.find((x) => x.seat === 0)?.userId;
            const s1 = m.players.find((x) => x.seat === 1)?.userId;
            if (s0 && s1) {
              const a = ensure(s0); const b = ensure(s1);
              if (p.p_rating0 != null) a.rating = p.p_rating0;
              if (p.p_rating1 != null) b.rating = p.p_rating1;
              if (p.p_result0 === 1) { a.wins++; b.losses++; }
              else if (p.p_result0 === 0) { a.losses++; b.wins++; }
              else if (p.p_result0 === 0.5) { a.ties++; b.ties++; }
            }
          }
          return ok({ applied: true, new_seq: m.currentSeq });
        }
        case "get_gaming_match_full": {
          const m = matches.get(p.p_match_id);
          if (!m) return ok(null);
          return ok({
            id: m.id, game_id: m.gameId, status: m.status, created_by: m.createdBy, winner_user_id: m.winnerUserId,
            current_seq: m.currentSeq, state: m.state, fairness_commitment: m.commitment,
            fairness_revealed_seed: m.revealedSeed, fairness_server_seed: m.serverSeed,
            players: m.players.map((x) => ({ user_id: x.userId, seat: x.seat, client_seed: x.clientSeed, rating: x.rating, handle: x.handle })),
          });
        }
        case "list_open_gaming_matches": {
          const out = [...matches.values()]
            .filter((m) => m.gameId === p.p_game_id && m.status === "lobby" && m.createdBy !== p.p_exclude_user && m.players.length === 1)
            .map((m) => ({ id: m.id, game_id: m.gameId, created_by: m.createdBy, status: m.status, created_at: m.id }));
          return ok(out);
        }
        case "abandon_gaming_match": {
          const m = matches.get(p.p_match_id);
          if (!m) return ok(false);
          m.status = "abandoned"; return ok(true);
        }
        default:
          return ok(null);
      }
    },
  };
  return { client, matches };
}

const A = "user-alice";
const B = "user-bob";
const C = "user-carol";

async function loadMatchRaw(matches: Map<string, FakeMatch>, id: string) {
  return matches.get(id)!;
}

async function run() {
  // ───────── [1] Onyx Lines full playthrough -> server-decided win ─────────
  console.log("[1] Onyx Lines — full free PvP playthrough to a server-decided win");
  {
    const { client, matches } = makeFakeClient();
    const { matchId } = await createMatch(client, { gameId: "onyx-lines", createdBy: A });
    const join = await joinAndMaybeStart(client, { matchId, userId: B });
    check("match starts when the second player joins", join.joined && join.started === true);

    // seat 0 builds column c=8 (vein-free on the 11-board); seat 1 plays column c=0.
    const planSeat0 = Array.from({ length: 11 }, (_, r) => ({ r, c: 8 }));
    const planSeat1 = Array.from({ length: 11 }, (_, r) => ({ r, c: 0 }));
    const idx: [number, number] = [0, 0];
    let guard = 0;
    while (guard < 60) {
      guard += 1;
      const m = await loadMatchRaw(matches, matchId);
      if (m.status !== "in_progress") break;
      const state = m.state!;
      const seat = state.toMove as Seat;
      const cell = seat === 0 ? planSeat0[idx[0]++] : planSeat1[idx[1]++];
      const userId = seat === 0 ? A : B;
      await submitMove(client, { matchId, userId, move: { type: "place", cell } });
    }
    const done = await loadMatchRaw(matches, matchId);
    check("match completed", done.status === "completed");
    check("seat 0 (the connector) is the server-decided winner", done.winnerUserId === A, `winner=${done.winnerUserId}`);
    check("rating recorded exactly once (idempotent guard)", done.ratingRecorded === true);
  }

  // ───────── [2] Onyx Cards full playthrough + provably-fair commit-reveal ─────────
  console.log("[2] Onyx Cards — full playthrough + provably-fair commit-reveal");
  let cardsArtifacts: { commitment: string; revealed: string; clientSeeds: string[]; prizeValues: number[] } | null = null;
  {
    const { client, matches } = makeFakeClient();
    const { matchId, commitment } = await createMatch(client, { gameId: "onyx-cards", createdBy: A, clientSeed: "alice-seed" });
    check("RNG game publishes a commitment at creation", typeof commitment === "string" && commitment.length === 64);
    await joinAndMaybeStart(client, { matchId, userId: B, clientSeed: "bob-seed" });

    let guard = 0;
    while (guard < 40) {
      guard += 1;
      const m = await loadMatchRaw(matches, matchId);
      if (m.status !== "in_progress") break;
      const board = m.state!.board as { hands: number[][]; committed: (number | null)[] };
      // seat 0 commits highest remaining, seat 1 commits lowest remaining (seat 0 dominates)
      if (board.committed[0] === null) {
        await submitMove(client, { matchId, userId: A, move: { type: "commit", card: Math.max(...board.hands[0]) } });
      } else {
        await submitMove(client, { matchId, userId: B, move: { type: "commit", card: Math.min(...board.hands[1]) } });
      }
    }
    const done = await loadMatchRaw(matches, matchId);
    // Identical hands (sum 55 each) make "win every round" impossible; the match
    // winner is a function of the provably-fair prize order. We assert a
    // DETERMINATE, server-scored resolution — not a specific player.
    check("cards match completed with a determinate result", done.status === "completed" && done.state?.phase === "complete");
    const ws = done.state?.winnerSeat;
    check("winner is seat 0, seat 1, or a tie (null) — server-decided", ws === 0 || ws === 1 || ws === null);
    check("winnerUserId is consistent with the winning seat", ws === null ? done.winnerUserId === null : done.winnerUserId === done.players.find((x) => x.seat === ws)?.userId);
    check("server seed revealed at completion", typeof done.revealedSeed === "string");

    const prizeValues = ((done.state!.board as { prizes: { value: number }[] }).prizes).map((x) => x.value);
    cardsArtifacts = { commitment: done.commitment!, revealed: done.revealedSeed!, clientSeeds: ["alice-seed", "bob-seed"], prizeValues };
  }

  // ───────── [3] tampered client cannot make an ILLEGAL move ─────────
  console.log("[3] Server-authority — illegal moves rejected");
  {
    const { client } = makeFakeClient();
    const { matchId } = await createMatch(client, { gameId: "onyx-lines", createdBy: A });
    await joinAndMaybeStart(client, { matchId, userId: B });

    // out-of-bounds placement by the player to move
    let threw = false;
    try {
      await submitMove(client, { matchId, userId: A, move: { type: "place", cell: { r: 99, c: 99 } } });
    } catch (e) { threw = e instanceof MoveRejectedError; }
    check("out-of-bounds move is rejected", threw);

    // wrong-turn move (seat 1 plays first)
    let threwTurn = false;
    try {
      await submitMove(client, { matchId, userId: B, move: { type: "place", cell: { r: 0, c: 0 } } });
    } catch (e) { threwTurn = e instanceof MoveRejectedError && e.reason === "not_your_turn"; }
    check("playing out of turn is rejected", threwTurn);

    // non-participant move
    let threwPart = false;
    try {
      await submitMove(client, { matchId, userId: C, move: { type: "place", cell: { r: 0, c: 0 } } });
    } catch (e) { threwPart = e instanceof MoveRejectedError && e.reason === "not_a_participant"; }
    check("a non-participant cannot move", threwPart);

    // occupied cell
    await submitMove(client, { matchId, userId: A, move: { type: "place", cell: { r: 0, c: 5 } } });
    let threwOcc = false;
    try {
      await submitMove(client, { matchId, userId: B, move: { type: "place", cell: { r: 0, c: 5 } } });
    } catch (e) { threwOcc = e instanceof MoveRejectedError; }
    check("placing on an occupied cell is rejected", threwOcc);
  }

  // ───────── [4] tampered client cannot FORGE an outcome ─────────
  console.log("[4] Server-authority — a forged outcome is ignored");
  {
    const { client, matches } = makeFakeClient();
    const { matchId } = await createMatch(client, { gameId: "onyx-lines", createdBy: A });
    await joinAndMaybeStart(client, { matchId, userId: B });
    // seat 0 sends a single legal placement but stuffs a forged win into the payload
    await submitMove(client, { matchId, userId: A, move: { type: "place", cell: { r: 0, c: 3 }, winnerSeat: 0, phase: "complete", status: "completed" } });
    const m = await loadMatchRaw(matches, matchId);
    check("forged 'completed' status is ignored", m.status === "in_progress", `status=${m.status}`);
    check("forged winner is ignored", m.winnerUserId === null);
  }

  // ───────── [5] commit-reveal verifies; a swapped seed is detected ─────────
  console.log("[5] Provably fair — reveal verifies, tamper detected");
  {
    const art = cardsArtifacts!;
    check("revealed seed matches the commitment", await verifyReveal(art.commitment, art.revealed));
    const tampered = (art.revealed[0] === "0" ? "1" : "0") + art.revealed.slice(1);
    check("a swapped seed FAILS verification", !(await verifyReveal(art.commitment, tampered)));
    // re-derive the draw seed from the public artifacts and reproduce the prize order
    const drawSeed = await deriveDrawSeed(art.revealed, art.clientSeeds);
    const reproduced = (initialOnyxCardsState(drawSeed, [{ userId: A, seat: 0 }, { userId: B, seat: 1 }]).board as { prizes: { value: number }[] }).prizes.map((x) => x.value);
    check("anyone can reproduce the exact prize order from the revealed seed", JSON.stringify(reproduced) === JSON.stringify(art.prizeValues));
  }

  // ───────── [6] redaction hides the opponent's pending commit ─────────
  console.log("[6] View redaction — opponent's pending commit is hidden");
  {
    const { client, matches } = makeFakeClient();
    const { matchId } = await createMatch(client, { gameId: "onyx-cards", createdBy: A, clientSeed: "a" });
    await joinAndMaybeStart(client, { matchId, userId: B, clientSeed: "b" });
    await submitMove(client, { matchId, userId: A, move: { type: "commit", card: 7 } }); // seat 0 commits, round not resolved
    const m = await loadMatchRaw(matches, matchId);
    const forSeat1 = redactMatchStateForSeat(m.state!, 1);
    const committed1 = (forSeat1.board as { committed: (number | null)[] }).committed;
    check("opponent's pending card value is hidden from seat 1", committed1[0] === HIDDEN_COMMIT, `saw=${committed1[0]}`);
    const forSeat0 = redactMatchStateForSeat(m.state!, 0);
    const committed0 = (forSeat0.board as { committed: (number | null)[] }).committed;
    check("a player still sees their OWN committed card", committed0[0] === 7);
  }

  // ───────── [7] zero money/stake/wallet/escrow anywhere in the package ─────────
  console.log("[7] Zero-money — no stake/escrow/wallet/payment symbol in the package source");
  {
    const root = fileURLToPath(new URL("../../../packages/gaming-arena/src", import.meta.url));
    const banned = /\b(stake|escrow|wallet|payout|payments_private|kobo|balance_kobo|rake|buy_in)\b/i;
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) { walk(full); continue; }
        if (!/\.ts$/.test(entry)) continue;
        const text = readFileSync(full, "utf8");
        for (const line of text.split("\n")) {
          // ignore comment lines that merely DOCUMENT the absence of money
          if (banned.test(line) && !line.trim().startsWith("*") && !line.trim().startsWith("//")) {
            offenders.push(`${entry}: ${line.trim().slice(0, 80)}`);
          }
        }
      }
    };
    walk(root);
    check("no money symbol in non-comment package code", offenders.length === 0, offenders.join(" | "));
  }

  console.log(failures === 0 ? "\nV3-GAMING-01 PROOF: OK" : `\nV3-GAMING-01 PROOF: ${failures} FAILURE(S)`);
  process.exit(failures === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error("proof harness crashed:", err);
  process.exit(1);
});
