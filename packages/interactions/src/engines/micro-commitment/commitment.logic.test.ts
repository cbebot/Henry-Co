import { test } from "node:test";
import assert from "node:assert/strict";
import { nextOffer, COMMITMENT_TIERS, WEEK_MS } from "./commitment.logic";

const NOW = 1_000_000_000;

test("ladder order is anonymous → cookie → identified → account → verified → subscribed", () => {
  assert.deepEqual(
    [...COMMITMENT_TIERS],
    ["anonymous", "cookie", "identified", "account", "verified", "subscribed"],
  );
});

test("offers exactly the next rung, never two above", () => {
  const offer = nextOffer("anonymous", [], NOW, "s1");
  assert.ok(offer);
  assert.equal(offer.toTier, "cookie");
});

test("never offers a rung the user has already cleared", () => {
  const offer = nextOffer("account", [], NOW, "s1");
  assert.ok(offer);
  assert.equal(offer.toTier, "verified");
});

test("top of the ladder → no offer", () => {
  assert.equal(nextOffer("subscribed", [], NOW, "s1"), null);
});

test("no second ask for the same rung in the same session", () => {
  const history = [{ toTier: "cookie" as const, at: NOW - 60_000, sessionId: "s1" }];
  assert.equal(nextOffer("anonymous", history, NOW, "s1"), null);
  // …but a NEW session may ask once more:
  const again = nextOffer("anonymous", history, NOW, "s2");
  assert.ok(again);
  assert.equal(again.toTier, "cookie");
});

test("no third ask for the same rung within a week", () => {
  const history = [
    { toTier: "cookie" as const, at: NOW - 6 * 24 * 3600 * 1000, sessionId: "s1" },
    { toTier: "cookie" as const, at: NOW - 2 * 24 * 3600 * 1000, sessionId: "s2" },
  ];
  assert.equal(nextOffer("anonymous", history, NOW, "s3"), null);
  // once the older ask ages past a week, one more is allowed:
  const later = NOW - 6 * 24 * 3600 * 1000 + WEEK_MS + 1;
  const offer = nextOffer("anonymous", history, later, "s3");
  assert.ok(offer);
});
