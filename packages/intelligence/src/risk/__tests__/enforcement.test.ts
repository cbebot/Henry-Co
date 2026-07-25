import { test } from "node:test";
import assert from "node:assert/strict";

import {
  AutoPunishmentError,
  assertEnforcementAllowed,
  isSensitiveActionGated,
  planSystemEnforcement,
} from "../enforcement";
import type { RiskScoreResult, RiskTier } from "../types";

function result(tier: RiskTier, shadow = true): RiskScoreResult {
  return {
    entityType: "account",
    entityId: "acct-1",
    riskScore: 90,
    deterministicScore: 90,
    tier,
    deterministicTier: tier,
    contributingFactors: [],
    modelKind: "fraud_risk",
    modelVersion: "1.0.0",
    shadow,
  };
}

test("system planning: pass → none; monitor/review/freeze → flag, never more", () => {
  assert.deepEqual(planSystemEnforcement(result("pass")), { action: "none", shadow: true });
  for (const tier of ["monitor", "review", "freeze"] as const) {
    const plan = planSystemEnforcement(result(tier));
    assert.equal(plan.action, "flag", tier);
  }
  assert.equal(planSystemEnforcement(result("freeze", false)).shadow, false);
});

test("ABSOLUTE: the system actor cannot hold, freeze, release, or override", () => {
  assert.doesNotThrow(() => assertEnforcementAllowed("flag", { kind: "system" }));
  for (const action of ["hold", "freeze", "release", "staff_override"] as const) {
    assert.throws(() => assertEnforcementAllowed(action, { kind: "system" }), AutoPunishmentError, action);
  }
});

test("staff actions require a real staff id, and release/override require a reason", () => {
  assert.throws(() => assertEnforcementAllowed("hold", { kind: "staff", staffUserId: " " }));
  assert.doesNotThrow(() => assertEnforcementAllowed("hold", { kind: "staff", staffUserId: "staff-1" }));
  assert.doesNotThrow(() => assertEnforcementAllowed("freeze", { kind: "staff", staffUserId: "staff-1" }));
  assert.throws(() => assertEnforcementAllowed("release", { kind: "staff", staffUserId: "staff-1" }));
  assert.throws(() => assertEnforcementAllowed("staff_override", { kind: "staff", staffUserId: "staff-1", }, "  "));
  assert.doesNotThrow(() => assertEnforcementAllowed("release", { kind: "staff", staffUserId: "staff-1" }, "cleared after review"));
  assert.doesNotThrow(() => assertEnforcementAllowed("staff_override", { kind: "staff", staffUserId: "staff-1" }, "false positive"));
});

test("the sensitive-action gate consults ONLY staff-applied states under a LIVE model", () => {
  assert.equal(isSensitiveActionGated(null), false);
  assert.equal(isSensitiveActionGated(undefined), false);
  assert.equal(isSensitiveActionGated({ state: "none", appliedByStaff: true, modelStatus: "live" }), false);
  // A system-written state (should not exist, but defense in depth) gates nothing.
  assert.equal(isSensitiveActionGated({ state: "freeze", appliedByStaff: false, modelStatus: "live" }), false);
  // Shadow / rolled_back / retired models gate nothing even when staff-applied.
  for (const modelStatus of ["shadow", "rolled_back", "retired"] as const) {
    assert.equal(isSensitiveActionGated({ state: "hold", appliedByStaff: true, modelStatus }), false, modelStatus);
  }
  // The one true gating shape: staff-applied hold/freeze under a live model.
  assert.equal(isSensitiveActionGated({ state: "hold", appliedByStaff: true, modelStatus: "live" }), true);
  assert.equal(isSensitiveActionGated({ state: "freeze", appliedByStaff: true, modelStatus: "live" }), true);
});
