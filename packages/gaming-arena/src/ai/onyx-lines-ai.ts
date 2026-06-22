/**
 * Onyx Lines — world-class on-device opponent (PURE, client-safe).
 *
 * Onyx Lines is zero-RNG perfect-information, so a genuine bot is strong
 * heuristics + lookahead over the same pure rules. The strength (and the fix
 * for "one predictable line you can cheat") comes from three layers:
 *
 *   1. EVALUATION — completion distance (a 0-1 BFS: own=0, empty=1, wall=∞) with
 *      explicit BRIDGE CREDIT, so the bot values uncuttable two-path connections,
 *      not just the shortest fragile thread a shortest-path bot chases.
 *   2. VIRTUAL CONNECTIONS — immediate-win detection, mandatory SAVEBRIDGE replies,
 *      and unique-block detection: the bot never lets a bridge be cut for free and
 *      always answers a connect-in-one threat (Even+).
 *   3. SEARCH — iterative-deepening alpha-beta over a pruned move set (cells near
 *      stones ∪ bridge carriers), so it looks ahead (ladders, double threats).
 *
 * UNPREDICTABILITY: a per-game seeded PRNG drives an opening book, a chosen
 * persona (weight perturbation), and softmax sampling over near-best moves — so
 * the same seed reproduces a game (tests stay deterministic) but every real game
 * differs and cannot be memorised. The PRNG is AI-internal; Onyx Lines remains
 * usesRandomness:false and the seed never touches GameState.fairness.
 *
 * Forced correctness (own immediate win; Even+ block/savebridge) is NEVER
 * softmaxed or blundered away — variety colours only the positional move.
 */
import type { GameMove, GameState, Seat } from "../types";
import { isConnected, type LinesBoard } from "../catalog/onyx-lines";
import { makePrng } from "../fairness/prng";
import { randomSeedHex } from "../fairness/web-crypto";

export type LinesTier = "gentle" | "novice" | "even" | "sharp" | "expert";
export const LINES_DIFFICULTIES: readonly LinesTier[] = ["gentle", "novice", "even", "sharp", "expert"];

export type LinesCellRef = { r: number; c: number };
export type LinesAiOpts = {
  tier: LinesTier;
  prng: () => number;
  now?: () => number;
  lastMove?: LinesCellRef | null;
};

const EMPTY = 0;
const SEAT0 = 1;
const SEAT1 = 2;
const INF = 9999;
const MATE = 1_000_000;
const BRIDGE_CREDIT = 0.55; // a bridge is worth a little under one free stone of progress

const seatValue = (seat: Seat): number => (seat === 0 ? SEAT0 : SEAT1);
const other = (seat: Seat): Seat => (seat === 0 ? 1 : 0);

const HEX_DELTAS: ReadonlyArray<readonly [number, number]> = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [1, -1],
];

type Cfg = {
  depth: number;
  tau: number;
  topK: number;
  blunder: number;
  vc: boolean;
  book: boolean;
  persona: boolean;
  wallMs: number;
  nodeCap: number;
};

const TIERS: Record<LinesTier, Cfg> = {
  gentle: { depth: 1, tau: 2.0, topK: 8, blunder: 0.25, vc: false, book: false, persona: false, wallMs: 30, nodeCap: 6000 },
  novice: { depth: 1, tau: 1.0, topK: 6, blunder: 0.1, vc: false, book: true, persona: true, wallMs: 30, nodeCap: 9000 },
  even: { depth: 3, tau: 0.5, topK: 5, blunder: 0.03, vc: true, book: true, persona: true, wallMs: 70, nodeCap: 45000 },
  sharp: { depth: 4, tau: 0.25, topK: 4, blunder: 0.0, vc: true, book: true, persona: true, wallMs: 130, nodeCap: 90000 },
  expert: { depth: 6, tau: 0.08, topK: 3, blunder: 0.0, vc: true, book: true, persona: false, wallMs: 230, nodeCap: 130000 },
};

