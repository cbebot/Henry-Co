"use client";

import type { ArenaCopy } from "@henryco/i18n";
import type { LinesBoard } from "@henryco/gaming-arena";
import type { MatchView } from "./use-match-state";

const CELL = 30;

export function OnyxLinesBoard({
  view,
  copy,
  onMove,
  busy,
}: {
  view: MatchView;
  copy: ArenaCopy;
  onMove: (move: Record<string, unknown>) => void;
  busy: boolean;
}) {
  const board = view.state?.board as LinesBoard | undefined;
  if (!board) return null;
  const isMyTurn = view.state?.toMove === view.mySeat && view.status === "in_progress";

  function colorFor(value: number): string {
    if (value === 1) return "#0B0510"; // seat 0 — Onyx
    if (value === 2) return "#F5D0FE"; // seat 1 — Alabaster
    if (value === 3) return "var(--acct-muted)"; // vein / fractured blocker
    return "var(--acct-surface)";
  }

  return (
    <div role="grid" aria-label={copy.games["onyx-lines"].name} style={{ overflowX: "auto", padding: 8 }}>
      {board.cells.map((row, r) => (
        <div key={r} role="row" style={{ display: "flex", marginLeft: r * (CELL / 2) }}>
          {row.map((value, c) => {
            const empty = value === 0;
            const clickable = empty && isMyTurn && !busy;
            return (
              <button
                key={c}
                type="button"
                role="gridcell"
                aria-label={`${r + 1}, ${c + 1}`}
                disabled={!clickable}
                onClick={() => clickable && onMove({ type: "place", cell: { r, c } })}
                style={{
                  width: CELL,
                  height: CELL,
                  margin: 1,
                  borderRadius: 6,
                  border: "1px solid var(--acct-line)",
                  background: colorFor(value),
                  cursor: clickable ? "pointer" : "default",
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
