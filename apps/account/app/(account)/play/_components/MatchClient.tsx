"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ArenaCopy } from "@henryco/i18n";
import type { CardsBoard } from "@henryco/gaming-arena";
import { useMatchState, postMove, leaveMatch, type MatchView } from "./use-match-state";
import { OnyxLinesBoard } from "./OnyxLinesBoard";
import { OnyxCardsTable } from "./OnyxCardsTable";

function banner(view: MatchView, copy: ArenaCopy): string {
  if (view.status === "completed") {
    if (view.winnerSeat === null) return copy.match.tie;
    return view.winnerSeat === view.mySeat ? copy.match.youWon : copy.match.youLost;
  }
  if (view.status === "abandoned") return copy.match.abandoned;
  if (view.status !== "in_progress") return copy.match.waitingOpponent;
  // in_progress
  if (view.gameId === "onyx-lines") {
    return view.state?.toMove === view.mySeat ? copy.match.yourTurn : copy.match.opponentTurn;
  }
  // onyx-cards (simultaneous) — based on whether I've committed this round
  const board = view.state?.board as CardsBoard | undefined;
  const myCommit = board?.committed?.[view.mySeat];
  return myCommit === null || myCommit === undefined ? copy.match.yourTurn : copy.match.waitingOpponent;
}

export function MatchClient({ matchId, copy }: { matchId: string; copy: ArenaCopy }) {
  const router = useRouter();
  const { view, loading, refresh } = useMatchState(matchId);
  const [busy, setBusy] = useState(false);

  async function handleMove(move: Record<string, unknown>) {
    setBusy(true);
    await postMove(matchId, move);
    await refresh();
    setBusy(false);
  }

  async function handleLeave() {
    await leaveMatch(matchId);
    router.push("/play");
  }

  if (loading && !view) {
    return <p style={{ color: "var(--acct-muted)" }}>{copy.lobby.searching}</p>;
  }
  if (!view) {
    return <p style={{ color: "var(--acct-muted)" }}>{copy.match.abandoned}</p>;
  }

  const opponent = view.players.find((p) => !p.isYou);
  const active = view.status === "in_progress" || view.status === "completed";
  const canLeave = view.status === "in_progress" || view.status === "lobby" || view.status === "matchmaking";

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 720, margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          background: "var(--acct-bg-elevated)",
          border: "1px solid var(--acct-line)",
          borderRadius: 12,
        }}
      >
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: "var(--acct-ink)" }}>{copy.games[view.gameId].name}</p>
          <p style={{ margin: "2px 0 0", color: "var(--acct-muted)", fontSize: 13 }}>
            {copy.match.seatOpponent}: {opponent?.handle ?? "…"}
          </p>
        </div>
        <span style={{ color: "var(--acct-div-gaming)", fontWeight: 700 }}>{banner(view, copy)}</span>
      </header>

      {active ? (
        view.gameId === "onyx-lines" ? (
          <OnyxLinesBoard view={view} copy={copy} onMove={handleMove} busy={busy} />
        ) : (
          <OnyxCardsTable view={view} copy={copy} onMove={handleMove} busy={busy} />
        )
      ) : (
        <p style={{ color: "var(--acct-muted)" }}>{copy.match.waitingOpponent}</p>
      )}

      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {view.status === "completed" && view.fairness.commitment ? (
          <Link href={`/play/verify?match=${view.id}`} style={{ color: "var(--acct-div-gaming)", fontWeight: 600 }}>
            {copy.fairness.verifyCta}
          </Link>
        ) : null}
        {canLeave ? (
          <button
            type="button"
            onClick={handleLeave}
            style={{
              background: "transparent",
              color: "var(--acct-muted)",
              border: "1px solid var(--acct-line)",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            {copy.match.abandon}
          </button>
        ) : null}
      </div>
    </div>
  );
}
