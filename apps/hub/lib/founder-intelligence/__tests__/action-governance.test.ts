import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

import {
  FOUNDER_ACTION_GOVERNANCE,
  FORBIDDEN_MONEY_PARAM_KEYS,
  governanceParamKeys,
} from "../action-governance";

/**
 * F3 governance gate — the executable proof of the money-invariant fixes from
 * the adversarial audit (2026-07-10). If a future catalog entry breaks any of
 * these, this test fails and the PR is blocked.
 */

test("every entry's paramsSchema is a zod object and is STRICT (unknown keys rejected)", () => {
  for (const g of FOUNDER_ACTION_GOVERNANCE) {
    const parsedOk = g.paramsSchema.safeParse(sampleFor(g.key));
    assert.ok(parsedOk.success, `${g.key} should accept its own sample: ${JSON.stringify(parsedOk)}`);
    // Strict: an extra key must be REJECTED, not stripped-and-accepted.
    const withExtra = { ...sampleFor(g.key), __injected: "x" };
    const parsedExtra = g.paramsSchema.safeParse(withExtra);
    assert.ok(!parsedExtra.success, `${g.key} must reject unknown keys (schema not .strict())`);
  }
});

test("NO entry declares a free money-amount param the AI could fill", () => {
  for (const g of FOUNDER_ACTION_GOVERNANCE) {
    for (const key of governanceParamKeys(g)) {
      assert.ok(
        !FORBIDDEN_MONEY_PARAM_KEYS.includes(key.toLowerCase()),
        `${g.key} declares forbidden money param "${key}" — money amounts are server-fetched, never AI-filled`,
      );
    }
  }
});

test("moneyAdjacent ⇒ requiresReauth (reversible never substitutes for no cash effect)", () => {
  for (const g of FOUNDER_ACTION_GOVERNANCE) {
    if (g.moneyAdjacent) {
      assert.equal(g.requiresReauth, true, `${g.key} is moneyAdjacent but not requiresReauth`);
    }
  }
});

test("every entry is founder-only (never inherits a division-role union)", () => {
  for (const g of FOUNDER_ACTION_GOVERNANCE) {
    assert.equal(g.ownerPermission, "founder-only", `${g.key} must be founder-only`);
  }
});

test("every entry declares at least one driftKey and a valid tranche", () => {
  for (const g of FOUNDER_ACTION_GOVERNANCE) {
    assert.ok(g.driftKeys.length >= 1, `${g.key} needs at least one driftKey`);
    assert.ok(g.tranche === 1 || g.tranche === 2, `${g.key} tranche must be 1 or 2`);
  }
});

test("action keys are unique", () => {
  const keys = FOUNDER_ACTION_GOVERNANCE.map((g) => g.key);
  assert.equal(new Set(keys).size, keys.length, "duplicate action key");
});

test("the forbidden-money-param list covers the obvious money words", () => {
  // These invariant fields are single-sourced: the runtime FOUNDER_ACTION_CATALOG
  // spreads each governance descriptor, so asserting them here asserts them for
  // the catalog too (a catalog entry cannot exist without a governance spread).
  for (const word of ["amount", "fee", "cost", "charge", "balance", "payout", "price", "value"]) {
    assert.ok(
      FORBIDDEN_MONEY_PARAM_KEYS.includes(word),
      `"${word}" should be a forbidden money param`,
    );
  }
});

function sampleFor(key: string): Record<string, unknown> {
  switch (key) {
    case "owner.brand.settings.update":
      return { field: "brand_title", text: "Henry Onyx" };
    case "owner.staff.status.toggle":
      return { userId: "3f1a9c7e-2b4d-4e6a-9c8b-1d2e3f4a5b6c", intent: "suspend" };
    case "owner.kyc.review":
      return { submissionId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", decision: "approved" };
    case "owner.marketplace.seller.decision":
      return { applicationId: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e", decision: "approved" };
    case "owner.division.status.set":
      return { slug: "care", intent: "pause" };
    case "owner.support.reply":
      return { threadId: "c3d4e5f6-a7b8-4c9d-8e1f-2a3b4c5d6e7f", body: "We're on it — the team is looking now." };
    case "owner.social.post":
      return { platform: "x", text: "Henry Onyx is live." };
    case "owner.support.reply_batch":
      return {
        replies: [
          { threadId: "c3d4e5f6-a7b8-4c9d-8e1f-2a3b4c5d6e7f", body: "The team is on it now." },
          { threadId: "d4e5f6a7-b8c9-4d0e-9f2a-3b4c5d6e7f8a", body: "Resolved — check your dashboard." },
        ],
      };
    default:
      return {};
  }
}

test("sanity: zod is v4 with strict object support", () => {
  const s = z.object({ a: z.string() }).strict();
  assert.ok(!s.safeParse({ a: "x", b: 1 }).success);
});
