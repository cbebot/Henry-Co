import { test } from "node:test";
import assert from "node:assert/strict";

import {
  RISK_AI_DAILY_BUDGET_KOBO_DEFAULT,
  RISK_SPEND_BUDGET_KEY,
  resolveRiskBudgetKobo,
} from "./budget-config";

/**
 * V3-40 — the two post-merge guarantees this config exists for:
 *   (a) risk spend lands on the DEDICATED 'risk_predictive' budget_key (never 'free_ai'),
 *   (b) the ceiling can be raised only by an explicit finite positive number — garbage,
 *       negative, zero, Infinity, or absent env all fall back to the ₦2,000/day default,
 *       so the cap is never disabled to unbounded and never zeroed (which would silently
 *       stop scoring).
 */

test("the budget key is the dedicated risk key, not the customer free-chat key", () => {
  assert.equal(RISK_SPEND_BUDGET_KEY, "risk_predictive");
  assert.notEqual(RISK_SPEND_BUDGET_KEY, "free_ai");
});

test("default ceiling is ₦2,000/day (E-D1-A)", () => {
  assert.equal(RISK_AI_DAILY_BUDGET_KOBO_DEFAULT, 200_000);
  assert.equal(resolveRiskBudgetKobo(), 200_000);
  assert.equal(resolveRiskBudgetKobo({}), 200_000);
});

test("garbage / negative / zero / Infinity / absent env → the default (never unbounded, never zero)", () => {
  for (const raw of ["abc", "-5", "0", "Infinity", "-Infinity", "NaN", "", undefined]) {
    assert.equal(
      resolveRiskBudgetKobo({ RISK_AI_DAILY_BUDGET_KOBO: raw as string | undefined }),
      200_000,
      `env "${raw}" must fall back to the default`,
    );
  }
});

test("an explicit finite positive number raises the ceiling", () => {
  assert.equal(resolveRiskBudgetKobo({ RISK_AI_DAILY_BUDGET_KOBO: "500000" }), 500_000);
  assert.equal(resolveRiskBudgetKobo({ RISK_AI_DAILY_BUDGET_KOBO: "1000" }), 1_000);
  assert.equal(resolveRiskBudgetKobo({ RISK_AI_DAILY_BUDGET_KOBO: "12345.7" }), 12_346); // rounded
});
