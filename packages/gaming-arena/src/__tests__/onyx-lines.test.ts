import test from "node:test";
import assert from "node:assert/strict";

import {
  onyxLines,
  initialLinesState,
  isConnected,
  veinCells,
  createLinesBoard,
  type LinesBoard,
} from "../catalog/onyx-lines";
import type { GameMove, GameState, PlayerSeat, Seat } from "../types";

const PLAYERS: PlayerSeat[] = [
  { userId: "u0", seat: 0 },
  { userId: "u1", seat: 1 },
];

function play(state: GameState, move: GameMove, seat: Seat): GameState {
  const v = onyxLines.validateMove(state, move, seat);
  assert.ok(v.ok, `expected legal move ${JSON.stringify(move)}, got reason=${v.ok ? "" : v.reason}`);
  return onyxLines.applyMove(state, move, seat);
}

function place(r: number, c: number): GameMove {
  return { type: "place", cell: { r, c } };
}

test("seat 0 wins by connecting top to bottom (a full column)", () => {
  let state = initialLinesState(PLAYERS, { size: 5, veinEnabled: false, allowFracture: false });
  // seat0 builds column c=2; seat1 plays harmless col-0 cells (never reaches col4)
  state = play(state, place(0, 2), 0);
  state = play(state, place(0, 0), 1);
  state = play(state, place(1, 2), 0);
  state = play(state, place(1, 0), 1);
  state = play(state, place(2, 2), 0);
  state = play(state, place(2, 0), 1);
  state = play(state, place(3, 2), 0);
  state = play(state, place(3, 0), 1);
  // not yet won before the final stone
  assert.equal(state.phase, "active");
  state = play(state, place(4, 2), 0);
  assert.equal(state.phase, "complete");
  assert.equal(state.winnerSeat, 0);
  assert.deepEqual(onyxLines.resolveOutcome(state), { kind: "win", winnerSeat: 0 });
  assert.equal(state.toMove, null);
});

test("isConnected: a hand-built winning chain for each seat", () => {
  const size = 3;
  const b0: LinesBoard = createLinesBoard(size, { veinEnabled: false });
  b0.cells = [
    [1, 0, 0],
    [1, 0, 0],
    [1, 0, 0],
  ];
  assert.equal(isConnected(b0, 0), true, "seat0 col connects top->bottom");
  assert.equal(isConnected(b0, 1), false);

  const b1: LinesBoard = createLinesBoard(size, { veinEnabled: false });
  b1.cells = [
    [2, 2, 2],
    [0, 0, 0],
    [0, 0, 0],
  ];
  assert.equal(isConnected(b1, 1), true, "seat1 row connects left->right");
  assert.equal(isConnected(b1, 0), false);
});

test("server authority: illegal moves are rejected (turn, occupancy, bounds)", () => {
  const state = initialLinesState(PLAYERS, { size: 5, veinEnabled: false, allowFracture: false });
  // not your turn (seat0 opens)
  assert.deepEqual(onyxLines.validateMove(state, place(0, 0), 1), {
    ok: false,
    reason: "not_your_turn",
  });
  // out of bounds
  assert.deepEqual(onyxLines.validateMove(state, place(9, 9), 0), {
    ok: false,
    reason: "out_of_bounds",
  });
  // occupy then re-occupy
  const after = play(state, place(0, 0), 0);
  assert.deepEqual(onyxLines.validateMove(after, place(0, 0), 1), {
    ok: false,
    reason: "cell_occupied",
  });
  // malformed
  assert.deepEqual(onyxLines.validateMove(state, { type: "place" }, 0), {
    ok: false,
    reason: "malformed_cell",
  });
  assert.deepEqual(onyxLines.validateMove(state, { type: "teleport" }, 0), {
    ok: false,
    reason: "unknown_move_type",
  });
});

