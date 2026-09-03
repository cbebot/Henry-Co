/**
 * @henryco/gaming-arena — type-only entry (`@henryco/gaming-arena/types`).
 *
 * Erased at runtime; safe to import from any runtime (client, edge, node, worker).
 * The pure rules (`.`) and the server-authoritative half (`./server`) both build
 * on these contracts. No value exports here — runtime constants live next to the
 * code that owns them (GAME_IDS in catalog, ALL_MATCH_STATUSES in state-machine).
 *
 * Pass 1 (V3-GAMING-01) is the FREE-PLAY foundation: no money, no stake, no
 * escrow. There is deliberately NO stake/wallet/escrow type in this file — the
 * money layer is a separate, later, legally-gated pass (ARCHITECTURE.md §9, §12).
 */

/** The launch catalog. Onyx Quiz (the third design title) lands in Pass 2. */
export type GameId = "onyx-lines" | "onyx-cards";

/**
 * Match lifecycle. One-directional state machine, enforced two ways
 * (in-process `assertMatchTransition` + DB `enforce_gaming_match_transition`).
 */
export type MatchStatus =
  | "lobby"
  | "matchmaking"
  | "in_progress"
  | "completed"
  | "abandoned";

/** Head-to-head: exactly two seats. Seat is the authoritative player index. */
export type Seat = 0 | 1;

/** A seated player. `userId` is the auth identity; never an email/handle here. */
export type PlayerSeat = {
  userId: string;
  seat: Seat;
};

/**
 * A proposed move. Game-specific shape behind a discriminating `type`. The
 * server NEVER trusts a move's claimed author — the actor is resolved from the
 * session and passed as `bySeat` to the validator/reducer.
 */
export type GameMove = {
  type: string;
  [key: string]: unknown;
};

/**
 * Authoritative game state. The envelope is common; `board` is the
 * game-specific payload, opaque to the envelope and narrowed inside each
 * GameDefinition. The server is the only writer of state; the client holds the
 * same pure rules only to render and (optionally) locally predict.
 */
export type GameState = {
  gameId: GameId;
  /** index === seat number */
  seats: PlayerSeat[];
  /** whose turn it is; null for simultaneous-commit phases or terminal states */
  toMove: Seat | null;
  /** monotonic count of applied moves — the append-only move-log length */
  seq: number;
  phase: "active" | "complete";
  /** set when phase === "complete"; null while active, and null+complete === tie */
  winnerSeat: Seat | null;
  /** game-specific board/round payload */
  board: unknown;
  /** public fairness binding for RNG games (commitment is public from creation) */
  fairness: GameFairnessState | null;
};

/** Public, verifiable fairness binding carried in state (never the secret seed). */
export type GameFairnessState = {
  /** sha256(serverSeed) hex — published at match creation, before any move */
  commitment: string;
  /** per-seat client seed contributions (index === seat) */
  clientSeeds: string[];
  /** revealed server seed (hex) — null until the match completes */
  revealedServerSeed: string | null;
};

/** Terminal detection + winner resolution result (server-side authority). */
export type GameOutcome =
  | { kind: "win"; winnerSeat: Seat }
  | { kind: "tie" }
  | { kind: "ongoing" };

/** Pure move validation verdict. `reason` is a stable machine code, not prose. */
export type MoveValidation = { ok: true } | { ok: false; reason: string };

/** Pure validator: is this proposed move legal in this state, made by this seat? */
export type GameMoveValidator = (
  state: GameState,
  move: GameMove,
  bySeat: Seat,
) => MoveValidation;

/**
 * A catalog game. All five functions are PURE (no IO, no Date.now, no crypto
 * side-effects beyond the deterministic seed already in state) so the server's
 * authoritative execution and a third-party verifier compute identical results.
 */
export type GameDefinition = {
  id: GameId;
  /** i18n key into surface:gaming — never a hardcoded display string */
  nameKey: string;
  descriptionKey: string;
  minPlayers: 2;
  maxPlayers: number;
  /** design-stated skill predominance; feeds the L7 review. NOT a legal ruling. */
  skillWeight: number;
  /** whether this game consumes the provably-fair RNG (false for Onyx Lines) */
  usesRandomness: boolean;
  /** path to the counsel-reviewed rules doc — the L7 input artifact */
  rulesDocPath: string;
  validateMove: GameMoveValidator;
  /** deterministic initial state from the derived draw seed + seated players */
  initialState: (drawSeed: string, players: PlayerSeat[]) => GameState;
  /** apply an ALREADY-VALIDATED move (callers must validate first) */
  applyMove: (state: GameState, move: GameMove, bySeat: Seat) => GameState;
  /** terminal detection + winner resolution — server authority */
  resolveOutcome: (state: GameState) => GameOutcome;
};

/* ────────────────────────── Rating / profile views ────────────────────────── */

/** Public projection of a gaming profile (never email/legal name). */
export type GamingProfilePublic = {
  handle: string;
  rating: number;
  wins: number;
  losses: number;
  ties: number;
};

export type EloResult = {
  /** new rating for seat 0 */
  ratingA: number;
  /** new rating for seat 1 */
  ratingB: number;
};

/* ───────────────────────── Realtime / row projections ──────────────────────── */

/** Client-safe projection of a seated player in a live match. */
export type MatchPlayer = {
  id: string;
  matchId: string;
  seat: Seat;
  handle: string;
};

/** Client-safe projection of one authoritative move-log row. */
export type MatchMove = {
  id: string;
  matchId: string;
  seq: number;
  bySeat: Seat;
  move: GameMove;
  stateHash: string;
};

/** Realtime presence row. */
export type MatchPresenceState = {
  userId: string;
  onlineAt: string;
};

/** Client-safe summary of a match (what the participant/public RPCs return). */
export type MatchView = {
  id: string;
  gameId: GameId;
  status: MatchStatus;
  createdBy: string;
  winnerUserId: string | null;
  fairnessCommitment: string | null;
  fairnessRevealedSeed: string | null;
  createdAt: string;
  completedAt: string | null;
};

/* ──────────────────────────── Entry-gate result ────────────────────────────── */

/** Result of the free-play entry gate. Pass 1: logged-in only, no KYC/age/geo. */
export type EntryGateResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "not_authenticated" | "self_excluded" };
