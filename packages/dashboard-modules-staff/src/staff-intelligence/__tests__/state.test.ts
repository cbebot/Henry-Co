import { test } from "node:test";
import assert from "node:assert/strict";

import { visibleRecommendationKeys, type RecommendationStateRow } from "../data";

const NOW = new Date("2026-09-20T12:00:00.000Z");
const KEYS = ["card.a", "card.b", "card.c", "card.d"];

function row(
  recommendationKey: string,
  status: RecommendationStateRow["status"],
  snoozeUntil: string | null = null,
): RecommendationStateRow {
  return { recommendationKey, status, snoozeUntil };
}

test("a card with no persisted state is shown", () => {
  assert.deepEqual(visibleRecommendationKeys(KEYS, [], NOW), KEYS);
});

test("an OPEN card stays visible", () => {
  assert.deepEqual(visibleRecommendationKeys(["card.a"], [row("card.a", "open")], NOW), ["card.a"]);
});

test("DISMISSED and ACCEPTED cards stay gone", () => {
  const state = [row("card.a", "dismissed"), row("card.b", "accepted")];
  assert.deepEqual(visibleRecommendationKeys(KEYS, state, NOW), ["card.c", "card.d"]);
});

test("a SNOOZED card is hidden until its wake time, then returns", () => {
  const future = new Date(NOW.getTime() + 2 * 86_400_000).toISOString();
  const past = new Date(NOW.getTime() - 60_000).toISOString();

  assert.deepEqual(
    visibleRecommendationKeys(["card.a"], [row("card.a", "snoozed", future)], NOW),
    [],
    "still snoozed",
  );
  assert.deepEqual(
    visibleRecommendationKeys(["card.a"], [row("card.a", "snoozed", past)], NOW),
    ["card.a"],
    "the snooze has elapsed — the card must come back",
  );
});

test("a snooze with a missing or unparseable wake time RE-SURFACES rather than vanishing", () => {
  // Failing the other way would turn a "remind me later" into a permanent
  // dismissal the operator never chose — silently losing a real signal.
  for (const bad of [null, "", "not-a-date", "0000-13-45"]) {
    assert.deepEqual(
      visibleRecommendationKeys(["card.a"], [row("card.a", "snoozed", bad)], NOW),
      ["card.a"],
      `a snooze with wake time ${JSON.stringify(bad)} must re-surface`,
    );
  }
});

test("the boundary is inclusive — a card due exactly now comes back", () => {
  assert.deepEqual(
    visibleRecommendationKeys(["card.a"], [row("card.a", "snoozed", NOW.toISOString())], NOW),
    ["card.a"],
  );
});

test("state for OTHER cards never affects a card's visibility", () => {
  const state = [row("card.zz", "dismissed"), row("card.yy", "accepted")];
  assert.deepEqual(visibleRecommendationKeys(KEYS, state, NOW), KEYS);
});

test("an unknown status is treated as visible, not silently hidden", () => {
  const state = [{ recommendationKey: "card.a", status: "weird", snoozeUntil: null }];
  assert.deepEqual(
    visibleRecommendationKeys(["card.a"], state as unknown as RecommendationStateRow[], NOW),
    ["card.a"],
    "an unrecognised status must never hide a suggestion",
  );
});

test("order is preserved so the rail does not reshuffle between renders", () => {
  const state = [row("card.b", "dismissed")];
  assert.deepEqual(visibleRecommendationKeys(KEYS, state, NOW), ["card.a", "card.c", "card.d"]);
});
