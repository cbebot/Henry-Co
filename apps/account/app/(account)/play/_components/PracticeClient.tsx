"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ArenaCopy } from "@henryco/i18n";
import {
  chooseCardsCommit,
  chooseLinesMove,
  detectLinesThreat,
  onyxCards,
  onyxLines,
  type GameId,
  type GameMove,
  type GameState,
  type PlayerSeat,
} from "@henryco/gaming-arena";
import { GoalStrip } from "./GoalStrip";
import { Coach, HintBox } from "./Coach";
import { OnyxLinesBoard, linesCellLabel, type LinesCell } from "./OnyxLinesBoard";
import { OnyxCardsTable } from "./OnyxCardsTable";
import type { MatchView } from "./use-match-state";

type Difficulty = "gentle" | "even" | "sharp";
const HUMAN = 0 as const;
const AI = 1 as const;
const PLAYERS: PlayerSeat[] = [
  { userId: "you", seat: 0 },
  { userId: "onyx-ai", seat: 1 },
];

function freshSeed(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function newGame(gameId: GameId): GameState {
  return gameId === "onyx-cards"
    ? onyxCards.initialState(freshSeed(), PLAYERS)
    : onyxLines.initialState("", PLAYERS);
}

export function PracticeClient({ copy }: { copy: ArenaCopy }) {
  const [game, setGame] = useState<GameId>("onyx-lines");
  const [difficulty, setDifficulty] = useState<Difficulty>("even");
  const [playing, setPlaying] = useState(false);
  const [state, setState] = useState<GameState>(() => newGame("onyx-lines"));
  const [lastMove, setLastMove] = useState<LinesCell | null>(null);

  const status: MatchView["status"] = state.phase === "complete" ? "completed" : "in_progress";
  // derived, not stored: it's the AI's turn and we're waiting on its move
  const aiThinking = game === "onyx-lines" && playing && state.phase === "active" && state.toMove === AI;

  const view: MatchView = useMemo(
    () => ({
      id: "practice",
      gameId: game,
      status,
      mySeat: HUMAN,
      currentSeq: state.seq,
      winnerSeat: state.winnerSeat,
      players: [
        { seat: 0, handle: copy.match.seatYou, rating: 0, isYou: true },
        { seat: 1, handle: copy.practice.vsAi, rating: 0, isYou: false },
      ],
      state,
      fairness: { commitment: null, revealedSeed: null },
    }),
    [game, status, state, copy],
  );

  // The AI's turn (Onyx Lines is turn-based) — respond after a short "thinking" beat.
  useEffect(() => {
    if (game !== "onyx-lines" || !playing) return;
    if (state.phase !== "active" || state.toMove !== AI) return;
    const t = setTimeout(() => {
      const move = chooseLinesMove(state, AI, difficulty);
      if (onyxLines.validateMove(state, move, AI).ok) {
        if (move.cell) setLastMove(move.cell as LinesCell);
        setState(onyxLines.applyMove(state, move, AI));
      }
    }, 480);
    return () => clearTimeout(t);
  }, [state, game, difficulty, playing]);

  const start = useCallback(() => {
    setState(newGame(game));
    setLastMove(null);
    setPlaying(true);
  }, [game]);

  const restart = useCallback(() => {
    setState(newGame(game));
    setLastMove(null);
  }, [game]);

  // Human moves. Onyx Lines: place/swap/fracture as seat 0. Onyx Cards:
  // commit; the AI commits from the SAME pre-commit state so it never peeks.
  const onMove = useCallback(
    (move: Record<string, unknown>) => {
      if (state.phase !== "active") return;
      const human = move as unknown as GameMove;
      if (game === "onyx-lines") {
        if (!onyxLines.validateMove(state, human, HUMAN).ok) return;
        if (move.cell) setLastMove(move.cell as LinesCell);
        setState(onyxLines.applyMove(state, human, HUMAN));
        return;
      }
      // onyx-cards (simultaneous)
      if (!onyxCards.validateMove(state, human, HUMAN).ok) return;
      const aiMove = chooseCardsCommit(state, AI, difficulty);
      let next = onyxCards.applyMove(state, human, HUMAN);
      if (onyxCards.validateMove(next, aiMove, AI).ok) {
        next = onyxCards.applyMove(next, aiMove, AI);
      }
      setState(next);
    },
    [state, game, difficulty],
  );

  // --- selection screen ---
  if (!playing) {
    const games: GameId[] = ["onyx-lines", "onyx-cards"];
    const diffs: { id: Difficulty; label: string; body: string }[] = [
      { id: "gentle", label: copy.practice.gentle, body: copy.practice.gentleBody },
      { id: "even", label: copy.practice.even, body: copy.practice.evenBody },
      { id: "sharp", label: copy.practice.sharp, body: copy.practice.sharpBody },
    ];
    return (
      <div style={{ display: "grid", gap: 20, maxWidth: 760, margin: "0 auto" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", color: "var(--acct-ink)" }}>{copy.practice.cta}</h2>
          <p style={{ margin: 0, color: "var(--acct-muted)", fontSize: 14 }}>{copy.practice.body}</p>
        </div>

        <div>
          <p style={{ margin: "0 0 8px", fontWeight: 600, color: "var(--acct-ink)" }}>{copy.practice.pickGame}</p>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {games.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGame(g)}
                className="acct-arena-btn"
                style={{
                  textAlign: "left",
                  padding: 14,
                  borderColor: game === g ? "var(--arena-accent)" : undefined,
                  boxShadow: game === g ? "0 0 0 1px var(--arena-accent)" : undefined,
                }}
              >
                <strong style={{ display: "block", color: "var(--acct-ink)" }}>{copy.games[g].name}</strong>
                <span style={{ color: "var(--acct-muted)", fontSize: 13, fontWeight: 400 }}>
                  {copy.games[g].description}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p style={{ margin: "0 0 8px", fontWeight: 600, color: "var(--acct-ink)" }}>{copy.practice.difficultyLabel}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {diffs.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDifficulty(d.id)}
                className={`acct-arena-btn${difficulty === d.id ? " acct-arena-btn--accent" : ""}`}
                title={d.body}
              >
                {d.label}
              </button>
            ))}
          </div>
          <p style={{ margin: "8px 0 0", color: "var(--acct-muted)", fontSize: 13 }}>
            {diffs.find((d) => d.id === difficulty)?.body}
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" className="acct-arena-btn acct-arena-btn--accent" onClick={start}>
            {copy.practice.start}
          </button>
          <Coach gameId={game} copy={copy} />
        </div>

        <p style={{ margin: 0, color: "var(--acct-muted)", fontSize: 13 }}>{copy.practice.liveSoon}</p>
        <Link href="/play" style={{ color: "var(--acct-div-gaming)", fontWeight: 600 }}>
          {copy.practice.backToArena}
        </Link>
      </div>
    );
  }

  // --- playing screen ---
  const banner = (() => {
    if (state.phase === "complete") {
      if (state.winnerSeat === null) return copy.match.tie;
      return state.winnerSeat === HUMAN ? copy.match.youWon : copy.match.youLost;
    }
    if (game === "onyx-lines") {
      return state.toMove === HUMAN ? copy.match.yourTurn : copy.practice.thinking;
    }
    return copy.match.yourTurn;
  })();

  // contextual hint
  let hintCell: LinesCell | null = null;
  let hintText: string | null = null;
  if (state.phase === "active" && game === "onyx-lines" && state.toMove === HUMAN) {
    const threat = detectLinesThreat(state, HUMAN);
    if (threat) {
      hintCell = threat.cell;
      hintText = copy.hints.linesBlock.replace("{cell}", linesCellLabel(threat.cell));
    } else {
      hintText = copy.hints.linesYourTurn;
    }
  }

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 760, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: "var(--acct-ink)" }}>{copy.games[game].name}</p>
          <p style={{ margin: "2px 0 0", color: "var(--acct-muted)", fontSize: 13 }}>
            {copy.practice.vsAi} · {copy.practice[difficulty]}
          </p>
        </div>
        {aiThinking ? (
          <span className="acct-arena-thinking">
            <span className="acct-arena-thinking__dot" aria-hidden />
            {copy.practice.thinking}
          </span>
        ) : (
          <span style={{ color: "var(--acct-div-gaming)", fontWeight: 700 }}>{banner}</span>
        )}
      </header>

      <GoalStrip gameId={game} mySeat={HUMAN} copy={copy} />

      {game === "onyx-lines" ? (
        <OnyxLinesBoard view={view} copy={copy} onMove={onMove} busy={aiThinking} lastMove={lastMove} hintCell={hintCell} />
      ) : (
        <OnyxCardsTable view={view} copy={copy} onMove={onMove} busy={false} />
      )}

      {hintText ? <HintBox>{hintText}</HintBox> : null}

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" className="acct-arena-btn" onClick={restart}>
          {copy.practice.newGame}
        </button>
        <button type="button" className="acct-arena-btn" onClick={() => setPlaying(false)}>
          {copy.practice.backToArena}
        </button>
        <Coach gameId={game} copy={copy} />
      </div>
    </div>
  );
}