// persona feature weights [ownAdvance, blockOpp, bridge, centre]
type Weights = { own: number; block: number; bridge: number; centre: number };
const BEST_W: Weights = { own: 1.0, block: 1.0, bridge: 1.0, centre: 0.25 };
const PERSONAS: Weights[] = [
  { own: 1.4, block: 0.7, bridge: 1.0, centre: 0.2 }, // racer
  { own: 0.8, block: 1.5, bridge: 1.0, centre: 0.22 }, // warden
  { own: 1.0, block: 1.0, bridge: 1.5, centre: 0.28 }, // cartographer
  { own: 1.1, block: 1.0, bridge: 1.3, centre: 0.18 }, // trickster
];

// ----------------------------------------------------------------------------
// board helpers
// ----------------------------------------------------------------------------
function inBounds(board: LinesBoard, r: number, c: number): boolean {
  return r >= 0 && r < board.size && c >= 0 && c < board.size;
}

function listEmpty(board: LinesBoard): LinesCellRef[] {
  const out: LinesCellRef[] = [];
  for (let r = 0; r < board.size; r += 1) {
    for (let c = 0; c < board.size; c += 1) {
      if (board.cells[r]![c] === EMPTY) out.push({ r, c });
    }
  }
  return out;
}

function withStone(board: LinesBoard, cell: LinesCellRef, value: number): LinesBoard {
  const cells = board.cells.map((row) => row.slice());
  cells[cell.r]![cell.c] = value;
  return { ...board, cells };
}

function centrality(cell: LinesCellRef, size: number): number {
  const mid = (size - 1) / 2;
  return -(Math.abs(cell.r - mid) + Math.abs(cell.c - mid));
}

// ----------------------------------------------------------------------------
// completion distance (KEPT — powers the hint + coach + eval). 0-1 BFS.
// ----------------------------------------------------------------------------
export function completionDistance(board: LinesBoard, seat: Seat): number {
  const { size, cells } = board;
  const val = seatValue(seat);
  const dist: number[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => INF));
  const cost = (r: number, c: number): number => {
    const v = cells[r]![c];
    if (v === val) return 0;
    if (v === EMPTY) return 1;
    return INF;
  };
  const deque: LinesCellRef[] = [];
  for (let i = 0; i < size; i += 1) {
    const r = seat === 0 ? 0 : i;
    const c = seat === 0 ? i : 0;
    const k = cost(r, c);
    if (k !== INF && k < dist[r]![c]!) {
      dist[r]![c] = k;
      if (k === 0) deque.unshift({ r, c });
      else deque.push({ r, c });
    }
  }
  while (deque.length > 0) {
    const { r, c } = deque.shift()!;
    const d = dist[r]![c]!;
    for (const [dr, dc] of HEX_DELTAS) {
      const nr = r + dr!;
      const nc = c + dc!;
      if (!inBounds(board, nr, nc)) continue;
      const k = cost(nr, nc);
      if (k === INF) continue;
      const nd = d + k;
      if (nd < dist[nr]![nc]!) {
        dist[nr]![nc] = nd;
        if (k === 0) deque.unshift({ r: nr, c: nc });
        else deque.push({ r: nr, c: nc });
      }
    }
  }
  let best = INF;
  for (let i = 0; i < size; i += 1) {
    const r = seat === 0 ? size - 1 : i;
    const c = seat === 0 ? i : size - 1;
    if (dist[r]![c]! < best) best = dist[r]![c]!;
  }
  return best;
}

export function detectLinesThreat(state: GameState, mySeat: Seat): { cell: LinesCellRef } | null {
  const board = state.board as LinesBoard;
  const opp = other(mySeat);
  for (const cell of listEmpty(board)) {
    if (isConnected(withStone(board, cell, seatValue(opp)), opp)) return { cell };
  }
  return null;
}

