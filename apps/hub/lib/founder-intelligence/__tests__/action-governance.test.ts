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
    assert.ok(g.tranche === 1 || g.tranche === 2 || g.tranche === 3, `${g.key} tranche must be 1, 2, or 3`);
  }
});

// ── SA-4 invariants — the studio-agency operator tranche ─────────────────────

test("SA-4: every owner.studio.* entry is tranche 3 (dark until FOUNDER_ACTIONS_TRANCHE>=3)", () => {
  for (const g of FOUNDER_ACTION_GOVERNANCE) {
    if (g.key.startsWith("owner.studio.")) {
      assert.equal(g.tranche, 3, `${g.key} must be tranche 3`);
      assert.equal(g.division, "studio", `${g.key} must carry the studio division`);
    }
  }
});

test("SA-4: deploy approve, cancel, and budget increase demand the founder's print (reauth)", () => {
  const reauthRequired = [
    "owner.studio.deploy.approve",
    "owner.studio.job.cancel",
    "owner.studio.job.budget_increase",
  ];
  for (const key of reauthRequired) {
    const g = FOUNDER_ACTION_GOVERNANCE.find((entry) => entry.key === key);
    assert.ok(g, `${key} must exist in governance`);
    assert.equal(g?.requiresReauth, true, `${key} must require reauth`);
  }
});

test("SA-4: budget increase is money-adjacent and offers ONLY preset steps (no free amount)", () => {
  const g = FOUNDER_ACTION_GOVERNANCE.find((entry) => entry.key === "owner.studio.job.budget_increase");
  assert.ok(g, "budget_increase must exist");
  assert.equal(g?.moneyAdjacent, true, "budget_increase is money-adjacent");
  // The schema accepts only the bounded enum — a raw number/amount is rejected.
  assert.ok(g?.paramsSchema.safeParse({ jobId: "3f1a9c7e-2b4d-4e6a-9c8b-1d2e3f4a5b6c", step: "25" }).success);
  assert.ok(!g?.paramsSchema.safeParse({ jobId: "3f1a9c7e-2b4d-4e6a-9c8b-1d2e3f4a5b6c", step: "37" }).success);
  assert.ok(
    !g?.paramsSchema.safeParse({ jobId: "3f1a9c7e-2b4d-4e6a-9c8b-1d2e3f4a5b6c", step: "25", amount: 999 }).success,
    "an injected amount key must be rejected (strict)",
  );
});

test("SA-4: deploy approve drift-keys pin BOTH stage and the artifact hash", () => {
  const g = FOUNDER_ACTION_GOVERNANCE.find((entry) => entry.key === "owner.studio.deploy.approve");
  assert.ok(g, "deploy.approve must exist");
  assert.ok(g?.driftKeys.includes("stage"), "deploy.approve must drift-check stage");
  assert.ok(g?.driftKeys.includes("artifactHash"), "deploy.approve must drift-check the artifact hash");
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
    case "owner.marketplace.product.review":
      return { productId: "e5f6a7b8-c9d0-4e1f-8a2b-3c4d5e6f7a8b", decision: "approved" };
    case "owner.security.account.secure":
      return { userId: "f6a7b8c9-d0e1-4f2a-9b3c-4d5e6f7a8b9c" };
    // SA-4 studio-agency operator actions
    case "owner.studio.proposal.send":
      return { proposalId: "a7b8c9d0-e1f2-4a3b-8c4d-5e6f7a8b9c0d" };
    case "owner.studio.deploy.approve":
      return { jobId: "b8c9d0e1-f2a3-4b4c-9d5e-6f7a8b9c0d1e" };
    case "owner.studio.job.cancel":
      return { jobId: "c9d0e1f2-a3b4-4c5d-8e6f-7a8b9c0d1e2f" };
    case "owner.studio.job.budget_increase":
      return { jobId: "d0e1f2a3-b4c5-4d6e-9f7a-8b9c0d1e2f3a", step: "25" };
    case "owner.studio.job.pause":
      return { jobId: "e1f2a3b4-c5d6-4e7f-8a8b-9c0d1e2f3a4b" };
    case "owner.studio.job.resume":
      return { jobId: "f2a3b4c5-d6e7-4f8a-9b9c-0d1e2f3a4b5c" };
    case "owner.studio.client.reply":
      return { projectId: "a3b4c5d6-e7f8-4a9b-8c0d-1e2f3a4b5c6d", body: "The first preview is ready for your review." };
    default:
      return {};
  }
}

test("sanity: zod is v4 with strict object support", () => {
  const s = z.object({ a: z.string() }).strict();
  assert.ok(!s.safeParse({ a: "x", b: 1 }).success);
});
