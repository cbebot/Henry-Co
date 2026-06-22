"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { ArenaCopy } from "@henryco/i18n";
import {
  bestLinesMove,
  chooseCardsCommit,
  chooseLinesMove,
  detectLinesThreat,
  makePrng,
  onyxCards,
  onyxLines,
  type GameId,
  type GameMove,
  type GameState,
  type LinesTier,
  type PlayerSeat,
  type Seat,
} from "@henryco/gaming-arena";
import { GoalStrip } from "./GoalStrip";
import { Coach, HintBox } from "./Coach";
import { OnyxLinesBoard, linesCellLabel, type LinesCell } from "./OnyxLinesBoard";
import { OnyxCardsTable } from "./OnyxCardsTable";
import { ResultToast, type ResultOutcome } from "./ResultToast";
import { SoundEngine } from "./henryOnyxSound";
import type { MatchView } from "./use-match-state";

type Side = "onyx" | "alabaster" | "random";
const PLAYERS: PlayerSeat[] = [
  { userId: "you", seat: 0 },
  { userId: "onyx-ai", seat: 1 },
];
const other = (s: Seat): Seat => (s === 0 ? 1 : 0);

function freshSeed(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
function newGameState(gameId: GameId): GameState {
  return gameId === "onyx-cards" ? onyxCards.initialState(freshSeed(), PLAYERS) : onyxLines.initialState("", PLAYERS);
}
function cardsDiff(tier: LinesTier): "gentle" | "even" | "sharp" {
  if (tier === "gentle" || tier === "novice") return "gentle";
  if (tier === "expert") return "sharp";
  return tier;
}

// --- local records / streaks (no backend) ---
type Rec = { w: number; l: number; t: number; streak: number; best: number };
const RECORDS_KEY = "onyx:arena:records:v1";
const emptyRec: Rec = { w: 0, l: 0, t: 0, streak: 0, best: 0 };
function loadRecords(): Record<string, Rec> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(RECORDS_KEY) ?? "{}") as Record<string, Rec>;
  } catch {
    return {};
  }
}
function getRec(map: Record<string, Rec>, game: GameId, tier: LinesTier): Rec {
  return map[`${game}:${tier}`] ?? emptyRec;
}
function recordOutcome(game: GameId, tier: LinesTier, outcome: ResultOutcome): void {
  if (typeof window === "undefined") return;
  const map = loadRecords();
  const key = `${game}:${tier}`;
  const r = { ...(map[key] ?? emptyRec) };
  if (outcome === "win") {
    r.w += 1;
    r.streak += 1;
    r.best = Math.max(r.best, r.streak);
  } else if (outcome === "loss") {
    r.l += 1;
    r.streak = 0;
  } else {
    r.t += 1;
    r.streak = 0;
  }
  map[key] = r;
  try {
    window.localStorage.setItem(RECORDS_KEY, JSON.stringify(map));
  } catch {
    /* storage may be unavailable */
  }
}

