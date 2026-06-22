import { test } from "node:test";
import assert from "node:assert/strict";

import {
  createLinesBoard,
  initialLinesState,
  isConnected,
  onyxLines,
  type LinesBoard,
} from "../catalog/onyx-lines";
import type { GameMove, GameState, PlayerSeat, Seat } from "../types";
import { makePrng } from "../fairness/prng";
import {
  bestLinesMove,
  bridgeCount,
  chooseLinesMove,
  LINES_DIFFICULTIES,
  savebridgeReply,
  type LinesTier,
} from "../ai/onyx-lines-ai";

const SEAT0 = 1;
const SEAT1 = 2;
const PLAYERS: PlayerSeat[] = [
  { userId: "a", seat: 0 },
  { userId: "b", seat: 1 },
];

// makePrng folds a HEX seed; non-hex chars are ignored (would collapse every seed
// to the same generator). Always seed with hex — this is what real callers do
// (randomSeedHex / crypto-hex freshSeed).
function hseed(n: number): string {
  return (((n + 1) * 0x9e3779b9) >>> 0).toString(16).padStart(8, "0");
}

function plain(size: number): LinesBoard {
  return createLinesBoard(size, { veinEnabled: false, allowFracture: true });
}
function stateWith(board: LinesBoard, toMove: Seat): GameState {
  return { gameId: "onyx-lines", seats: PLAYERS, toMove, seq: 0, phase: "active", winnerSeat: null, board, fairness: null };
}
const cellOf = (m: GameMove) => m.cell as { r: number; c: number };

test("bridgeCount detects an uncuttable two-carrier bridge", () => {
  const b = plain(11);
  b.cells[3]![3] = SEAT0;
  b.cells[4]![4] = SEAT0; // bridge with carriers (4,3) & (3,4), both empty
  assert.equal(bridgeCount(b, SEAT0), 1);
  b.cells[4]![3] = SEAT1; // intrude one carrier → bridge broken
  assert.equal(bridgeCount(b, SEAT0), 0);
});

test("savebridge: when the opponent intrudes a carrier, the AI restores the other (Even+)", () => {
  const b = plain(11);
  b.cells[3]![3] = SEAT0;
  b.cells[4]![4] = SEAT0;
  b.cells[4]![3] = SEAT1; // opponent just took carrier (4,3)
  assert.deepEqual(savebridgeReply(b, 0, { r: 4, c: 3 }), { r: 3, c: 4 });
  const move = chooseLinesMove(stateWith(b, 0), 0, { tier: "even", prng: makePrng(hseed(1)), lastMove: { r: 4, c: 3 } });
  assert.equal(move.type, "place");
  assert.deepEqual(cellOf(move), { r: 3, c: 4 });
});

test("every tier always takes an immediate win, across many seeds (variety never throws a win)", () => {
  const b = plain(3);
  b.cells[0]![0] = SEAT0;
  b.cells[2]![0] = SEAT0; // seat 0 wins by playing (1,0)
  for (const tier of LINES_DIFFICULTIES) {
    for (let s = 0; s < 8; s += 1) {
      const move = chooseLinesMove(stateWith(b, 0), 0, { tier, prng: makePrng(hseed(s)) });
      const after = plain(3);
      after.cells[0]![0] = SEAT0;
      after.cells[2]![0] = SEAT0;
      const cell = cellOf(move);
      after.cells[cell.r]![cell.c] = SEAT0;
      assert.equal(isConnected(after, 0), true, `tier ${tier} seed ${s} failed to take the win`);
    }
  }
});

test("calibration ladder: Even+ ALWAYS block a connect-in-one; Gentle sometimes MISSES it (honest easy)", () => {
  // seat 1 (left↔right) threatens to connect by playing (0,1)
  function blockBoard(): LinesBoard {
    const b = plain(3);
    b.cells[0]![0] = SEAT1;
    b.cells[0]![2] = SEAT1;
    return b;
  }
  for (const tier of ["even", "sharp", "expert"] as LinesTier[]) {
    for (let s = 0; s < 6; s += 1) {
      const move = chooseLinesMove(stateWith(blockBoard(), 0), 0, { tier, prng: makePrng(hseed(s)) });
      assert.deepEqual(cellOf(move), { r: 0, c: 1 }, `${tier} must block`);
    }
  }
  // Gentle must FAIL to block at least once over many seeds → genuinely beatable
  let misses = 0;
  for (let s = 0; s < 30; s += 1) {
    const move = chooseLinesMove(stateWith(blockBoard(), 0), 0, { tier: "gentle", prng: makePrng(hseed(s)) });
    const cell = cellOf(move);
    if (!(cell.r === 0 && cell.c === 1)) misses += 1;
  }
  assert.ok(misses > 0, "Gentle should sometimes miss the block (honest easy)");
});

