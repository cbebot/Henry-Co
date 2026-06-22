"use client";

import { useState } from "react";
import type { ArenaCopy } from "@henryco/i18n";
import { HIDDEN_COMMIT, cardFacet, type CardsBoard } from "@henryco/gaming-arena";
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
  const shadowSpent = board.shadowUsed[mySeat];

  const currentPrize = board.prizes[board.round];
  const currentWorth = currentPrize ? currentPrize.value + board.carry : 0;
  const lastRound = board.history.length > 0 ? board.history[board.history.length - 1] : null;

  return (
    <div aria-label={copy.games["onyx-cards"].name} style={{ display: "grid", gap: 16 }}>
      {/* score */}
      <p style={{ color: "var(--acct-muted)", fontSize: 13, margin: 0 }}>
        {copy.match.seatYou} {board.scores[mySeat]} · {board.scores[oppSeat]} {copy.match.seatOpponent}
      </p>

      {/* prize track */}
      <div className="acct-cards-track">
        {board.prizes.map((prize, i) => (
          <div
            key={i}
            className={`acct-cards-prize${i === board.round ? " acct-cards-prize--current" : ""}${
              i < board.round ? " acct-cards-prize--won" : ""
            }`}
          >
            <span style={{ fontWeight: 700, color: "var(--acct-ink)" }}>{prize.value}</span>
            <span className="acct-cards-prize__facet" style={{ background: FACET_COLORS[prize.facet] }} />
          </div>
        ))}
      </div>

      {/* current prize worth (teaches what's at stake, incl. carry) */}
      {view.status === "in_progress" ? (
        <p style={{ margin: 0, color: "var(--acct-ink)", fontSize: 14 }}>
          {copy.hints.cardsPrize.replace("{value}", String(currentWorth))}
        </p>
      ) : null}

      {/* last round reveal */}
      {lastRound ? (
        <div className="acct-cards-reveal" aria-live="polite">
          <RevealCard label={copy.match.seatYou} value={lastRound.cards[mySeat]} shadow={lastRound.shadow[mySeat]} />
          <span style={{ color: "var(--acct-muted)", fontWeight: 700 }}>vs</span>
          <RevealCard label={copy.match.seatOpponent} value={lastRound.cards[oppSeat]} shadow={lastRound.shadow[oppSeat]} />
          <span style={{ color: "var(--acct-div-gaming)", fontWeight: 700, fontSize: 13 }}>
            {lastRound.winnerSeat === null
              ? copy.match.tie
              : lastRound.winnerSeat === mySeat
                ? `${copy.match.youWon} +${lastRound.prizeValue}${lastRound.facetBonus ? " ✦" : ""}`
                : copy.match.youLost}
          </span>
        </div>
      ) : null}

      {/* opponent status */}
      <p style={{ color: "var(--acct-muted)", fontSize: 13, margin: 0 }}>
        {oppCommitted ? copy.match.opponentTurn : copy.match.waitingOpponent}
      </p>

      {/* my hand */}
      <div>
        <p style={{ color: "var(--acct-muted)", fontSize: 13, margin: "0 0 6px" }}>{copy.match.seatYou}</p>
        <div className="acct-cards-hand">
          {myHand.map((card) => (
            <button
              key={card}
              type="button"
              className={`acct-cards-card${myCommit === card ? " acct-cards-card--selected" : ""}`}
              disabled={!canCommit}
              onClick={() => onMove({ type: "commit", card, shadow })}
              style={{ position: "relative" }}
            >
              {card}
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  bottom: 5,
                  width: 14,
                  height: 3,
                  borderRadius: 2,
                  background: FACET_COLORS[cardFacet(card)],
                }}
              />
            </button>
          ))}
        </div>
        <label
          style={{
            display: "inline-flex",
            gap: 6,
            alignItems: "center",
            marginTop: 10,
            color: shadowSpent ? "var(--acct-muted)" : "var(--acct-ink)",
            fontSize: 13,
          }}
        >
          <input
            type="checkbox"
            checked={shadow}
            disabled={!canCommit || shadowSpent}
            onChange={(e) => setShadow(e.target.checked)}
          />
          {copy.match.shadowBid}
        </label>
      </div>
    </div>
  );
}

function RevealCard({ label, value, shadow }: { label: string; value: number; shadow: boolean }) {
  return (
    <div style={{ display: "grid", gap: 4, justifyItems: "center" }}>
      <span style={{ fontSize: 11, color: "var(--acct-muted)" }}>{label}</span>
      <span
        className="acct-cards-reveal__card"
        style={{
          background: "var(--acct-bg-elevated)",
          border: "1px solid var(--acct-line)",
          color: "var(--acct-ink)",
        }}
      >
        {shadow ? value * 2 : value}
      </span>
    </div>
  );
}
