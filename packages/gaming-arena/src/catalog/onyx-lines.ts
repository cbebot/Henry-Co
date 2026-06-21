/**
 * Onyx Lines — the flagship (GAME-CATALOG.md §1).
 *
 * A two-player connection-strategy game on a rhombic hex board. Seat 0 (Onyx)
 * races to link the top and bottom edges; seat 1 (Alabaster) links left and
 * right. ZERO randomness, perfect information — the strongest skill claim in the
 * catalog and the simplest to build flawlessly: place stone -> validate empty ->
 * append -> recompute connectivity -> maybe terminal.
 *
 * Originality markers, all deterministic / no chance:
 *  - the veined board (a short fixed off-centre run of pre-blocked cells),
 *  - the swap-balance rule (B may claim A's opening stone — removes first-mover edge),
 *  - the fracture action (once per player: convert an opponent stone adjacent to
 *    >=2 of your own into a neutral blocker), with bridge-scoring fallback so a
 *    rare mutual block resolves deterministically, never by chance.
 *
 * Everything here is PURE: identical results on the server (authority) and in a
 * verifier replaying the move log.
 */

import type {
  GameDefinition,
  GameMove,
  GameOutcome,
  GameState,
  MoveValidation,
  PlayerSeat,
  Seat,
} from "../types";

export const ONYX_LINES_DEFAULT_SIZE = 11;

/** Cell occupancy encoding. */
const EMPTY = 0;
const SEAT0 = 1; // Onyx (top<->bottom)
const SEAT1 = 2; // Alabaster (left<->right)
const BLOCKER = 3; // vein or fractured cell (neutral)

type Cell = { r: number; c: number };

export type LinesBoard = {
  size: number;
  /** row-major occupancy grid; values: 0 empty, 1 seat0, 2 seat1, 3 blocker */
  cells: number[][];
  veinEnabled: boolean;
  allowFracture: boolean;
  /** per-seat: has this seat already used its one fracture? */
  fractureUsed: [boolean, boolean];
  /** total placements made (for swap eligibility) */
  placements: number;
  /** whether the swap rule has already been exercised this match */
  swapped: boolean;
};

function readBoard(state: GameState): LinesBoard {
  return state.board as LinesBoard;
}

/** The 6 hex neighbours of (r,c) that are in bounds. */
function neighbors(r: number, c: number, size: number): Cell[] {
  const deltas = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [1, -1],
  ];
  const out: Cell[] = [];
  for (const [dr, dc] of deltas) {
    const nr = r + dr!;
    const nc = c + dc!;
    if (nr >= 0 && nr < size && nc >= 0 && nc < size) out.push({ r: nr, c: nc });
  }
  return out;
}

/**
 * Deterministic vein: a short (<=3 cell) off-centre anti-diagonal run of
 * blockers. Identical every match — part of the board, not random. Returns []
 * when the board is too small to host it without crowding the edges.
 */
export function veinCells(size: number): Cell[] {
  if (size < 5) return [];
  const k = Math.floor(size * 0.55); // off-centre anti-diagonal (centre is size-1)
  const mid = Math.floor(size / 2);
  const out: Cell[] = [];
  for (let r = mid - 1; r <= mid + 1; r += 1) {
    const c = k - r;
    if (r > 0 && r < size - 1 && c > 0 && c < size - 1) out.push({ r, c });
  }
  return out;
}

export function createLinesBoard(
  size: number,
  opts?: { veinEnabled?: boolean; allowFracture?: boolean },
): LinesBoard {
  const veinEnabled = opts?.veinEnabled ?? true;
  const allowFracture = opts?.allowFracture ?? true;
  const cells: number[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => EMPTY),
  );
  if (veinEnabled) {
    for (const { r, c } of veinCells(size)) cells[r]![c] = BLOCKER;
  }
  return {
    size,
    cells,
    veinEnabled,
    allowFracture,
    fractureUsed: [false, false],
    placements: 0,
    swapped: false,
  };
}

const seatValue = (seat: Seat): number => (seat === 0 ? SEAT0 : SEAT1);

/**
 * Does `seat` connect its two edges? BFS over the seat's own stones using hex
 * adjacency. Seat 0 connects row 0 -> row size-1; seat 1 connects col 0 -> col size-1.
 */