// ----------------------------------------------------------------------------
// virtual connections — bridges
// ----------------------------------------------------------------------------
/** The two carrier cells of the bridge between a stone and the cell two steps away. */
const BRIDGE_SHAPES: ReadonlyArray<{ d: readonly [number, number]; carriers: ReadonlyArray<readonly [number, number]> }> = [
  { d: [1, 1], carriers: [[1, 0], [0, 1]] },
  { d: [-1, -1], carriers: [[-1, 0], [0, -1]] },
  { d: [2, -1], carriers: [[1, 0], [1, -1]] },
  { d: [-2, 1], carriers: [[-1, 0], [-1, 1]] },
  { d: [1, -2], carriers: [[0, -1], [1, -1]] },
  { d: [-1, 2], carriers: [[0, 1], [-1, 1]] },
];

/** All bridges of `seatVal`: own stone ↔ own stone two apart with both carriers empty. */
export function bridgeCount(board: LinesBoard, seatVal: number): number {
  let n = 0;
  for (let r = 0; r < board.size; r += 1) {
    for (let c = 0; c < board.size; c += 1) {
      if (board.cells[r]![c] !== seatVal) continue;
      for (const shape of BRIDGE_SHAPES) {
        const br = r + shape.d[0]!;
        const bc = c + shape.d[1]!;
        if (!inBounds(board, br, bc) || board.cells[br]![bc] !== seatVal) continue;
        // count each bridge once (only when the partner is "after" this stone)
        if (br < r || (br === r && bc < c)) continue;
        const [c1, c2] = shape.carriers;
        const c1r = r + c1![0]!;
        const c1c = c + c1![1]!;
        const c2r = r + c2![0]!;
        const c2c = c + c2![1]!;
        if (
          inBounds(board, c1r, c1c) &&
          inBounds(board, c2r, c2c) &&
          board.cells[c1r]![c1c] === EMPTY &&
          board.cells[c2r]![c2c] === EMPTY
        ) {
          n += 1;
        }
      }
    }
  }
  return n;
}

/** If `lastOppMove` intruded into one carrier of a bridge of `mySeat`, the saving carrier. */
export function savebridgeReply(board: LinesBoard, mySeat: Seat, lastOppMove: LinesCellRef | null | undefined): LinesCellRef | null {
  if (!lastOppMove) return null;
  const myVal = seatValue(mySeat);
  const oppVal = seatValue(other(mySeat));
  if (board.cells[lastOppMove.r]![lastOppMove.c] !== oppVal) return null;
  for (let r = 0; r < board.size; r += 1) {
    for (let c = 0; c < board.size; c += 1) {
      if (board.cells[r]![c] !== myVal) continue;
      for (const shape of BRIDGE_SHAPES) {
        const br = r + shape.d[0]!;
        const bc = c + shape.d[1]!;
        if (!inBounds(board, br, bc) || board.cells[br]![bc] !== myVal) continue;
        const carriers = shape.carriers.map((cr) => ({ r: r + cr[0]!, c: c + cr[1]! }));
        if (carriers.some((x) => !inBounds(board, x.r, x.c))) continue;
        const intruded = carriers.find((x) => x.r === lastOppMove.r && x.c === lastOppMove.c);
        if (!intruded) continue;
        const saver = carriers.find((x) => !(x.r === lastOppMove.r && x.c === lastOppMove.c));
        if (saver && board.cells[saver.r]![saver.c] === EMPTY) return saver;
      }
    }
  }
  return null;
}

/** A cell that, played by `seat`, connects edge-to-edge right now (immediate win). */
function findImmediateWin(board: LinesBoard, seat: Seat): LinesCellRef | null {
  const val = seatValue(seat);
  for (const cell of listEmpty(board)) {
    if (isConnected(withStone(board, cell, val), seat)) return cell;
  }
  return null;
}

