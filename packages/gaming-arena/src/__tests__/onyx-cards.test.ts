import test from "node:test";
import assert from "node:assert/strict";

import {
  onyxCards,
  initialOnyxCardsState,
  cardFacet,
  FACET_BONUS,
  NUM_ROUNDS,
  type CardsBoard,
} from "../catalog/onyx-cards";
import type { GameMove, GameState, PlayerSeat, Seat } from "../types";

const PLAYERS: PlayerSeat[] = [
  { userId: "u0", seat: 0 },
  { userId: "u1", seat: 1 },
];
const SEED_A = "0123456789abcdef".repeat(4);
const SEED_B = "fedcba9876543210".repeat(4);

function commit(state: GameState, seat: Seat, card: number, shadow = false): GameState {
  const move: GameMove = shadow ? { type: "commit", card, shadow: true } : { type: "commit", card };
  const v = onyxCards.validateMove(state, move, seat);
  assert.ok(v.ok, `expected legal commit, got reason=${v.ok ? "" : v.reason}`);
  return onyxCards.applyMove(state, move, seat);
}

function board(state: GameState): CardsBoard {
  return state.board as CardsBoard;
}

test("prize order is deterministic from the draw seed and a true permutation", () => {
  const a1 = board(initialOnyxCardsState(SEED_A, PLAYERS)).prizes;
  const a2 = board(initialOnyxCardsState(SEED_A, PLAYERS)).prizes;
  assert.deepEqual(a1, a2, "same seed -> identical prize order");
  const b = board(initialOnyxCardsState(SEED_B, PLAYERS)).prizes;
  assert.notDeepEqual(a1, b, "different seed -> different order");
  // multiset of prize values is preserved (only the ORDER is random)
  assert.deepEqual(
    a1.map((p) => p.value).sort((x, y) => x - y),
    [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  );
});

test("both players begin with the identical hand (mirror-dealt, no luck of the draw)", () => {
  const b = board(initialOnyxCardsState(SEED_A, PLAYERS));
  assert.deepEqual(b.hands[0], b.hands[1]);
  assert.deepEqual(b.hands[0], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test("higher commit wins the round and scores the prize (+ facet bonus when it matches)", () => {
  let state = initialOnyxCardsState(SEED_A, PLAYERS);
  const prize0 = board(state).prizes[0]!;
  state = commit(state, 0, 10);
  state = commit(state, 1, 1);
  const b = board(state);
  const expectedBonus = cardFacet(10) === prize0.facet ? FACET_BONUS : 0;
  assert.equal(b.scores[0], prize0.value + expectedBonus);
  assert.equal(b.scores[1], 0);
  assert.equal(b.round, 1, "round advanced after both committed");
  assert.equal(b.hands[0].includes(10), false, "the spent card left the hand");
});

test("vein carry: equal commits award nothing and carry onto the next prize", () => {
  let state = initialOnyxCardsState(SEED_A, PLAYERS);
  const prize0 = board(state).prizes[0]!;
  const prize1 = board(state).prizes[1]!;
  state = commit(state, 0, 5);
  state = commit(state, 1, 5);
  let b = board(state);
  assert.deepEqual(b.scores, [0, 0], "tie round awards nothing");
  assert.equal(b.carry, prize0.value, "the prize carries");
  // next round: winner collects prize1 + carried prize0
  state = commit(state, 0, 10);
  state = commit(state, 1, 1);
  b = board(state);
  const bonus = cardFacet(10) === prize1.facet ? FACET_BONUS : 0;
  assert.equal(b.scores[0], prize1.value + prize0.value + bonus);
  assert.equal(b.carry, 0, "carry consumed");
});

test("shadow bid: secretly doubles a card once per match", () => {
  let state = initialOnyxCardsState(SEED_A, PLAYERS);
  const prize0 = board(state).prizes[0]!;
  state = commit(state, 0, 5, true); // effective 10
  state = commit(state, 1, 9); // effective 9 -> loses
  let b = board(state);
  const bonus = cardFacet(5) === prize0.facet ? FACET_BONUS : 0;
  assert.equal(b.scores[0], prize0.value + bonus, "shadow 5 beats 9");
  assert.equal(b.shadowUsed[0], true);
  // a second shadow is rejected
  assert.equal(onyxCards.validateMove(state, { type: "commit", card: 8, shadow: true }, 0).ok, false);
  // but a normal commit is fine
  state = commit(state, 0, 8);
  b = board(state);
  assert.equal(b.committed[0], 8);
});

test("server authority: invalid commits are rejected", () => {
  const state = initialOnyxCardsState(SEED_A, PLAYERS);
  // card not in hand
  assert.deepEqual(onyxCards.validateMove(state, { type: "commit", card: 99 }, 0), {
    ok: false,
    reason: "card_not_in_hand",
  });
  // wrong move type
  assert.deepEqual(onyxCards.validateMove(state, { type: "place" }, 0), {
    ok: false,
    reason: "unknown_move_type",
  });
  // double-commit in the same round
  const after = commit(state, 0, 7);
  assert.deepEqual(onyxCards.validateMove(after, { type: "commit", card: 6 }, 0), {
    ok: false,
    reason: "already_committed_this_round",
  });
});

test("a full match resolves to a determinate, server-decided result", () => {
  // Identical hands (sum 55 each) make "win every round" impossible — the match
  // winner is a function of the (provably-fair) prize order, so we assert a
  // DETERMINATE resolution, not a specific seat.
  let state = initialOnyxCardsState(SEED_A, PLAYERS);
  let allCardsSpent = 0;
  for (let r = 0; r < NUM_ROUNDS; r += 1) {
    const b = board(state);
    const hi = Math.max(...b.hands[0]);
    const lo = Math.min(...b.hands[1]);
    state = commit(state, 0, hi);
    state = commit(state, 1, lo);
    allCardsSpent += 2;
  }
  assert.equal(state.phase, "complete");
  assert.equal(allCardsSpent, 20, "every card was spent across 10 rounds");
  const outcome = onyxCards.resolveOutcome(state);
  assert.ok(outcome.kind === "win" || outcome.kind === "tie", "a determinate outcome");
  if (outcome.kind === "win") {
    assert.equal(state.winnerSeat, outcome.winnerSeat);
  } else {
    assert.equal(state.winnerSeat, null);
  }
});

test("tie-break 1: equal score decided by the higher individual prize won", () => {
  const crafted: GameState = {
    gameId: "onyx-cards",
    seats: PLAYERS,
    toMove: null,
    seq: 0,
    phase: "active", // resolveOutcome computes from a terminal board
    winnerSeat: null,
    fairness: null,
    board: {
      prizes: [],
      round: NUM_ROUNDS,
      scores: [50, 50],
      hands: [[], []],
      committed: [null, null],
      shadowThisRound: [false, false],
      shadowUsed: [false, false],
      carry: 0,
      history: [
        { round: 0, prizeValue: 50, winnerSeat: 0, facetBonus: false, cards: [10, 1], shadow: [false, false] },
        { round: 1, prizeValue: 30, winnerSeat: 1, facetBonus: false, cards: [2, 9], shadow: [false, false] },
        { round: 2, prizeValue: 20, winnerSeat: 1, facetBonus: false, cards: [3, 8], shadow: [false, false] },
      ],
    } satisfies CardsBoard,
  };
  assert.deepEqual(onyxCards.resolveOutcome(crafted), { kind: "win", winnerSeat: 0 });
});

test("tie-break 2: equal score + equal top prize decided by fewest card-value lost", () => {
  const crafted: GameState = {
    gameId: "onyx-cards",
    seats: PLAYERS,
    toMove: null,
    seq: 0,
    phase: "active",
    winnerSeat: null,
    fairness: null,
    board: {
      prizes: [],
      round: NUM_ROUNDS,
      scores: [40, 40], // equal score
      hands: [[], []],
      committed: [null, null],
      shadowThisRound: [false, false],
      shadowUsed: [false, false],
      carry: 0,
      // each wins exactly ONE 40-prize (equal top prize) -> tie-break 1 ties.
      // tie-break 2 = card-value lost: in round1 seat0 spent 1 (lost cheap);
      // in round0 seat1 spent 9 (lost dear). seat0 wasted less -> seat0 wins.
      history: [
        { round: 0, prizeValue: 40, winnerSeat: 0, facetBonus: false, cards: [5, 9], shadow: [false, false] },
        { round: 1, prizeValue: 40, winnerSeat: 1, facetBonus: false, cards: [1, 6], shadow: [false, false] },
      ],
    } satisfies CardsBoard,
  };
  assert.deepEqual(onyxCards.resolveOutcome(crafted), { kind: "win", winnerSeat: 0 });
});
