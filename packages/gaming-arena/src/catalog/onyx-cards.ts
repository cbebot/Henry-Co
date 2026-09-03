/**
 * Onyx Cards — simultaneous-selection duel (GAME-CATALOG.md §2).
 *
 * Both players hold the IDENTICAL hand (value cards 1..10) and compete over a
 * public prize track whose ORDER is the single chance element — symmetric (same
 * for both) and provably fair (commit-reveal). "The same problem, solved by two
 * minds": the only variable is decision quality.
 *
 * Originality markers:
 *  - facet bonus  — winning with a card whose facet matches the prize's facet scores extra.
 *  - vein carry   — equal commits award nothing; the prize carries onto the next round.
 *  - shadow bid   — once per match, secretly double a committed card; revealed only on a loss.
 *
 * SIMULTANEITY in a server-authoritative, append-only model: each round both
 * seats append a "commit" move; the round resolves inside the SECOND committer's
 * applyMove (resolution is order-independent — compare A vs B). The opponent's
 * pending commit is redacted by the server projection until both are in (the
 * pure engine sees full state; the read layer hides). The prize order is derived
 * purely from the commit-reveal draw seed (see initialOnyxCardsState).
 *
 * All functions are PURE: a verifier with the revealed seed reproduces the exact
 * prize order and replays every round.
 */

import { makePrng, shuffleWithPrng } from "../fairness/prng";
import type {
  GameDefinition,
  GameMove,
  GameOutcome,
  GameState,
  MoveValidation,
  PlayerSeat,
  Seat,
} from "../types";

export const NUM_ROUNDS = 10;
export const FACET_BONUS = 3;
const FACET_COUNT = 3;
/** Point values of the 10 prizes (pre-shuffle). Order is the provably-fair element. */
const PRIZE_VALUES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
/** The shared starting hand (mirror-dealt, no luck of the draw). */
const STARTING_HAND = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

type Prize = { value: number; facet: number };

type RoundResult = {
  round: number;
  prizeValue: number; // value actually awarded (incl. carry), 0 on a carry round
  winnerSeat: Seat | null; // null === carry (tie)
  facetBonus: boolean;
  cards: [number, number]; // committed cards (base values), index === seat
  shadow: [boolean, boolean];
};

export type CardsBoard = {
  prizes: Prize[]; // shuffled order
  round: number; // 0..NUM_ROUNDS
  scores: [number, number];
  hands: [number[], number[]];
  committed: [number | null, number | null];
  shadowThisRound: [boolean, boolean];
  shadowUsed: [boolean, boolean];
  carry: number;
  history: RoundResult[];
};

function readBoard(state: GameState): CardsBoard {
  return state.board as CardsBoard;
}

/** Deterministic facet of a value card: some cards share a facet. */
export function cardFacet(value: number): number {
  return (value - 1) % FACET_COUNT;
}

function buildPrizes(): Prize[] {
  return PRIZE_VALUES.map((value, i) => ({ value, facet: i % FACET_COUNT }));
}

function cloneBoard(board: CardsBoard): CardsBoard {
  return {
    prizes: board.prizes.map((p) => ({ ...p })),
    round: board.round,
    scores: [...board.scores] as [number, number],
    hands: [[...board.hands[0]], [...board.hands[1]]] as [number[], number[]],
    committed: [...board.committed] as [number | null, number | null],
    shadowThisRound: [...board.shadowThisRound] as [boolean, boolean],
    shadowUsed: [...board.shadowUsed] as [boolean, boolean],
    carry: board.carry,
    history: board.history.map((h) => ({ ...h, cards: [...h.cards] as [number, number], shadow: [...h.shadow] as [boolean, boolean] })),
  };
}

function effectiveValue(card: number, shadow: boolean): number {
  return card * (shadow ? 2 : 1);
}

function validateMove(state: GameState, move: GameMove, bySeat: Seat): MoveValidation {
  if (state.phase !== "active") return { ok: false, reason: "match_not_active" };
  if (move.type !== "commit") return { ok: false, reason: "unknown_move_type" };
  const board = readBoard(state);
  if (board.committed[bySeat] !== null) return { ok: false, reason: "already_committed_this_round" };
  const card = move.card;
  if (typeof card !== "number" || !Number.isInteger(card)) return { ok: false, reason: "malformed_card" };
  if (!board.hands[bySeat].includes(card)) return { ok: false, reason: "card_not_in_hand" };
  const shadow = move.shadow === true;
  if (shadow && board.shadowUsed[bySeat]) return { ok: false, reason: "shadow_already_used" };
  return { ok: true };
}