// ----------------------------------------------------------------------------
// evaluation
// ----------------------------------------------------------------------------
/** Position score for `me` (higher = better). Always finite (completion distance gradient). */
function weightedEval(board: LinesBoard, me: Seat, w: Weights): number {
  const opp = other(me);
  const myCD = completionDistance(board, me);
  const oppCD = completionDistance(board, opp);
  if (myCD === 0) return MATE;
  if (oppCD === 0) return -MATE;
  const myBridges = bridgeCount(board, seatValue(me));
  const oppBridges = bridgeCount(board, seatValue(opp));
  let centre = 0;
  for (let r = 0; r < board.size; r += 1) {
    for (let c = 0; c < board.size; c += 1) {
      if (board.cells[r]![c] === seatValue(me)) centre += centrality({ r, c }, board.size);
    }
  }
  return (
    w.own * -(myCD - BRIDGE_CREDIT * myBridges) +
    w.block * (oppCD - BRIDGE_CREDIT * oppBridges) +
    w.bridge * (myBridges - oppBridges) +
    w.centre * (centre / (board.size * board.size))
  );
}

// ----------------------------------------------------------------------------
// search — iterative-deepening alpha-beta (minimax from the root seat's view)
// ----------------------------------------------------------------------------
type Ctx = { nodes: number; cap: number; now: () => number; deadline: number; up: boolean };

/** Pruned candidate moves: empties near a stone ∪ opening cluster. */
function candidateMoves(board: LinesBoard): LinesCellRef[] {
  const N = board.size;
  const hasStone = board.cells.some((row) => row.some((v) => v === SEAT0 || v === SEAT1));
  if (!hasStone) {
    const lo = 3;
    const hi = N - 4;
    const out: LinesCellRef[] = [];
    for (let r = lo; r <= hi; r += 1) for (let c = lo; c <= hi; c += 1) if (board.cells[r]![c] === EMPTY) out.push({ r, c });
    return out.length ? out : listEmpty(board);
  }
  const keep = new Set<string>();
  const add = (r: number, c: number) => {
    if (inBounds(board, r, c) && board.cells[r]![c] === EMPTY) keep.add(`${r},${c}`);
  };
  for (let r = 0; r < N; r += 1) {
    for (let c = 0; c < N; c += 1) {
      if (board.cells[r]![c] === SEAT0 || board.cells[r]![c] === SEAT1) {
        for (let dr = -2; dr <= 2; dr += 1) for (let dc = -2; dc <= 2; dc += 1) add(r + dr, c + dc);
      }
    }
  }
  const out: LinesCellRef[] = [];
  keep.forEach((k) => {
    const [r, c] = k.split(",").map(Number);
    out.push({ r: r!, c: c! });
  });
  return out.length ? out : listEmpty(board);
}

function search(
  board: LinesBoard,
  toMove: Seat,
  rootSeat: Seat,
  depth: number,
  fromRoot: number,
  alpha: number,
  beta: number,
  w: Weights,
  ctx: Ctx,
): number {
  if (isConnected(board, rootSeat)) return MATE - fromRoot;
  if (isConnected(board, other(rootSeat))) return -MATE + fromRoot;
  ctx.nodes += 1;
  if (ctx.nodes > ctx.cap || ((ctx.nodes & 511) === 0 && ctx.now() > ctx.deadline)) {
    ctx.up = true;
    return weightedEval(board, rootSeat, w);
  }
  if (depth === 0) return weightedEval(board, rootSeat, w);

  const val = seatValue(toMove);
  const moves = candidateMoves(board)
    .map((m) => ({ m, s: weightedEval(withStone(board, m, val), rootSeat, w) }))
    .sort((a, b) => (toMove === rootSeat ? b.s - a.s : a.s - b.s))
    .map((x) => x.m);

  if (toMove === rootSeat) {
    let best = -INF * 1000;
    for (const m of moves) {
      const v = search(withStone(board, m, val), other(toMove), rootSeat, depth - 1, fromRoot + 1, alpha, beta, w, ctx);
      if (v > best) best = v;
      if (best > alpha) alpha = best;
      if (alpha >= beta || ctx.up) break;
    }
    return best;
  }
  let best = INF * 1000;
  for (const m of moves) {
    const v = search(withStone(board, m, val), other(toMove), rootSeat, depth - 1, fromRoot + 1, alpha, beta, w, ctx);
    if (v < best) best = v;
    if (best < beta) beta = best;
    if (beta <= alpha || ctx.up) break;
  }
  return best;
}

