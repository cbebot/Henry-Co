import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  evaluateFreeBudget,
  resolveFreeBudgetKobo,
  FREE_AI_DAILY_BUDGET_KOBO_DEFAULT,
  FREE_BUDGET_CONSERVE_AT,
} from "../free-budget";
import { estimateFreeTurnCostKobo } from "../server/quote";

describe("evaluateFreeBudget — free-AI loss can never exceed the budget", () => {
  const budget = 100_000; // ₦1,000

  it("allows everyone well under budget", () => {
    assert.equal(evaluateFreeBudget({ spentTodayKobo: 10_000, budgetKobo: budget, isAnonymous: true }).decision, "allow");
    assert.equal(evaluateFreeBudget({ spentTodayKobo: 10_000, budgetKobo: budget, isAnonymous: false }).decision, "allow");
  });

  it("conserves ANONYMOUS first once spend crosses the conserve line, but still serves signed-in", () => {
    const spent = Math.ceil(budget * FREE_BUDGET_CONSERVE_AT);
    assert.equal(evaluateFreeBudget({ spentTodayKobo: spent, budgetKobo: budget, isAnonymous: true }).decision, "conserve");
    assert.equal(
      evaluateFreeBudget({ spentTodayKobo: spent, budgetKobo: budget, isAnonymous: false }).decision,
      "allow",
      "signed-in (the funnel/retention) keeps being served until the ceiling",
    );
  });

  it("exhausts EVERYONE at the ceiling (the hard loss cap)", () => {
    assert.equal(evaluateFreeBudget({ spentTodayKobo: budget, budgetKobo: budget, isAnonymous: false }).decision, "exhausted");
    assert.equal(evaluateFreeBudget({ spentTodayKobo: budget + 1, budgetKobo: budget, isAnonymous: true }).decision, "exhausted");
  });

  it("falls back to the default budget when a non-positive budget is passed", () => {
    const r = evaluateFreeBudget({ spentTodayKobo: FREE_AI_DAILY_BUDGET_KOBO_DEFAULT, budgetKobo: 0, isAnonymous: false });
    assert.equal(r.decision, "exhausted");
  });

  it("reports the used fraction", () => {
    assert.equal(evaluateFreeBudget({ spentTodayKobo: 50_000, budgetKobo: budget, isAnonymous: false }).usedFraction, 0.5);
  });
});

describe("resolveFreeBudgetKobo — owner-tunable via env, never non-positive", () => {
  it("reads a positive env value", () => {
    assert.equal(resolveFreeBudgetKobo({ FREE_AI_DAILY_BUDGET_KOBO: "250000" }), 250_000);
  });
  it("falls back to the default for missing/invalid/non-positive", () => {
    assert.equal(resolveFreeBudgetKobo({}), FREE_AI_DAILY_BUDGET_KOBO_DEFAULT);
    assert.equal(resolveFreeBudgetKobo({ FREE_AI_DAILY_BUDGET_KOBO: "-5" }), FREE_AI_DAILY_BUDGET_KOBO_DEFAULT);
    assert.equal(resolveFreeBudgetKobo({ FREE_AI_DAILY_BUDGET_KOBO: "abc" }), FREE_AI_DAILY_BUDGET_KOBO_DEFAULT);
  });
});

describe("estimateFreeTurnCostKobo — the company's real loss per free turn (provider cost)", () => {
  it("is a positive provider cost for a free surface, and grows with input", () => {
    const small = estimateFreeTurnCostKobo({ surface: "support.message.assist", inputText: "hi" });
    const big = estimateFreeTurnCostKobo({ surface: "support.message.assist", inputText: "a lot of text ".repeat(200) });
    assert.ok(small > 0, "a real provider cost");
    assert.ok(big >= small, "more input never costs less");
  });

  it("returns 0 for an unknown surface (never over-counts)", () => {
    assert.equal(estimateFreeTurnCostKobo({ surface: "not.a.surface" as never, inputText: "x" }), 0);
  });
});