function resolveRound(board: CardsBoard): void {
  const a = board.committed[0]!;
  const b = board.committed[1]!;
  const shadowA = board.shadowThisRound[0];
  const shadowB = board.shadowThisRound[1];
  const effA = effectiveValue(a, shadowA);
  const effB = effectiveValue(b, shadowB);
  const prize = board.prizes[board.round]!;
  const prizeValue = prize.value + board.carry;

  let winnerSeat: Seat | null;
  let facetBonus = false;

  if (effA === effB) {
    // vein carry — equal commits award nothing; the prize carries forward.
    winnerSeat = null;
    board.carry = prizeValue;
  } else {
    winnerSeat = effA > effB ? 0 : 1;
    const winningCard = winnerSeat === 0 ? a : b;
    facetBonus = cardFacet(winningCard) === prize.facet;
    board.scores[winnerSeat] += prizeValue + (facetBonus ? FACET_BONUS : 0);
    board.carry = 0;
  }

  board.history.push({
    round: board.round,
    prizeValue: winnerSeat === null ? 0 : prizeValue,
    winnerSeat,
    facetBonus,
    cards: [a, b],
    shadow: [shadowA, shadowB],
  });

  board.round += 1;
  board.committed = [null, null];
  board.shadowThisRound = [false, false];
}

function applyMove(state: GameState, move: GameMove, bySeat: Seat): GameState {
  const board = cloneBoard(readBoard(state));
  const card = move.card as number;
  const shadow = move.shadow === true;

  // spend the card + record the commit
  const hand = board.hands[bySeat];
  const idx = hand.indexOf(card);
  if (idx >= 0) hand.splice(idx, 1);
  board.committed[bySeat] = card;
  board.shadowThisRound[bySeat] = shadow;
  if (shadow) board.shadowUsed[bySeat] = true;

  // resolve the round once both seats have committed
  if (board.committed[0] !== null && board.committed[1] !== null) {
    resolveRound(board);
  }

  if (board.round >= NUM_ROUNDS) {
    const outcome = resolveCards(board);
    return {
      ...state,
      board,
      toMove: null,
      seq: state.seq + 1,
      phase: "complete",
      winnerSeat: outcome.kind === "win" ? outcome.winnerSeat : null,
    };
  }

  // simultaneous-commit phase: neither seat has the turn exclusively
  return { ...state, board, toMove: null, seq: state.seq + 1 };
}

function resolveCards(board: CardsBoard): GameOutcome {
  const [sa, sb] = board.scores;
  if (sa > sb) return { kind: "win", winnerSeat: 0 };
  if (sb > sa) return { kind: "win", winnerSeat: 1 };

  // tie-break 1: who won the higher-value individual prize
  const highest = (seat: Seat): number =>
    board.history.reduce((m, h) => (h.winnerSeat === seat ? Math.max(m, h.prizeValue) : m), 0);
  const ha = highest(0);
  const hb = highest(1);
  if (ha > hb) return { kind: "win", winnerSeat: 0 };
  if (hb > ha) return { kind: "win", winnerSeat: 1 };

  // tie-break 2: fewest card-value spent on LOST rounds (didn't waste high cards)
  const lossSpend = (seat: Seat): number =>
    board.history.reduce(
      (m, h) => (h.winnerSeat !== null && h.winnerSeat !== seat ? m + h.cards[seat] : m),
      0,
    );
  const la = lossSpend(0);
  const lb = lossSpend(1);
  if (la < lb) return { kind: "win", winnerSeat: 0 };
  if (lb < la) return { kind: "win", winnerSeat: 1 };

  return { kind: "tie" };
}

function resolveOutcome(state: GameState): GameOutcome {
  if (state.phase === "complete") {
    if (state.winnerSeat === null) return { kind: "tie" };
    return { kind: "win", winnerSeat: state.winnerSeat };
  }
  const board = readBoard(state);
  if (board.round >= NUM_ROUNDS) return resolveCards(board);
  return { kind: "ongoing" };
}

/** Build the initial state. `drawSeed` (from commit-reveal) seeds the prize order. */
function initialState(drawSeed: string, players: PlayerSeat[]): GameState {
  const prng = makePrng(drawSeed);
  const prizes = shuffleWithPrng(buildPrizes(), prng);
  const board: CardsBoard = {
    prizes,
    round: 0,
    scores: [0, 0],
    hands: [[...STARTING_HAND], [...STARTING_HAND]],
    committed: [null, null],
    shadowThisRound: [false, false],
    shadowUsed: [false, false],
    carry: 0,
    history: [],
  };
  return {
    gameId: "onyx-cards",
    seats: players,
    toMove: null, // simultaneous commit — neither seat has an exclusive turn
    seq: 0,
    phase: "active",
    winnerSeat: null,
    board,
    fairness: null, // the server attaches the public commitment to the MatchView
  };
}

/** Convenience for tests/verifier: build state directly from a draw seed. */
export const initialOnyxCardsState = initialState;

export const onyxCards: GameDefinition = {
  id: "onyx-cards",
  nameKey: "games.onyxCards.name",
  descriptionKey: "games.onyxCards.description",
  minPlayers: 2,
  maxPlayers: 2,
  skillWeight: 0.92,
  usesRandomness: true,
  rulesDocPath: "docs/gaming/onyx-cards-rules.md",
  validateMove,
  initialState,
  applyMove,
  resolveOutcome,
};
