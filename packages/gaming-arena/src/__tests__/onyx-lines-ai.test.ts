import { test } from "node:test";
import assert from "node:assert/strict";

import {
  createLinesBoard,
  isConnected,
  onyxLines,
  type LinesBoard,
} from "../catalog/onyx-lines";
import type { GameState, Seat } from "../types";
import {
  chooseLinesMove,
  completionDistance,
  detectLinesThreat,
  LINES_DIFFICULTIES,
} from "../ai/onyx-lines-ai";

/** Build an active Onyx Lines state around a hand-made board. */
function stateWith(board: LinesBoard, toMove: Seat): GameState {
  return {
    gameId: "onyx-lines",
    seats: [
      { userId: "you", seat: 0 },
      { userId: "ai", seat: 1 },
    ],
    toMove,
    seq: 0,
    phase: "active",
    winnerSeat: null,
    board,
    fairness: null,
  };
}

/** A clean (no vein, no fracture) board of the given size for deterministic setups. */
function plainBoard(size: number): LinesBoard {
  return createLinesBoard(size, { veinEnabled: false, allowFracture: false });
}

const SEAT0 = 1;
const SEAT1 = 2;

test("completionDistance is 0 for an already-connected seat", () => {
  const b = plainBoard(3);
  b.cells[0]![0] = SEAT0;
  b.cells[1]![0] = SEAT0;
  b.cells[2]![0] = SEAT0; // full column 0 → top connects bottom for seat 0
  assert.equal(completionDistance(b, 0), 0);
});

test("completionDistance counts empty cells still needed to connect", () => {
  const b = plainBoard(3);
  b.cells[0]![0] = SEAT0;
  b.cells[2]![0] = SEAT0; // one gap at (1,0) closes the link
  assert.equal(completionDistance(b, 0), 1);
});

test("completionDistance on an empty board equals the board span", () => {
  const b = plainBoard(3);
  assert.equal(completionDistance(b, 0), 3); // one stone per row to cross 3 rows
});

test("chooseLinesMove takes an immediate winning placement", () => {
  const b = plainBoard(3);
  b.cells[0]![0] = SEAT0;
  b.cells[2]![0] = SEAT0; // seat 0 wins by playing (1,0)
  const move = chooseLinesMove(stateWith(b, 0), 0, "even");
  assert.equal(move.type, "place");
  // apply the chosen placement and assert it connects seat 0
  const after = plainBoard(3);
  after.cells[0]![0] = SEAT0;
  after.cells[2]![0] = SEAT0;
  const cell = move.cell as { r: number; c: number };
  after.cells[cell.r]![cell.c] = SEAT0;
  assert.equal(isConnected(after, 0), true);
});

test("chooseLinesMove blocks the opponent's immediate winning cell", () => {
  const b = plainBoard(3);
  b.cells[0]![0] = SEAT1;
  b.cells[0]![2] = SEAT1; // seat 1 (left↔right) wins next by playing (0,1)
  // seat 0 to move, no win of its own → must block at (0,1)
  const move = chooseLinesMove(stateWith(b, 0), 0, "even");
  assert.equal(move.type, "place");
  assert.deepEqual(move.cell, { r: 0, c: 1 });
});

test("detectLinesThreat reports the opponent's connect-in-one cell", () => {
  const b = plainBoard(3);
  b.cells[0]![0] = SEAT1;
  b.cells[0]![2] = SEAT1;
  const threat = detectLinesThreat(stateWith(b, 0), 0);
  assert.ok(threat, "expected a threat");
  assert.deepEqual(threat.cell, { r: 0, c: 1 });
});

test("detectLinesThreat is null when the opponent is more than one move away", () => {
  const b = plainBoard(5);
  b.cells[0]![0] = SEAT1; // a lone stone is nowhere near connecting
  assert.equal(detectLinesThreat(stateWith(b, 0), 0), null);
});

test("chooseLinesMove never returns an illegal move on the full vein board", () => {
  // initial 11×11 board carries the vein blockers; every difficulty must place legally
  for (const difficulty of LINES_DIFFICULTIES) {
    const b = createLinesBoard(11); // vein on, fracture on
    const move = chooseLinesMove(stateWith(b, 0), 0, difficulty);
    const v = onyxLines.validateMove(stateWith(b, 0), move, 0);
    assert.equal(v.ok, true, `illegal move at difficulty ${difficulty}: ${JSON.stringify(move)}`);
  }
});
