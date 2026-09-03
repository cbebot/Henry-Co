"use client";

import { useState, type CSSProperties } from "react";
import type { ArenaCopy } from "@henryco/i18n";
import type { LinesBoard } from "@henryco/gaming-arena";
import type { MatchView } from "./use-match-state";

const CELL = 28;
const EMPTY = 0;
const SEAT0 = 1; // Onyx
const SEAT1 = 2; // Alabaster
const BLOCKER = 3;

const HEX_DELTAS: ReadonlyArray<readonly [number, number]> = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [1, -1],
];

export type LinesCell = { r: number; c: number };

/** Column letter + 1-based row, e.g. {r:4,c:2} → "C5". */
export function linesCellLabel(cell: LinesCell): string {
  return `${String.fromCharCode(65 + cell.c)}${cell.r + 1}`;
}

function adjacentOwn(board: LinesBoard, r: number, c: number, own: number): number {
  let n = 0;
  for (const [dr, dc] of HEX_DELTAS) {
    const nr = r + dr!;
    const nc = c + dc!;
    if (nr >= 0 && nr < board.size && nc >= 0 && nc < board.size && board.cells[nr]![nc] === own) n += 1;
  }
  return n;
}

export function OnyxLinesBoard({
  view,
  copy,
  onMove,
  busy,
  lastMove,
  hintCell,
}: {
  view: MatchView;
  copy: ArenaCopy;
  onMove: (move: Record<string, unknown>) => void;
  busy: boolean;
  lastMove?: LinesCell | null;
  hintCell?: LinesCell | null;
}) {
  const [fractureMode, setFractureMode] = useState(false);
  const board = view.state?.board as LinesBoard | undefined;
  if (!board) return null;

  const mySeat = view.mySeat;
  const myValue = mySeat === 0 ? SEAT0 : SEAT1;
  const oppValue = mySeat === 0 ? SEAT1 : SEAT0;
  const isMyTurn = view.state?.toMove === mySeat && view.status === "in_progress";
  const completed = view.status === "completed";
  const winnerValue = view.winnerSeat === null ? null : view.winnerSeat === 0 ? SEAT0 : SEAT1;
  const ghost = mySeat === 0 ? "var(--arena-onyx)" : "var(--arena-alabaster)";

  // swap: only seat 1, only as a reply to the single opening stone
  const canSwap = mySeat === 1 && isMyTurn && !busy && board.placements === 1 && !board.swapped;
  // fracture: once per seat, when the variant allows it
  const canFracture = isMyTurn && !busy && board.allowFracture && !board.fractureUsed[mySeat];

  function handleCell(r: number, c: number) {
    const value = board!.cells[r]![c];
    if (fractureMode) {
      if (value === oppValue && adjacentOwn(board!, r, c, myValue) >= 2) {
        onMove({ type: "fracture", cell: { r, c } });
        setFractureMode(false);
      }
      return;
    }
    if (value === EMPTY && isMyTurn && !busy) {
      onMove({ type: "place", cell: { r, c } });
    }
  }

  return (
    <div style={{ display: "grid", gap: 14, justifyItems: "start" }}>
      <div
        className={`acct-arena-board${isMyTurn ? " acct-arena-board--mine-active" : ""}`}
        style={{ "--arena-ghost": ghost } as CSSProperties}
        role="grid"
        aria-label={copy.games["onyx-lines"].name}
      >
        {/* goal-edge rails: top/bottom belong to Onyx, left/right to Alabaster;
            the player's own edges pulse to make the objective visible. */}
        <span className={`acct-arena-rail acct-arena-rail--h acct-arena-rail--top acct-arena-rail--onyx${mySeat === 0 ? " acct-arena-rail--mine" : ""}`} aria-hidden />
        <span className={`acct-arena-rail acct-arena-rail--h acct-arena-rail--bottom acct-arena-rail--onyx${mySeat === 0 ? " acct-arena-rail--mine" : ""}`} aria-hidden />
        <span className={`acct-arena-rail acct-arena-rail--v acct-arena-rail--left acct-arena-rail--alabaster${mySeat === 1 ? " acct-arena-rail--mine" : ""}`} aria-hidden />
        <span className={`acct-arena-rail acct-arena-rail--v acct-arena-rail--right acct-arena-rail--alabaster${mySeat === 1 ? " acct-arena-rail--mine" : ""}`} aria-hidden />

        {board.cells.map((row, r) => (
          <div
            key={r}
            className="acct-arena-row"
            role="row"
            style={{ marginLeft: r * (CELL / 2), marginTop: r === 0 ? 0 : -3 }}
          >
            {row.map((value, c) => {
              const occ =
                value === SEAT0
                  ? "onyx"
                  : value === SEAT1
                    ? "alabaster"
                    : value === BLOCKER
                      ? "blocker"
                      : "empty";
              const isLast = !!lastMove && lastMove.r === r && lastMove.c === c;
              const isHint = !!hintCell && hintCell.r === r && hintCell.c === c;
              const isWin = completed && winnerValue !== null && value === winnerValue;
              const fracturable =
                fractureMode && value === oppValue && adjacentOwn(board, r, c, myValue) >= 2;
              const clickable = !fractureMode && value === EMPTY && isMyTurn && !busy;
              const cls = [
                "acct-arena-hex",
                `acct-arena-hex--${occ}`,
                clickable ? "acct-arena-hex--clickable" : "",
                isLast ? "acct-arena-hex--last" : "",
                isHint || isWin ? "acct-arena-hex--win" : "",
                fracturable ? "acct-arena-hex--fracturable" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <button
                  key={c}
                  type="button"
                  role="gridcell"
                  aria-label={linesCellLabel({ r, c })}
                  className={cls}
                  disabled={!clickable && !fracturable}
                  onClick={() => handleCell(r, c)}
                  style={{ width: CELL, height: CELL + 2 }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {(canSwap || canFracture) && !completed ? (
        <div className="acct-arena-actionbar">
          {canSwap ? (
            <button type="button" className="acct-arena-btn" onClick={() => onMove({ type: "swap" })}>
              {copy.hints.linesSwap}
            </button>
          ) : null}
          {canFracture ? (
            <button
              type="button"
              className={`acct-arena-btn${fractureMode ? " acct-arena-btn--accent" : ""}`}
              aria-pressed={fractureMode}
              onClick={() => setFractureMode((v) => !v)}
            >
              {copy.hints.linesFracture}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