export function isConnected(board: LinesBoard, seat: Seat): boolean {
  const { size, cells } = board;
  const val = seatValue(seat);
  const seen = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
  const queue: Cell[] = [];
  // seed from the seat's "start" edge
  for (let i = 0; i < size; i += 1) {
    if (seat === 0) {
      if (cells[0]![i] === val) {
        queue.push({ r: 0, c: i });
        seen[0]![i] = true;
      }
    } else if (cells[i]![0] === val) {
      queue.push({ r: i, c: 0 });
      seen[i]![0] = true;
    }
  }
  while (queue.length > 0) {
    const { r, c } = queue.shift()!;
    if (seat === 0 && r === size - 1) return true;
    if (seat === 1 && c === size - 1) return true;
    for (const n of neighbors(r, c, size)) {
      if (!seen[n.r]![n.c] && cells[n.r]![n.c] === val) {
        seen[n.r]![n.c] = true;
        queue.push(n);
      }
    }
  }
  return false;
}

/** Size of the largest connected component of `seat`'s stones (bridge-scoring tiebreak). */
export function longestChain(board: LinesBoard, seat: Seat): number {
  const { size, cells } = board;
  const val = seatValue(seat);
  const seen = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
  let best = 0;
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (cells[r]![c] !== val || seen[r]![c]) continue;
      let count = 0;
      const queue: Cell[] = [{ r, c }];
      seen[r]![c] = true;
      while (queue.length > 0) {
        const cur = queue.shift()!;
        count += 1;
        for (const n of neighbors(cur.r, cur.c, size)) {
          if (!seen[n.r]![n.c] && cells[n.r]![n.c] === val) {
            seen[n.r]![n.c] = true;
            queue.push(n);
          }
        }
      }
      if (count > best) best = count;
    }
  }
  return best;
}

function boardFull(board: LinesBoard): boolean {
  for (const row of board.cells) {
    for (const v of row) if (v === EMPTY) return false;
  }
  return true;
}

function countAdjacentOwn(board: LinesBoard, cell: Cell, seat: Seat): number {
  const val = seatValue(seat);
  let n = 0;
  for (const nb of neighbors(cell.r, cell.c, board.size)) {
    if (board.cells[nb.r]![nb.c] === val) n += 1;
  }
  return n;
}

function inBounds(board: LinesBoard, r: number, c: number): boolean {
  return r >= 0 && r < board.size && c >= 0 && c < board.size;
}

function parseCell(move: GameMove): Cell | null {
  const raw = move.cell;
  if (!raw || typeof raw !== "object") return null;
  const { r, c } = raw as { r?: unknown; c?: unknown };
  if (typeof r !== "number" || typeof c !== "number") return null;
  if (!Number.isInteger(r) || !Number.isInteger(c)) return null;
  return { r, c };
}

function validateMove(state: GameState, move: GameMove, bySeat: Seat): MoveValidation {
  if (state.phase !== "active") return { ok: false, reason: "match_not_active" };
  if (state.toMove !== bySeat) return { ok: false, reason: "not_your_turn" };
  const board = readBoard(state);

  if (move.type === "place") {
    const cell = parseCell(move);
    if (!cell) return { ok: false, reason: "malformed_cell" };
    if (!inBounds(board, cell.r, cell.c)) return { ok: false, reason: "out_of_bounds" };
    if (board.cells[cell.r]![cell.c] !== EMPTY) return { ok: false, reason: "cell_occupied" };
    return { ok: true };
  }

  if (move.type === "swap") {
    // Legal only as seat 1's reply to seat 0's single opening stone.
    if (bySeat !== 1) return { ok: false, reason: "swap_seat1_only" };
    if (board.swapped) return { ok: false, reason: "swap_already_used" };
    if (board.placements !== 1) return { ok: false, reason: "swap_not_available" };
    return { ok: true };
  }

  if (move.type === "fracture") {
    if (!board.allowFracture) return { ok: false, reason: "fracture_disabled" };
    if (board.fractureUsed[bySeat]) return { ok: false, reason: "fracture_already_used" };
    const cell = parseCell(move);
    if (!cell) return { ok: false, reason: "malformed_cell" };
    if (!inBounds(board, cell.r, cell.c)) return { ok: false, reason: "out_of_bounds" };
    const opponent = bySeat === 0 ? SEAT1 : SEAT0;
    if (board.cells[cell.r]![cell.c] !== opponent) return { ok: false, reason: "not_opponent_stone" };
    if (countAdjacentOwn(board, cell, bySeat) < 2) return { ok: false, reason: "fracture_needs_two_anchors" };
    return { ok: true };
  }

  return { ok: false, reason: "unknown_move_type" };
}