test("determinism: same seed → identical move; variety: different seeds → ≥2 distinct openings", () => {
  const st = stateWith(plain(11), 0);
  // determinism
  const a = chooseLinesMove(st, 0, { tier: "novice", prng: makePrng(hseed(42)) });
  const b = chooseLinesMove(st, 0, { tier: "novice", prng: makePrng(hseed(42)) });
  assert.deepEqual(a, b);
  // variety across seeds (opening book / softmax)
  const seen = new Set<string>();
  for (let s = 0; s < 10; s += 1) {
    const m = chooseLinesMove(st, 0, { tier: "novice", prng: makePrng(hseed(s)) });
    const c = cellOf(m);
    seen.add(`${c.r},${c.c}`);
  }
  assert.ok(seen.size >= 2, `expected varied openings, got ${seen.size}`);
});

test("swap (pie rule): seat 1 claims a strong central opener, declines a weak corner one", () => {
  const strong = plain(11);
  strong.cells[5]![5] = SEAT0;
  strong.placements = 1;
  const swap = chooseLinesMove(stateWith(strong, 1), 1, { tier: "even", prng: makePrng(hseed(7)) });
  assert.equal(swap.type, "swap");

  const weak = plain(11);
  weak.cells[0]![0] = SEAT0;
  weak.placements = 1;
  const decline = chooseLinesMove(stateWith(weak, 1), 1, { tier: "even", prng: makePrng(hseed(7)) });
  assert.equal(decline.type, "place");
});

test("hint: bestLinesMove classifies win-now and block correctly", () => {
  const win = plain(3);
  win.cells[0]![0] = SEAT0;
  win.cells[2]![0] = SEAT0;
  const h1 = bestLinesMove(stateWith(win, 0), 0);
  assert.equal(h1.reason, "win-now");
  assert.deepEqual(h1.cell, { r: 1, c: 0 });

  const block = plain(3);
  block.cells[0]![0] = SEAT1;
  block.cells[0]![2] = SEAT1;
  const h2 = bestLinesMove(stateWith(block, 0), 0);
  assert.equal(h2.reason, "block");
  assert.deepEqual(h2.cell, { r: 0, c: 1 });
});

test("performance: Expert returns a legal move within budget on a mid-game 11×11", () => {
  const b = createLinesBoard(11); // vein on
  // sprinkle a realistic mid-game
  const stones: [number, number, number][] = [
    [5, 5, SEAT0], [5, 6, SEAT0], [6, 5, SEAT1], [4, 6, SEAT1],
    [6, 6, SEAT0], [3, 7, SEAT1], [7, 4, SEAT0], [4, 4, SEAT1],
  ];
  for (const [r, c, v] of stones) b.cells[r]![c] = v;
  const t0 = Date.now();
  const move = chooseLinesMove(stateWith(b, 0), 0, { tier: "expert", prng: makePrng(hseed(99)) });
  const elapsed = Date.now() - t0;
  assert.ok(onyxLines.validateMove(stateWith(b, 0), move, 0).ok, "expert move must be legal");
  assert.ok(elapsed < 800, `expert move took ${elapsed}ms`);
});

test("strength: Sharp decisively beats Gentle in self-play (small board)", () => {
  // Sharp = seat 0 (first-move advantage + skill); Gentle = seat 1. Expect Sharp to win.
  let state = initialLinesState(PLAYERS, { size: 7, veinEnabled: false });
  const prng0 = makePrng(hseed(1));
  const prng1 = makePrng(hseed(2));
  let last: { r: number; c: number } | null = null;
  for (let ply = 0; ply < 100 && state.phase === "active"; ply += 1) {
    const seat = state.toMove as Seat;
    const tier: LinesTier = seat === 0 ? "sharp" : "gentle";
    const move = chooseLinesMove(state, seat, { tier, prng: seat === 0 ? prng0 : prng1, lastMove: last });
    assert.ok(onyxLines.validateMove(state, move, seat).ok, `illegal self-play move at ply ${ply}`);
    if (move.cell) last = move.cell as { r: number; c: number };
    state = onyxLines.applyMove(state, move, seat);
  }
  assert.equal(state.phase, "complete", "self-play game should finish");
  assert.equal(state.winnerSeat, 0, "Sharp (seat 0) should beat Gentle (seat 1)");
});
