"use client";

import { useState } from "react";
import type { ArenaCopy } from "@henryco/i18n";
import { HIDDEN_COMMIT, type CardsBoard } from "@henryco/gaming-arena";
import type { MatchView } from "./use-match-state";

const FACET_COLORS = ["#A21CAF", "#0891B2", "#B45309"];

export function OnyxCardsTable({
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
  const [shadow, setShadow] = useState(false);
  const board = view.state?.board as CardsBoard | undefined;
  if (!board) return null;

  const mySeat = view.mySeat;
  const oppSeat = mySeat === 0 ? 1 : 0;
  const myHand = board.hands[mySeat] ?? [];
  const myCommit = board.committed[mySeat];
  const oppCommitted = board.committed[oppSeat] === HIDDEN_COMMIT || board.committed[oppSeat] !== null;
  const canCommit = view.status === "in_progress" && myCommit === null && !busy;

  return (
    <div aria-label={copy.games["onyx-cards"].name} style={{ display: "grid", gap: 16 }}>
      {/* prize track */}
      <div>
        <p style={{ color: "var(--acct-muted)", fontSize: 13, margin: "0 0 6px" }}>
          {copy.leaderboard.record}: {board.scores[mySeat]} · {board.scores[oppSeat]}
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {board.prizes.map((prize, i) => (
            <div
              key={i}
              style={{
                width: 44,
                height: 56,
                borderRadius: 8,
                border: i === board.round ? "2px solid var(--acct-div-gaming)" : "1px solid var(--acct-line)",
                background: "var(--acct-surface)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                opacity: i < board.round ? 0.4 : 1,
              }}
            >
              <span style={{ fontWeight: 700, color: "var(--acct-ink)" }}>{prize.value}</span>
              <span style={{ width: 14, height: 4, borderRadius: 2, background: FACET_COLORS[prize.facet] }} />
            </div>
          ))}
        </div>
      </div>

      {/* opponent status */}
      <p style={{ color: "var(--acct-muted)", fontSize: 13, margin: 0 }}>
        {oppCommitted ? copy.match.opponentTurn : copy.match.waitingOpponent}
      </p>

      {/* my hand */}
      <div>
        <p style={{ color: "var(--acct-muted)", fontSize: 13, margin: "0 0 6px" }}>{copy.match.seatYou}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {myHand.map((card) => (
            <button
              key={card}
              type="button"
              disabled={!canCommit}
              onClick={() => onMove({ type: "commit", card, shadow })}
              style={{
                width: 44,
                height: 56,
                borderRadius: 8,
                border: "1px solid var(--acct-line)",
                background: myCommit === card ? "var(--acct-div-gaming)" : "var(--acct-bg-elevated)",
                color: myCommit === card ? "var(--hc-text-on-accent)" : "var(--acct-ink)",
                fontWeight: 700,
                cursor: canCommit ? "pointer" : "default",
              }}
            >
              {card}
            </button>
          ))}
        </div>
        <label style={{ display: "inline-flex", gap: 6, alignItems: "center", marginTop: 10, color: "var(--acct-muted)", fontSize: 13 }}>
          <input
            type="checkbox"
            checked={shadow}
            disabled={!canCommit || board.shadowUsed[mySeat]}
            onChange={(e) => setShadow(e.target.checked)}
          />
          {copy.match.shadowBid}
        </label>
      </div>
    </div>
  );
}
