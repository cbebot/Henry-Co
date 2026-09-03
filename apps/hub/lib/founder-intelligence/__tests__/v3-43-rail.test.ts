import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../../../..");
const read = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

const TICK = "apps/hub/lib/founder-intelligence/operator-tick.ts";
const RAIL = "apps/hub/lib/founder-intelligence/operator-rail.ts";
const ROUTE = "apps/hub/app/api/cron/operator-tick/route.ts";
const RAIL_MIGRATION = "apps/hub/supabase/migrations/20260724120000_v3_43_workflow_rail.sql";
const SA4_MIGRATION = "apps/hub/supabase/migrations/20260723130000_founder_operator_spine.sql";

/** Only executable lines (drop comments) — so an explanatory mention of a retired
 *  identifier never trips a "no code references it" assertion. */
function codeOnly(src: string): string {
  return src
    .split("\n")
    .filter((l) => !l.trimStart().startsWith("*") && !l.trimStart().startsWith("//") && !l.trimStart().startsWith("/*"))
    .join("\n");
}

/**
 * V3-43 — hub side. The operator tick is retired onto the ONE rail: its
 * single-flight lock and its NON-BILLABLE spend counter now use the consolidated
 * workflow_locks + internal_ai_spend_ledger primitives, and SA-4's unapplied
 * migration is retargeted so it no longer lands a second lock/ledger.
 */

describe("V3-43 hub: the operator tick uses the ONE consolidated primitives", () => {
  it("single-flight goes through workflow_locks keyed 'hub.operator.tick'", () => {
    const tick = read(TICK);
    assert.match(tick, /from "@henryco\/workflow"/);
    assert.match(tick, /acquireWorkflowLock\(workflowLockStore\(admin as never\), \{[\s\S]*?key: LOCK_KEYS\.hubOperatorTick/);
  });

  it("the daily counter goes through internal_ai_spend_ledger budget_key 'operator'", () => {
    const tick = read(TICK);
    assert.match(tick, /internalSpendStore\(admin as never\)\.spentToday\(\{ budgetKey: BUDGET_KEYS\.operator/);
    assert.match(tick, /internalSpendStore\(admin as never\)\.add\(\{\s*budgetKey: BUDGET_KEYS\.operator/);
  });

  it("no code path still targets the retired ai_operator_* lock/ledger/RPCs", () => {
    const code = codeOnly(read(TICK));
    for (const gone of ["ai_operator_tick_lock", "ai_operator_spend_ledger", "ai_operator_spend_today", "ai_operator_spend_add"]) {
      assert.ok(!code.includes(gone), `operator-tick still references ${gone}`);
    }
  });
});

describe("V3-43 hub: the operator cron is retired onto the rail, behavior-preserving", () => {
  it("the route dispatches through the rail seam, not the raw sweep", () => {
    const route = read(ROUTE);
    assert.match(route, /runOperatorTickViaRail/);
    assert.doesNotMatch(route, /runOperatorTick\(new Date/);
  });

  it("dark default runs the sweep DIRECTLY; live routes it through the rail", () => {
    const rail = read(RAIL);
    assert.match(rail, /WORKFLOW_RAIL_LIVE/);
    assert.match(rail, /if \(!isWorkflowRailLive\(\)\) \{\s*return runOperatorTick\(now\);/);
    assert.match(rail, /dispatchSweepThroughRail\(/);
    assert.match(rail, /key: LOCK_KEYS\.hubOperatorTick/);
    assert.match(rail, /captured = await runOperatorTick\(ctx\.now\)/);
  });
});

describe("V3-43 hub: schema is consolidated to ONE spend primitive", () => {
  it("the rail migration creates internal_ai_spend_ledger + its service-role RPCs", () => {
    const mig = read(RAIL_MIGRATION);
    assert.match(mig, /create table if not exists public\.internal_ai_spend_ledger/);
    assert.match(mig, /create or replace function public\.internal_ai_spend_today\(p_budget_key text\)/);
    assert.match(mig, /create or replace function public\.internal_ai_spend_add\(p_budget_key text, p_add_kobo bigint\)/);
    assert.match(mig, /grant execute on function public\.internal_ai_spend_today\(text\) to service_role/);
    assert.match(mig, /grant execute on function public\.internal_ai_spend_add\(text, bigint\) to service_role/);
  });

  it("ai_free_spend_ledger is folded in (rows migrated) then dropped; its RPCs are preserved as delegating wrappers", () => {
    const mig = read(RAIL_MIGRATION);
    assert.match(mig, /insert into public\.internal_ai_spend_ledger \(budget_key, window_day, spent_kobo, updated_at\)[\s\S]*?from public\.ai_free_spend_ledger/);
    assert.match(mig, /drop table if exists public\.ai_free_spend_ledger/);
    // Signatures preserved so apps/account/budget-guard.ts is untouched.
    assert.match(mig, /create or replace function public\.ai_free_spend_today\(\)[\s\S]*?internal_ai_spend_today\('free_ai'\)/);
    assert.match(mig, /create or replace function public\.ai_free_spend_add\(p_add_kobo bigint\)[\s\S]*?internal_ai_spend_add\('free_ai', p_add_kobo\)/);
  });

  it("NO second spend ledger or lock table is created (never two)", () => {
    const rail = read(RAIL_MIGRATION);
    const sa4 = read(SA4_MIGRATION);
    for (const src of [rail, sa4]) {
      assert.doesNotMatch(src, /create table[^;]*ai_operator_spend_ledger/);
      assert.doesNotMatch(src, /create table[^;]*ai_operator_tick_lock/);
    }
    // The rail creates exactly ONE spend ledger table.
    const spendLedgers = [...rail.matchAll(/create table if not exists public\.(\w*spend_ledger\w*)/g)].map((m) => m[1]);
    assert.deepEqual(spendLedgers, ["internal_ai_spend_ledger"]);
  });

  it("SA-4's retargeted migration keeps ONLY the origin column + category check (no ledger/lock)", () => {
    const sa4 = read(SA4_MIGRATION);
    assert.match(sa4, /add column if not exists origin text/);
    assert.match(sa4, /customer_notifications_category_check/);
    assert.doesNotMatch(sa4, /create table if not exists public\.ai_operator/);
    assert.doesNotMatch(sa4, /create or replace function public\.ai_operator_spend/);
  });
});