export function PracticeClient({ copy }: { copy: ArenaCopy }) {
  const [game, setGame] = useState<GameId>("onyx-lines");
  const [tier, setTier] = useState<LinesTier>("even");
  const [side, setSide] = useState<Side>("onyx");
  const [playing, setPlaying] = useState(false);
  const [humanSeat, setHumanSeat] = useState<Seat>(0);
  const [state, setState] = useState<GameState>(() => newGameState("onyx-lines"));
  const [history, setHistory] = useState<{ state: GameState; lastMove: LinesCell | null }[]>([]);
  const [lastMove, setLastMove] = useState<LinesCell | null>(null);
  const [resigned, setResigned] = useState(false);
  const [requestedHint, setRequestedHint] = useState<{ cell: LinesCell; text: string } | null>(null);
  // mute state lives in the sound engine; subscribe to it (SSR-safe, no setState-in-effect)
  const muted = useSyncExternalStore(SoundEngine.subscribe, () => SoundEngine.muted, () => false);

  const aiPrng = useRef<() => number>(makePrng(freshSeed()));
  const recordedRef = useRef(false);
  const lastThreatKey = useRef<string | null>(null);

  const aiSeat = other(humanSeat);
  const status: MatchView["status"] = state.phase === "complete" ? "completed" : "in_progress";
  const aiThinking = game === "onyx-lines" && playing && state.phase === "active" && state.toMove === aiSeat && !resigned;

  const view: MatchView = useMemo(
    () => ({
      id: "practice",
      gameId: game,
      status,
      mySeat: humanSeat,
      currentSeq: state.seq,
      winnerSeat: state.winnerSeat,
      players: [
        { seat: humanSeat, handle: copy.match.seatYou, rating: 0, isYou: true },
        { seat: aiSeat, handle: copy.practice.vsAi, rating: 0, isYou: false },
      ],
      state,
      fairness: { commitment: null, revealedSeed: null },
    }),
    [game, status, state, copy, humanSeat, aiSeat],
  );

  // AI turn (Onyx Lines is turn-based) — reply after a short "thinking" beat.
  useEffect(() => {
    if (game !== "onyx-lines" || !playing || resigned) return;
    if (state.phase !== "active" || state.toMove !== aiSeat) return;
    const t = setTimeout(() => {
      const move = chooseLinesMove(state, aiSeat, { tier, prng: aiPrng.current, lastMove });
      if (onyxLines.validateMove(state, move, aiSeat).ok) {
        if (move.cell) setLastMove(move.cell as LinesCell);
        setState(onyxLines.applyMove(state, move, aiSeat));
        SoundEngine.play("place-ai");
      }
    }, 480);
    return () => clearTimeout(t);
  }, [state, game, tier, playing, aiSeat, lastMove, resigned]);

  // contextual hint (lines, on the human's turn)
  const autoHint = useMemo<{ cell: LinesCell | null; text: string } | null>(() => {
    if (state.phase !== "active" || game !== "onyx-lines" || state.toMove !== humanSeat) return null;
    const threat = detectLinesThreat(state, humanSeat);
    if (threat) return { cell: threat.cell, text: copy.hints.linesBlock.replace("{cell}", linesCellLabel(threat.cell)) };
    return { cell: null, text: copy.hints.linesYourTurn };
  }, [state, game, humanSeat, copy]);

  // threat sound (once per new threat)
  useEffect(() => {
    const threat = autoHint && autoHint.cell ? `${autoHint.cell.r},${autoHint.cell.c}` : null;
    if (threat && threat !== lastThreatKey.current) SoundEngine.play("threat");
    lastThreatKey.current = threat;
  }, [autoHint]);

  // end-of-game outcome
  const outcome: ResultOutcome | null = useMemo(() => {
    if (resigned) return "loss";
    if (state.phase !== "complete") return null;
    if (state.winnerSeat === null) return "tie";
    return state.winnerSeat === humanSeat ? "win" : "loss";
  }, [state, humanSeat, resigned]);

  // sound + record once on game end
  useEffect(() => {
    if (!playing || !outcome || recordedRef.current) return;
    recordedRef.current = true;
    SoundEngine.play(outcome === "win" ? "win" : "loss");
    recordOutcome(game, tier, outcome);
  }, [outcome, playing, game, tier]);

  const beginGame = useCallback(() => {
    const seat: Seat =
      game === "onyx-cards" ? 0 : side === "alabaster" ? 1 : side === "random" ? ((freshSeed().charCodeAt(0) % 2) as Seat) : 0;
    aiPrng.current = makePrng(freshSeed());
    recordedRef.current = false;
    lastThreatKey.current = null;
    setHumanSeat(seat);
    setState(newGameState(game));
    setHistory([]);
    setLastMove(null);
    setResigned(false);
    setRequestedHint(null);
    setPlaying(true);
  }, [game, side]);

  const rematch = useCallback(() => {
    aiPrng.current = makePrng(freshSeed());
    recordedRef.current = false;
    lastThreatKey.current = null;
    setState(newGameState(game));
    setHistory([]);
    setLastMove(null);
    setResigned(false);
    setRequestedHint(null);
    SoundEngine.play("ui");
  }, [game]);

  const onMove = useCallback(
    (move: Record<string, unknown>) => {
      if (state.phase !== "active" || resigned) return;
      const human = move as unknown as GameMove;
      const snapshot = { state, lastMove };
      if (game === "onyx-lines") {
        if (!onyxLines.validateMove(state, human, humanSeat).ok) return;
        setHistory((h) => [...h.slice(-40), snapshot]);
        if (move.cell) setLastMove(move.cell as LinesCell);
        setRequestedHint(null);
        setState(onyxLines.applyMove(state, human, humanSeat));
        SoundEngine.play("place");
        return;
      }
      if (!onyxCards.validateMove(state, human, 0).ok) return;
      setHistory((h) => [...h.slice(-40), snapshot]);
      const aiMove = chooseCardsCommit(state, 1, cardsDiff(tier));
      let next = onyxCards.applyMove(state, human, 0);
      if (onyxCards.validateMove(next, aiMove, 1).ok) next = onyxCards.applyMove(next, aiMove, 1);
      setState(next);
      SoundEngine.play("place");
    },
    [state, game, tier, humanSeat, lastMove, resigned],
  );

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1]!;
      setState(prev.state);
      setLastMove(prev.lastMove);
      setRequestedHint(null);
      SoundEngine.play("ui-secondary");
      return h.slice(0, -1);
    });
  }, []);

  const askHint = useCallback(() => {
    if (game !== "onyx-lines" || state.phase !== "active") return;
    const best = bestLinesMove(state, humanSeat);
    setRequestedHint({ cell: best.cell, text: copy.practice.hintReasons[best.reason] });
    SoundEngine.play("ui");
  }, [game, state, humanSeat, copy]);

  const toggleSound = useCallback(() => {
    SoundEngine.toggleMute();
    if (!SoundEngine.muted) SoundEngine.play("ui");
  }, []);

  // ---- selection screen ----
  if (!playing) {
    const games: GameId[] = ["onyx-lines", "onyx-cards"];
    const tiers: { id: LinesTier; label: string; body: string }[] = [
      { id: "gentle", label: copy.practice.gentle, body: copy.practice.gentleBody },
      { id: "novice", label: copy.practice.novice, body: copy.practice.novicebody },
      { id: "even", label: copy.practice.even, body: copy.practice.evenBody },
      { id: "sharp", label: copy.practice.sharp, body: copy.practice.sharpBody },
      { id: "expert", label: copy.practice.expert, body: copy.practice.expertbody },
    ];
    const sides: { id: Side; label: string }[] = [
      { id: "onyx", label: copy.practice.sideOnyx },
      { id: "alabaster", label: copy.practice.sideAlabaster },
      { id: "random", label: copy.practice.sideRandom },
    ];
    const rec = getRec(loadRecords(), game, tier);
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
                <span style={{ color: "var(--acct-muted)", fontSize: 13, fontWeight: 400 }}>{copy.games[g].description}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p style={{ margin: "0 0 8px", fontWeight: 600, color: "var(--acct-ink)" }}>{copy.practice.difficultyLabel}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {tiers.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setTier(d.id)}
                className={`acct-arena-btn${tier === d.id ? " acct-arena-btn--accent" : ""}`}
                title={d.body}
              >
                {d.label}
              </button>
            ))}
          </div>
          <p style={{ margin: "8px 0 0", color: "var(--acct-muted)", fontSize: 13 }}>{tiers.find((d) => d.id === tier)?.body}</p>
          <div className="acct-records" style={{ marginTop: 10 }}>
            <span className="acct-records__chip">
              {copy.practice.records} <strong>{rec.w}</strong>·{rec.l}·{rec.t}
            </span>
            <span className="acct-records__chip">
              {copy.practice.streak} <strong>{rec.streak}</strong>
            </span>
            <span className="acct-records__chip">
              {copy.practice.best} <strong>{rec.best}</strong>
            </span>
          </div>
        </div>

        {game === "onyx-lines" ? (
          <div>
            <p style={{ margin: "0 0 8px", fontWeight: 600, color: "var(--acct-ink)" }}>{copy.practice.pickSide}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {sides.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSide(s.id)}
                  className={`acct-arena-btn${side === s.id ? " acct-arena-btn--accent" : ""}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" className="acct-arena-btn acct-arena-btn--accent" onClick={beginGame}>
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

  // ---- playing screen ----
  const banner =
    game === "onyx-lines"
      ? state.toMove === humanSeat
        ? copy.match.yourTurn
        : copy.practice.thinking
      : copy.match.yourTurn;
  const shownHint = requestedHint ?? autoHint;

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 760, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: "var(--acct-ink)" }}>{copy.games[game].name}</p>
          <p style={{ margin: "2px 0 0", color: "var(--acct-muted)", fontSize: 13 }}>
            {copy.practice.vsAi} · {copy.practice[tier]}
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

      <GoalStrip gameId={game} mySeat={humanSeat} copy={copy} />

      {game === "onyx-lines" ? (
        <OnyxLinesBoard
          view={view}
          copy={copy}
          onMove={onMove}
          busy={aiThinking || !!outcome}
          lastMove={lastMove}
          hintCell={shownHint?.cell ?? null}
        />
      ) : (
        <OnyxCardsTable view={view} copy={copy} onMove={onMove} busy={!!outcome} />
      )}

      {outcome ? (
        <ResultToast
          outcome={outcome}
          copy={copy}
          detail={`${copy.practice.vsAi} · ${copy.practice[tier]}`}
          onRematch={rematch}
          onExit={() => setPlaying(false)}
        />
      ) : shownHint ? (
        <HintBox>{shownHint.text}</HintBox>
      ) : null}

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" className="acct-arena-btn" onClick={rematch}>
          {copy.practice.newGame}
        </button>
        {game === "onyx-lines" && !outcome ? (
          <button type="button" className="acct-arena-btn" onClick={askHint}>
            {copy.practice.hint}
          </button>
        ) : null}
        <button type="button" className="acct-arena-btn" onClick={undo} disabled={history.length === 0 || !!outcome}>
          {copy.practice.undo}
        </button>
        {!outcome ? (
          <button type="button" className="acct-arena-btn" onClick={() => setResigned(true)}>
            {copy.practice.resign}
          </button>
        ) : null}
        <button type="button" className="acct-arena-btn" onClick={() => setPlaying(false)}>
          {copy.practice.backToArena}
        </button>
        <span className="acct-sound">
          <button
            type="button"
            role="switch"
            aria-checked={!muted}
            aria-label={copy.practice.sound}
            className="acct-sound__btn"
            onClick={toggleSound}
          >
            <span aria-hidden>{muted ? "🔇" : "🔊"}</span>
            {copy.practice.sound}
          </button>
        </span>
        <Coach gameId={game} copy={copy} />
      </div>
    </div>
  );
}