function cloneBoard(board: LinesBoard): LinesBoard {
  return {
    ...board,
    cells: board.cells.map((row) => [...row]),
    fractureUsed: [...board.fractureUsed] as [boolean, boolean],
  };
}

function settle(state: GameState, board: LinesBoard, nextToMove: Seat): GameState {
  // recompute terminal condition after a board mutation
  const outcome = resolveOutcomeForBoard(board);
  if (outcome.kind === "ongoing") {
    return { ...state, board, toMove: nextToMove, seq: state.seq + 1 };
  }
  return {
    ...state,
    board,
    toMove: null,
    seq: state.seq + 1,
    phase: "complete",
    winnerSeat: outcome.kind === "win" ? outcome.winnerSeat : null,
  };
}

function applyMove(state: GameState, move: GameMove, bySeat: Seat): GameState {
  const board = cloneBoard(readBoard(state));
  const other: Seat = bySeat === 0 ? 1 : 0;

  if (move.type === "place") {
    const cell = parseCell(move)!;
    board.cells[cell.r]![cell.c] = seatValue(bySeat);
    board.placements += 1;
    return settle(state, board, other);
  }

  if (move.type === "swap") {
    // B claims A's single opening stone as their own; turn passes back to A.
    for (let r = 0; r < board.size; r += 1) {
      for (let c = 0; c < board.size; c += 1) {
        if (board.cells[r]![c] === SEAT0) board.cells[r]![c] = SEAT1;
      }
    }
    board.swapped = true;
    // placements unchanged (still one stone on the board), turn back to seat 0
    return settle(state, board, 0);
  }

  if (move.type === "fracture") {
    const cell = parseCell(move)!;
    board.cells[cell.r]![cell.c] = BLOCKER;
    board.fractureUsed[bySeat] = true;
    return settle(state, board, other);
  }

  // unreachable for validated moves
  return state;
}

function resolveOutcomeForBoard(board: LinesBoard): GameOutcome {
  if (isConnected(board, 0)) return { kind: "win", winnerSeat: 0 };
  if (isConnected(board, 1)) return { kind: "win", winnerSeat: 1 };
  if (boardFull(board)) {
    // mutual block (only possible with vein/fracture): deterministic bridge-scoring.
    const a = longestChain(board, 0);
    const b = longestChain(board, 1);
    if (a > b) return { kind: "win", winnerSeat: 0 };
    if (b > a) return { kind: "win", winnerSeat: 1 };
    return { kind: "tie" };
  }
  return { kind: "ongoing" };
}

function resolveOutcome(state: GameState): GameOutcome {
  if (state.phase === "complete") {
    if (state.winnerSeat === null) return { kind: "tie" };
    return { kind: "win", winnerSeat: state.winnerSeat };
  }
  return resolveOutcomeForBoard(readBoard(state));
}

function initialState(_drawSeed: string, players: PlayerSeat[]): GameState {
  // drawSeed intentionally ignored — Onyx Lines uses NO randomness.
  return {
    gameId: "onyx-lines",
    seats: players,
    toMove: 0, // seat 0 (Onyx) opens
    seq: 0,
    phase: "active",
    winnerSeat: null,
    board: createLinesBoard(ONYX_LINES_DEFAULT_SIZE),
    fairness: null,
  };
}

/** Variant-aware initial state for lobbies (e.g. Hex-clean ranked: no vein, no fracture). */
export function initialLinesState(
  players: PlayerSeat[],
  opts?: { size?: number; veinEnabled?: boolean; allowFracture?: boolean },
): GameState {
  return {
    gameId: "onyx-lines",
    seats: players,
    toMove: 0,
    seq: 0,
    phase: "active",
    winnerSeat: null,
    board: createLinesBoard(opts?.size ?? ONYX_LINES_DEFAULT_SIZE, opts),
    fairness: null,
  };
}

export const onyxLines: GameDefinition = {
  id: "onyx-lines",
  nameKey: "games.onyxLines.name",
  descriptionKey: "games.onyxLines.description",
  minPlayers: 2,
  maxPlayers: 2,
  skillWeight: 1.0,
  usesRandomness: false,
  rulesDocPath: "docs/gaming/onyx-lines-rules.md",
  validateMove,
  initialState,
  applyMove,
  resolveOutcome,
};
