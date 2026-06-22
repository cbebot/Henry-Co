import { test } from "node:test";
import assert from "node:assert/strict";

import { onyxCards, type CardsBoard } from "../catalog/onyx-cards";
import type { GameState } from "../types";
import { chooseCardsCommit, CARDS_DIFFICULTIES } from "../ai/onyx-cards-ai";

const FULL_HAND = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const TEN_PRIZES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

function cardsState(prizeValues: number[], opts?: Partial<CardsBoard>): GameState {
  const board: CardsBoard = {
    prizes: prizeValues.map((value) => ({ value, facet: 0 })),
    round: 0,
    scores: [0, 0],
    hands: [[...FULL_HAND], [...FULL_HAND]],
    committed: [null, null],
    shadowThisRound: [false, false],
    shadowUsed: [false, false],
    carry: 0,
    history: [],
    ...opts,
  };
  return {
    gameId: "onyx-cards",
    seats: [
      { userId: "you", seat: 0 },
      { userId: "ai", seat: 1 },
    ],
    toMove: null,
    seq: 0,
    phase: "active",
    winnerSeat: null,
    board,
    fairness: null,
  };
}

test("even spends its top card on the highest current prize", () => {
  const st = cardsState([100, 10, 20, 30, 40, 50, 60, 70, 80, 90]); // round 0 prize is the max
  const move = chooseCardsCommit(st, 0, "even");
  assert.equal(move.type, "commit");
  assert.equal(move.card, 10);
});

test("even spends its lowest card on the lowest current prize", () => {
  const st = cardsState([10, 100, 90, 80, 70, 60, 50, 40, 30, 20]); // round 0 prize is the min
  const move = chooseCardsCommit(st, 0, "even");
  assert.equal(move.card, 1);
});

test("chooseCardsCommit only commits a held card, at every difficulty", () => {
  const st = cardsState(TEN_PRIZES, { hands: [[2, 5, 9], [2, 5, 9]], round: 7 });
  for (const d of CARDS_DIFFICULTIES) {
    const move = chooseCardsCommit(st, 0, d);
    assert.equal(move.type, "commit");
    assert.ok([2, 5, 9].includes(move.card as number), `card ${move.card} not in hand at ${d}`);
    const v = onyxCards.validateMove(st, move, 0);
    assert.equal(v.ok, true, `illegal at ${d}: ${JSON.stringify(move)}`);
  }
});

test("never shadow-bids once the shadow is spent", () => {
  const st = cardsState([100, 90, 80, 70, 60, 50, 40, 30, 20, 10], { shadowUsed: [true, true] });
  const move = chooseCardsCommit(st, 0, "sharp");
  assert.notEqual(move.shadow, true);
});
