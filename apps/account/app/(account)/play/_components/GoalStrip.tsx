"use client";

import type { ArenaCopy } from "@henryco/i18n";
import type { GameId, Seat } from "@henryco/gaming-arena";

/**
 * The always-on objective banner. It states the goal AND shows it in the
 * player's own colour — so a newcomer sees, not just reads, what they are
 * trying to do.
 */
export function GoalStrip({ gameId, mySeat, copy }: { gameId: GameId; mySeat: Seat; copy: ArenaCopy }) {
  const text =
    gameId === "onyx-cards"
      ? copy.goalStrip.cards
      : mySeat === 0
        ? copy.goalStrip.linesOnyx
        : copy.goalStrip.linesAlabaster;
  const dot =
    gameId === "onyx-cards"
      ? "var(--arena-accent)"
      : mySeat === 0
        ? "var(--arena-onyx)"
        : "var(--arena-alabaster)";
  return (
    <div className="acct-goalstrip">
      <span className="acct-goalstrip__dot" style={{ background: dot }} aria-hidden />
      <span>{text}</span>
    </div>
  );
}