test("server authority: a client cannot FORGE a win via extra move fields", () => {
  let state = initialLinesState(PLAYERS, { size: 5, veinEnabled: false, allowFracture: false });
  state = play(state, place(0, 2), 0);
  // hostile client tries to declare itself the winner inside the move payload
  const forged: GameMove = {
    type: "place",
    cell: { r: 0, c: 0 },
    winnerSeat: 1,
    phase: "complete",
  };
  const v = onyxLines.validateMove(state, forged, 1);
  assert.equal(v.ok, true); // it IS a legal place — but the forged fields are inert
  const next = onyxLines.applyMove(state, forged, 1);
  assert.equal(next.phase, "active", "forged 'phase' field is ignored");
  assert.equal(next.winnerSeat, null, "forged 'winnerSeat' field is ignored");
  assert.deepEqual(onyxLines.resolveOutcome(next), { kind: "ongoing" });
});

test("swap rule: seat 1 may claim seat 0's opening stone", () => {
  let state = initialLinesState(PLAYERS, { size: 5, veinEnabled: false, allowFracture: false });
  // swap not available before any stone / for seat0
  assert.equal(onyxLines.validateMove(state, { type: "swap" }, 0).ok, false);
  state = play(state, place(2, 2), 0);
  state = play(state, { type: "swap" }, 1);
  const board = state.board as LinesBoard;
  assert.equal(board.cells[2]![2], 2, "the opening stone is now seat1's");
  assert.equal(board.swapped, true);
  assert.equal(state.toMove, 0, "turn passes back to seat 0");
  // swap cannot be used twice
  assert.equal(onyxLines.validateMove(state, { type: "swap" }, 1).ok, false);
});

test("fracture: convert an opponent stone anchored by two of your own", () => {
  let state = initialLinesState(PLAYERS, { size: 5, veinEnabled: false, allowFracture: true });
  state = play(state, place(1, 1), 0); // seat0
  state = play(state, place(2, 1), 1); // seat1 (will be the fracture target — adj to (1,1) & (1,2))
  state = play(state, place(1, 2), 0); // seat0 — now (2,1) is adjacent to two seat0 stones
  state = play(state, place(4, 4), 1); // seat1 harmless
  // fracture needs two anchors — a lone-anchor target is rejected
  assert.equal(
    onyxLines.validateMove(state, { type: "fracture", cell: { r: 4, c: 4 } }, 0).ok,
    false,
  );
  state = play(state, { type: "fracture", cell: { r: 2, c: 1 } }, 0);
  const board = state.board as LinesBoard;
  assert.equal(board.cells[2]![1], 3, "fractured cell becomes a neutral blocker");
  assert.equal(board.fractureUsed[0], true);
  // cannot fracture twice
  state = play(state, place(0, 0), 1);
  assert.equal(
    onyxLines.validateMove(state, { type: "fracture", cell: { r: 0, c: 0 } }, 0).ok,
    false,
  );
});

test("no-draw: a fully-filled clean board resolves to a winner, never a tie", () => {
  let state = initialLinesState(PLAYERS, { size: 3, veinEnabled: false, allowFracture: false });
  // greedily fill the first empty cell for whoever's turn it is until terminal
  for (let guard = 0; guard < 20 && state.phase === "active"; guard += 1) {
    const board = state.board as LinesBoard;
    const seat = state.toMove as Seat;
    let placed = false;
    for (let r = 0; r < board.size && !placed; r += 1) {
      for (let c = 0; c < board.size && !placed; c += 1) {
        if (board.cells[r]![c] === 0) {
          state = play(state, place(r, c), seat);
          placed = true;
        }
      }
    }
    if (!placed) break;
  }
  const outcome = onyxLines.resolveOutcome(state);
  assert.equal(outcome.kind, "win", "Hex topology guarantees exactly one connection");
});

test("the vein is a small, fixed, off-centre set of blockers on the default board", () => {
  const cells = veinCells(11);
  assert.ok(cells.length >= 1 && cells.length <= 3);
  const board = onyxLines.initialState("ignored-seed", PLAYERS).board as LinesBoard;
  for (const { r, c } of cells) {
    assert.equal(board.cells[r]![c], 3, "vein cell is pre-blocked");
  }
});
