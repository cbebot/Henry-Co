import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../../../..");
const read = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

const STORE = "apps/studio/lib/agency/store.ts";
const RAIL = "apps/studio/lib/agency/rail.ts";
const ROUTE = "apps/studio/app/api/agency/tick/route.ts";
const RAIL_MIGRATION = "apps/hub/supabase/migrations/20260724120000_v3_43_workflow_rail.sql";
const SA4_MIGRATION = "apps/hub/supabase/migrations/20260723130000_founder_operator_spine.sql";

/**
 * V3-43 — studio side. The build lifecycle is retired onto the ONE rail: the
 * single-flight lock now delegates to the consolidated workflow_locks primitive,
 * and the cron routes through the rail behind WORKFLOW_RAIL_LIVE while defaulting
 * to today's exact direct-call path.
 */

describe("V3-43 studio: the tick lock delegates to the ONE workflow_locks primitive", () => {
  it("acquire/release go through @henryco/workflow keyed 'studio.agency.tick'", () => {
    const store = read(STORE);
    assert.match(store, /from "@henryco\/workflow"/);
    assert.match(store, /acquireWorkflowLock\(workflowLockStore\(admin as never\), \{[\s\S]*?key: LOCK_KEYS\.studioAgencyTick/);
    assert.match(store, /releaseWorkflowLock\(workflowLockStore\(admin as never\), \{[\s\S]*?key: LOCK_KEYS\.studioAgencyTick/);
  });

  it("the retired studio_agency_tick_lock table is NO LONGER read/written by the app", () => {
    const store = read(STORE);
    // The only mention allowed is the explanatory comment about the retired table.
    const codeLines = store.split("\n").filter((l) => !l.trimStart().startsWith("*") && !l.trimStart().startsWith("//"));
    assert.ok(
      !codeLines.some((l) => l.includes('"studio_agency_tick_lock"') || l.includes("'studio_agency_tick_lock'")),
      "no code path should still target the studio_agency_tick_lock table",
    );
  });
});

describe("V3-43 studio: the cron is retired onto the rail, behavior-preserving", () => {
  it("the route dispatches through the rail seam, not the raw sweep", () => {
    const route = read(ROUTE);
    assert.match(route, /runStudioAgencyTick/);
    assert.doesNotMatch(route, /runAgencyTick\(/);
  });

  it("dark default runs the sweep DIRECTLY; live routes it through the rail", () => {
    const rail = read(RAIL);
    assert.match(rail, /WORKFLOW_RAIL_LIVE/);
    // Flag off (or no admin env) ⇒ the exact pre-rail direct call.
    assert.match(rail, /if \(!isWorkflowRailLive\(\)[\s\S]*?\) \{\s*return runAgencyTick\(now\);/);
    // Live ⇒ the SAME sweep as a rail handler.
    assert.match(rail, /dispatchSweepThroughRail\(/);
    assert.match(rail, /key: LOCK_KEYS\.studioAgencyTick/);
    assert.match(rail, /captured = await runAgencyTick\(ctx\.now\)/);
  });
});

describe("V3-43 studio: schema is consolidated to ONE lock primitive", () => {
  it("the rail migration folds studio_agency_tick_lock into workflow_locks and drops it", () => {
    const mig = read(RAIL_MIGRATION);
    assert.match(mig, /create table if not exists public\.workflow_locks/);
    assert.match(mig, /drop table public\.studio_agency_tick_lock/);
    // The lock keys are seeded expired so the first acquirer wins.
    assert.match(mig, /'studio\.agency\.tick'/);
    assert.match(mig, /'hub\.operator\.tick'/);
  });

  it("NO second lock table is created anywhere (never two)", () => {
    const rail = read(RAIL_MIGRATION);
    const sa4 = read(SA4_MIGRATION);
    assert.doesNotMatch(rail, /create table[^;]*ai_operator_tick_lock/);
    assert.doesNotMatch(sa4, /create table[^;]*ai_operator_tick_lock/);
    // workflow_locks is the sole lock table the rail creates.
    const lockCreates = [...rail.matchAll(/create table if not exists public\.(\w*lock\w*)/g)].map((m) => m[1]);
    assert.deepEqual(lockCreates, ["workflow_locks"]);
  });
});
