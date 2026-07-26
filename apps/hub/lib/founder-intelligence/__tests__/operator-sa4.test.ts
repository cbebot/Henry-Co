import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  evaluateOperatorBudget,
  OPERATOR_AI_DAILY_BUDGET_KOBO_DEFAULT,
  OPERATOR_TICK_LOCK_TTL_SECONDS,
  resolveOperatorBudgetKobo,
} from "../operator-budget";
import {
  AGENCY_CANCELLABLE_STAGES,
  AGENCY_PAUSABLE_STAGES,
  computeBudgetIncreaseKobo,
  OPERATOR_HOLD_SENTINEL,
} from "../studio-agency-model";

/**
 * SA-4 gate — executable proof of the operator's safety invariants:
 * the ₦5,000/day ceiling enforced OUTSIDE the model (reserve-before-run,
 * degrade-CLOSED, single-flight), the preset-step-only budget math, and the
 * source-pinned ordering the adversarial rounds attack.
 */

// ── budget policy (pure) ─────────────────────────────────────────────────────

test("SA-4 budget: the default ceiling is ₦5,000/day and garbage never disables it", () => {
  assert.equal(OPERATOR_AI_DAILY_BUDGET_KOBO_DEFAULT, 500_000);
  assert.equal(resolveOperatorBudgetKobo({}), 500_000);
  assert.equal(resolveOperatorBudgetKobo({ OPERATOR_AI_DAILY_BUDGET_KOBO: "0" }), 500_000);
  assert.equal(resolveOperatorBudgetKobo({ OPERATOR_AI_DAILY_BUDGET_KOBO: "-5" }), 500_000);
  assert.equal(resolveOperatorBudgetKobo({ OPERATOR_AI_DAILY_BUDGET_KOBO: "abc" }), 500_000);
  assert.equal(resolveOperatorBudgetKobo({ OPERATOR_AI_DAILY_BUDGET_KOBO: "250000" }), 250_000);
});

test("SA-4 budget: at or over the ceiling ⇒ exhausted (spent + committed + next)", () => {
  const budget = 500_000;
  assert.equal(
    evaluateOperatorBudget({ spentTodayKobo: 0, committedKobo: 0, nextEstimateKobo: 1_000, budgetKobo: budget }),
    "allow",
  );
  // The in-tick reservation counts: a second call in the same tick sees the first.
  assert.equal(
    evaluateOperatorBudget({
      spentTodayKobo: 400_000,
      committedKobo: 90_000,
      nextEstimateKobo: 20_000,
      budgetKobo: budget,
    }),
    "exhausted",
  );
  assert.equal(
    evaluateOperatorBudget({
      spentTodayKobo: 400_000,
      committedKobo: 90_000,
      nextEstimateKobo: 10_000,
      budgetKobo: budget,
    }),
    "allow",
  );
});

test("SA-4 budget: a broken ledger degrades CLOSED (null spend ⇒ exhausted)", () => {
  assert.equal(
    evaluateOperatorBudget({ spentTodayKobo: null, committedKobo: 0, nextEstimateKobo: 1, budgetKobo: 500_000 }),
    "exhausted",
  );
});

// ── studio model (pure) ──────────────────────────────────────────────────────

test("SA-4 model: budget increase is preset-step math over the server-read envelope", () => {
  assert.equal(computeBudgetIncreaseKobo(100_000, "10"), 110_000);
  assert.equal(computeBudgetIncreaseKobo(100_000, "25"), 125_000);
  assert.equal(computeBudgetIncreaseKobo(100_000, "50"), 150_000);
  // Garbage/negative base yields 0 — the applier rejects a non-increase.
  assert.equal(computeBudgetIncreaseKobo(Number.NaN, "25"), 0);
  assert.equal(computeBudgetIncreaseKobo(-500, "25"), 0);
});

test("SA-4 model: 'deploying' is never cancellable or pausable; terminal stages are untouchable", () => {
  assert.ok(!AGENCY_CANCELLABLE_STAGES.includes("deploying"));
  assert.ok(!AGENCY_PAUSABLE_STAGES.includes("deploying"));
  for (const terminal of ["live", "aftercare", "cancelled"] as const) {
    assert.ok(!AGENCY_CANCELLABLE_STAGES.includes(terminal), `${terminal} must not be cancellable`);
    assert.ok(!AGENCY_PAUSABLE_STAGES.includes(terminal), `${terminal} must not be pausable`);
  }
  assert.equal(OPERATOR_HOLD_SENTINEL, "operator:paused");
});

// ── source pins (the adversarial-round anchors — read the REAL files) ────────

const read = (rel: string): string =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

