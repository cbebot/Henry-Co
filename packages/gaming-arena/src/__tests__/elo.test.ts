import test from "node:test";
import assert from "node:assert/strict";

import { applyElo, expectedScore, resultForSeatA, DEFAULT_ELO } from "../rating/elo";

test("equal ratings expect a 0.5 score", () => {
  assert.equal(expectedScore(1200, 1200), 0.5);
});

test("a higher rating expects to win more often", () => {
  assert.ok(expectedScore(1600, 1200) > 0.5);
  assert.ok(expectedScore(1200, 1600) < 0.5);
});

test("winning gains rating; the loser loses the symmetric amount", () => {
  const { ratingA, ratingB } = applyElo(DEFAULT_ELO, DEFAULT_ELO, 1);
  assert.ok(ratingA > DEFAULT_ELO, "winner gains");
  assert.ok(ratingB < DEFAULT_ELO, "loser loses");
  // even ratings + K=32 -> +16 / -16
  assert.equal(ratingA, 1216);
  assert.equal(ratingB, 1184);
});

test("a tie between equal players is a no-op", () => {
  const { ratingA, ratingB } = applyElo(1200, 1200, 0.5);
  assert.equal(ratingA, 1200);
  assert.equal(ratingB, 1200);
});

test("beating a much weaker player yields a small gain", () => {
  const strong = applyElo(1800, 1200, 1);
  assert.ok(strong.ratingA - 1800 < 16, "small gain vs a weaker opponent");
  assert.ok(strong.ratingA > 1800);
});

test("an upset (weaker beats stronger) yields a large swing", () => {
  const upset = applyElo(1200, 1800, 1);
  assert.ok(upset.ratingA - 1200 > 16, "large gain on an upset");
});

test("resultForSeatA maps winner seat to the seat-A score", () => {
  assert.equal(resultForSeatA(0), 1);
  assert.equal(resultForSeatA(1), 0);
  assert.equal(resultForSeatA(null), 0.5);
});
