/**
 * Onyx Lines — on-device practice opponent (PURE, client-safe).
 *
 * Onyx Lines is zero-RNG and perfect-information, so a genuine bot is just good
 * heuristics over the same pure rules the server runs. The core measure is the
 * "completion distance": the minimum number of empty cells a seat must still
 * claim to link its two edges (own stones are free, the opponent's stones and
 * the vein are walls). A 0-1 BFS computes it. The move policy is then:
 *
 *   1. take an immediate win,
 *   2. else block an opponent who connects next move,
 *   3. else play the cell that best improves (myDistance − opponentDistance).
 *
 * `completionDistance` and `detectLinesThreat` are reused by the coach to teach
 * ("⚠ block here") — same math, surfaced as a hint.
 */
import type { GameMove, GameState, Seat } from "../types";
import { isConnected, type LinesBoard } from "../catalog/onyx-lines";

export type LinesDifficulty = "gentle" | "even" | "sharp";
export const LINES_DIFFICULTIES: readonly LinesDifficulty[] = ["gentle", "even", "sharp"];

const EMPTY = 0;
const seatValue = (seat: Seat): number => (seat === 0 ? 1 : 2);
const other = (seat: Seat): Seat => (seat === 0 ? 1 : 0);

/** The 6 hex neighbour offsets (identical to the catalog's adjacency). */
const HEX_DELTAS: ReadonlyArray<readonly [number, number]> = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [1, -1],
];

type Cell = { r: number; c: number };

function listEmpty(board: LinesBoard): Cell[] {
  const out: Cell[] = [];
  for (let r = 0; r < board.size; r += 1) {
    for (let c = 0; c < board.size; c += 1) {
      if (board.cells[r]![c] === EMPTY) out.push({ r, c });
    }
  }
  return out;
}

function withStone(board: LinesBoard, cell: Cell, value: number): LinesBoard {
  const cells = board.cells.map((row) => row.slice());
  cells[cell.r]![cell.c] = value;
  return { ...board, cells };
}

function centrality(cell: Cell, size: number): number {
  const mid = (size - 1) / 2;
  return -(Math.abs(cell.r - mid) + Math.abs(cell.c - mid));
}

/**
 * Minimum empty cells `seat` must still claim to connect its two edges. Own
 * stones cost 0, empty cells cost 1, opponent/vein cells are impassable.
 * Returns 0 when already connected, Infinity when no connection remains.
 */
export function completionDistance(board: LinesBoard, seat: Seat): number {
  const { size, cells } = board;
  const val = seatValue(seat);
  const dist: number[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => Infinity),
  );
  const cellCost = (r: number, c: number): number => {
    const v = cells[r]![c];
    if (v === val) return 0;
    if (v === EMPTY) return 1;
    return Infinity; // opponent stone or blocker — a wall
  };
  // 0-1 BFS deque seeded from the seat's start edge.
  const deque: Cell[] = [];
  for (let i = 0; i < size; i += 1) {
    const r = seat === 0 ? 0 : i;
    const c = seat === 0 ? i : 0;
    const cost = cellCost(r, c);
    if (cost !== Infinity && cost < dist[r]![c]!) {
      dist[r]![c] = cost;
      if (cost === 0) deque.unshift({ r, c });
      else deque.push({ r, c });
    }
  }
  while (deque.length > 0) {
    const { r, c } = deque.shift()!;
    const d = dist[r]![c]!;
    for (const [dr, dc] of HEX_DELTAS) {
      const nr = r + dr!;
      const nc = c + dc!;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
      const cost = cellCost(nr, nc);
      if (cost === Infinity) continue;
      const nd = d + cost;
      if (nd < dist[nr]![nc]!) {
        dist[nr]![nc] = nd;
        if (cost === 0) deque.unshift({ r: nr, c: nc });
        else deque.push({ r: nr, c: nc });
      }
    }
  }
  let best = Infinity;
  for (let i = 0; i < size; i += 1) {
    const r = seat === 0 ? size - 1 : i;
    const c = seat === 0 ? i : size - 1;
    if (dist[r]![c]! < best) best = dist[r]![c]!;
  }
  return best;
}

/** The cell (if any) where the opponent of `mySeat` would connect on their next move. */
export function detectLinesThreat(state: GameState, mySeat: Seat): { cell: Cell } | null {
  const board = state.board as LinesBoard;
  const opp = other(mySeat);
  for (const cell of listEmpty(board)) {
    if (isConnected(withStone(board, cell, seatValue(opp)), opp)) return { cell };
  }
  return null;
}

/** Choose the AI's placement for `seat` at the given difficulty. */
export function chooseLinesMove(state: GameState, seat: Seat, difficulty: LinesDifficulty): GameMove {
  const board = state.board as LinesBoard;
  const opp = other(seat);
  const empties = listEmpty(board);
  if (empties.length === 0) return { type: "place", cell: { r: 0, c: 0 } };

  // 1. immediate win
  for (const cell of empties) {
    if (isConnected(withStone(board, cell, seatValue(seat)), seat)) {
      return { type: "place", cell };
    }
  }
  // 2. block an opponent who connects next move
  const threat = detectLinesThreat(state, seat);
  if (threat) return { type: "place", cell: threat.cell };

  // 3. positional: the cell that best improves (opponentDistance − myDistance)
  let best = empties[0]!;
  let bestScore = -Infinity;
  for (const cell of empties) {
    const after = withStone(board, cell, seatValue(seat));
    const myD = completionDistance(after, seat);
    const oppD = completionDistance(after, opp);
    let score = difficulty === "gentle" ? -myD : oppD - myD;
    if (difficulty === "sharp") score += centrality(cell, board.size) * 0.25;
    score += centrality(cell, board.size) * 0.001; // deterministic central tie-break
    if (score > bestScore) {
      bestScore = score;
      best = cell;
    }
  }
  return { type: "place", cell: best };
}