test("SA-4 pin: the tick acquires the single-flight lock BEFORE reading the day's spend", () => {
  const src = read("../operator-tick.ts");
  const lockIdx = src.indexOf("await acquireOperatorTickLock(worker)");
  const spendIdx = src.indexOf("await operatorSpendTodayKobo()");
  assert.ok(lockIdx > 0 && spendIdx > 0, "both calls must exist");
  assert.ok(lockIdx < spendIdx, "lock must be acquired before the spend baseline is read");
  assert.match(src, /if \(!locked\) return emptySummary\("lock_lost"\)/, "a losing tick must no-op");
});

test("SA-4 pin: every model call reserves its estimate BEFORE running (never post-pay)", () => {
  const src = read("../operator-tick.ts");
  const reserveIdx = src.indexOf("ctx.committedKobo += estimate");
  const runIdx = src.indexOf("await runAiTask(");
  assert.ok(reserveIdx > 0 && runIdx > 0, "reserve and run must both exist");
  assert.ok(reserveIdx < runIdx, "the reservation must precede the model call");
});

test("SA-4 pin: the cron route's maxDuration stays BELOW the lock TTL", () => {
  const src = read("../../../app/api/cron/operator-tick/route.ts");
  const match = src.match(/export const maxDuration = (\d+)/);
  assert.ok(match, "the route must bound maxDuration");
  assert.ok(
    Number(match?.[1]) < OPERATOR_TICK_LOCK_TTL_SECONDS,
    `maxDuration (${match?.[1]}) must be < lock TTL (${OPERATOR_TICK_LOCK_TTL_SECONDS})`,
  );
  assert.match(src, /timingSafeEqual/, "cron auth must be constant-time");
  assert.match(src, /if \(!expected\) return false/, "cron auth must fail closed when the secret is unset");
});

test("SA-4 pin: deploy approve pins the SERVER-READ artifact hash, write-once, under a stage CAS", () => {
  const src = read("../../studio-agency-write.ts");
  assert.match(
    src,
    /patch: \{ approved_artifact_hash: job\.artifactHash \}/,
    "the approval pin must come from the server-read job, never from params",
  );
  assert.match(src, /\.eq\("stage", input\.from\)/, "stage moves must CAS on the prior stage");
  assert.match(
    src,
    /job\.artifactHash !== input\.artifactHash/,
    "the applier must re-check the hash the owner saw against the live row",
  );
});

test("SA-4 pin: pause/resume are claim-holds that can never steal a live tick claim", () => {
  const src = read("../../studio-agency-write.ts");
  assert.match(src, /\.is\("claimed_by", null\)/, "pause must CAS only an unclaimed job");
  assert.match(
    src,
    /\.eq\("claimed_by", OPERATOR_HOLD_SENTINEL\)/,
    "resume must release only the operator's own sentinel",
  );
  assert.ok(!/update\(\{\s*stage/.test(src.split("applyStudioJobHold")[1] ?? ""), "hold must never write stage");
});

test("SA-4 pin: budget increase CASes on BOTH stage and the prior envelope", () => {
  const src = read("../../studio-agency-write.ts");
  const section = src.split("applyStudioJobBudgetIncrease")[1]?.split("applyStudioJobHold")[0] ?? "";
  assert.match(section, /\.eq\("stage", job\.stage\)/, "budget patch must CAS the stage");
  assert.match(section, /\.eq\("budget_kobo", job\.budgetKobo\)/, "budget patch must CAS the prior envelope");
});

test("SA-4 pin: operator proposals honor the tranche gate and carry origin='operator'", () => {
  const src = read("../operator-propose.ts");
  assert.match(src, /entry\.tranche > liveTranche\(\)/, "a dark tranche must not be raisable");
  assert.match(src, /origin: "operator"/, "operator proposals must carry their origin");
  assert.match(src, /paramsSchema\.safeParse/, "params must pass the STRICT schema before insert");
});

test("SA-4 pin: the confirm route runs reauth BEFORE the CAS claim (challenged proposals stay pending)", () => {
  const src = read("../../../app/api/owner/intelligence/actions/confirm/route.ts");
  const reauthIdx = src.indexOf("requireSensitiveAction");
  const claimIdx = src.indexOf('update({ status: "executing"');
  assert.ok(reauthIdx > 0 && claimIdx > 0, "both steps must exist");
  assert.ok(reauthIdx < claimIdx, "reauth must precede the CAS claim");
});

test("SA-4 pin: the confirm route re-gates EXECUTE on the live tranche (a darkened tranche is a real kill-switch)", () => {
  const src = read("../../../app/api/owner/intelligence/actions/confirm/route.ts");
  assert.match(src, /entry\.tranche > liveTranche\(\)/, "execute must re-check the tranche gate");
  // The gate must sit before the execution binding is invoked.
  const gateIdx = src.indexOf("entry.tranche > liveTranche()");
  const execIdx = src.indexOf("entry.executionBinding(");
  assert.ok(gateIdx > 0 && execIdx > 0 && gateIdx < execIdx, "the tranche gate must precede execute");
});
