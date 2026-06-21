import test from "node:test";
import assert from "node:assert/strict";

import { CATALOG, GAME_IDS, getGame, isGameId } from "../catalog/index";
import type { GameId, PlayerSeat } from "../types";

const PLAYERS: PlayerSeat[] = [
  { userId: "u0", seat: 0 },
  { userId: "u1", seat: 1 },
];

test("the catalog registers exactly the Pass-1 titles", () => {
  assert.deepEqual([...GAME_IDS].sort(), ["onyx-cards", "onyx-lines"]);
  assert.deepEqual(Object.keys(CATALOG).sort(), ["onyx-cards", "onyx-lines"]);
});

test("getGame / isGameId behave at the server boundary", () => {
  assert.equal(getGame("onyx-lines").id, "onyx-lines");
  assert.equal(getGame("onyx-cards").id, "onyx-cards");
  assert.equal(isGameId("onyx-lines"), true);
  assert.equal(isGameId("totally-not-a-game"), false);
});

test("every catalog entry is well-formed and i18n-keyed (no hardcoded display names)", () => {
  for (const id of GAME_IDS) {
    const g = getGame(id as GameId);
    assert.equal(g.minPlayers, 2);
    assert.equal(g.maxPlayers, 2);
    assert.ok(g.skillWeight > 0 && g.skillWeight <= 1);
    assert.match(g.nameKey, /^games\./, "name must be an i18n key, not a literal");
    assert.match(g.descriptionKey, /^games\./);
    assert.ok(g.rulesDocPath.startsWith("docs/gaming/"));
    // initialState produces a valid, fresh, active state
    const state = g.initialState("0123456789abcdef".repeat(4), PLAYERS);
    assert.equal(state.gameId, id);
    assert.equal(state.phase, "active");
    assert.equal(state.seq, 0);
    assert.equal(state.winnerSeat, null);
    assert.equal(state.seats.length, 2);
    assert.deepEqual(g.resolveOutcome(state), { kind: "ongoing" });
  }
});

test("only Onyx Cards consumes randomness; Onyx Lines is zero-chance", () => {
  assert.equal(getGame("onyx-lines").usesRandomness, false);
  assert.equal(getGame("onyx-lines").skillWeight, 1.0);
  assert.equal(getGame("onyx-cards").usesRandomness, true);
});