/** Score every candidate root move at `depth` (iterative-deepening friendly). */
function scoreRootMoves(board: LinesBoard, seat: Seat, depth: number, w: Weights, ctx: Ctx): { cell: LinesCellRef; score: number }[] {
  const val = seatValue(seat);
  const moves = candidateMoves(board);
  const scored = moves.map((m) => {
    const after = withStone(board, m, val);
    const score = isConnected(after, seat)
      ? MATE
      : search(after, other(seat), seat, depth - 1, 1, -INF * 1000, INF * 1000, w, ctx);
    return { cell: m, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

// ----------------------------------------------------------------------------
// move-selection variety: seeded softmax + blunder
// ----------------------------------------------------------------------------
function softmaxPick(scored: { cell: LinesCellRef; score: number }[], tau: number, topK: number, prng: () => number): LinesCellRef {
  if (scored.length === 0) return { r: 0, c: 0 };
  if (tau <= 0.001 || scored.length === 1) {
    const best = scored[0]!.score;
    const ties = scored.filter((s) => Math.abs(s.score - best) < 1e-9);
    return ties[Math.floor(prng() * ties.length)]!.cell;
  }
  const pool = scored.slice(0, Math.max(1, topK));
  const max = pool[0]!.score;
  const weights = pool.map((s) => Math.exp((s.score - max) / (tau * 20)));
  const sum = weights.reduce((a, b) => a + b, 0);
  let roll = prng() * sum;
  for (let i = 0; i < pool.length; i += 1) {
    roll -= weights[i]!;
    if (roll <= 0) return pool[i]!.cell;
  }
  return pool[pool.length - 1]!.cell;
}

function pickPersona(cfg: Cfg, prng: () => number): Weights {
  if (!cfg.persona) return BEST_W;
  return PERSONAS[Math.floor(prng() * PERSONAS.length)]!;
}

// ----------------------------------------------------------------------------
// public API
// ----------------------------------------------------------------------------
function evalSwap(board: LinesBoard, prng: () => number): boolean {
  // seat 1 replying to seat 0's lone opener: swap iff the opener is strong (central) — the pie rule.
  let opener: LinesCellRef | null = null;
  for (let r = 0; r < board.size; r += 1) for (let c = 0; c < board.size; c += 1) if (board.cells[r]![c] === SEAT0) opener = { r, c };
  if (!opener) return false;
  const mid = (board.size - 1) / 2;
  const dist = Math.abs(opener.r - mid) + Math.abs(opener.c - mid);
  const threshold = board.size * 0.35;
  if (dist < threshold) return true;
  if (dist < threshold + 1) return prng() < 0.5;
  return false;
}

/**
 * Choose the AI's move for `seat`. Pass a tier string (back-compat, builds its own
 * seed) or full opts with an injected PRNG (deterministic + varied across games).
 */
export function chooseLinesMove(state: GameState, seat: Seat, optsOrTier: LinesAiOpts | LinesTier): GameMove {
  const opts: LinesAiOpts =
    typeof optsOrTier === "string" ? { tier: optsOrTier, prng: makePrng(randomSeedHex()) } : optsOrTier;
  const { tier, prng } = opts;
  const cfg = TIERS[tier];
  const now = opts.now ?? (() => Date.now());
  const board = state.board as LinesBoard;

  // (0) opening book + swap (seeded) — consume prng in a fixed order.
  // Guard on an actually-empty board (no player stones), not placements===0,
  // so hand-built test positions never hijack the forced-win path below.
  const noStones = !board.cells.some((row) => row.some((v) => v === SEAT0 || v === SEAT1));
  if (cfg.book && seat === 0 && noStones) {
    const opening = candidateMoves(board);
    if (opening.length > 0) return { type: "place", cell: opening[Math.floor(prng() * opening.length)]! };
  }
  if (seat === 1 && board.placements === 1 && !board.swapped) {
    if (evalSwap(board, prng)) return { type: "swap" };
  }

  const persona = pickPersona(cfg, prng);

  // (1) immediate own win — every tier, never thrown away
  const win = findImmediateWin(board, seat);
  if (win) return { type: "place", cell: win };

  // (2) savebridge — Even+ treat as forced
  if (cfg.vc && opts.lastMove) {
    const saver = savebridgeReply(board, seat, opts.lastMove);
    if (saver) return { type: "place", cell: saver };
  }

  // (3) block a connect-in-one threat — forced on Even+; blunderable below
  const threat = detectLinesThreat(state, seat);
  const blunderBlock = !cfg.vc && prng() < cfg.blunder;
  if (threat && !blunderBlock) return { type: "place", cell: threat.cell };

  // (4) positional search → seeded softmax (+ low-tier positional blunder)
  const ctx: Ctx = { nodes: 0, cap: cfg.nodeCap, now, deadline: now() + cfg.wallMs, up: false };
  let scored: { cell: LinesCellRef; score: number }[] = [];
  for (let d = 1; d <= cfg.depth; d += 1) {
    const pass = scoreRootMoves(board, seat, d, persona, ctx);
    if (pass.length) scored = pass;
    if (ctx.up || ctx.nodes > ctx.cap || now() > ctx.deadline) break;
    if (scored.length && Math.abs(scored[0]!.score) >= MATE - 100) break;
  }
  if (scored.length === 0) {
    const empties = listEmpty(board);
    return { type: "place", cell: empties[0] ?? { r: 0, c: 0 } };
  }
  if (cfg.blunder > 0 && prng() < cfg.blunder && scored.length > 2) {
    const worse = scored.slice(Math.ceil(scored.length / 2));
    return { type: "place", cell: worse[Math.floor(prng() * worse.length)]!.cell };
  }
  return { type: "place", cell: softmaxPick(scored, cfg.tau, cfg.topK, prng) };
}

export type HintReason = "win-now" | "block" | "bridge" | "shorten" | "cut";

/** Best move + a one-line WHY category, for the coach's on-demand hint. */
export function bestLinesMove(state: GameState, seat: Seat): { cell: LinesCellRef; reason: HintReason } {
  const board = state.board as LinesBoard;
  const win = findImmediateWin(board, seat);
  if (win) return { cell: win, reason: "win-now" };
  const threat = detectLinesThreat(state, seat);
  if (threat) return { cell: threat.cell, reason: "block" };
  const ctx: Ctx = { nodes: 0, cap: 60000, now: () => Date.now(), deadline: Date.now() + 120, up: false };
  const scored = scoreRootMoves(board, seat, 3, BEST_W, ctx);
  const cell = scored.length ? scored[0]!.cell : listEmpty(board)[0] ?? { r: 0, c: 0 };
  const opp = other(seat);
  const myBefore = completionDistance(board, seat);
  const oppBefore = completionDistance(board, opp);
  const after = withStone(board, cell, seatValue(seat));
  const myDrop = myBefore - completionDistance(after, seat);
  const oppGain = completionDistance(after, opp) - oppBefore;
  const bridgesGained = bridgeCount(after, seatValue(seat)) - bridgeCount(board, seatValue(seat));
  let reason: HintReason = "shorten";
  if (bridgesGained > 0) reason = "bridge";
  else if (oppGain >= myDrop) reason = "cut";
  return { cell, reason };
}
