import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  PREDICTIVE_TICK_LOCK_KEY,
  PREDICTIVE_TICK_LOCK_TTL_SECONDS,
  NARRATIVE_MAX_PER_RUN,
  QUEUE_HISTORY_ROW_LIMIT,
  SERVICE_UNIT_LIMIT,
  TRANSACTION_LIMIT,
  predictiveBatchEnabled,
  predictiveNarrativeEnabled,
} from "./config";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HUB_ROOT = path.resolve(HERE, "..", "..");
const REPO_ROOT = path.resolve(HUB_ROOT, "..", "..");

const read = (rel: string) => readFileSync(path.join(REPO_ROOT, rel), "utf8");

const MONEY_TOKENS = [
  "payments_private",
  "reserve_wallet_for_ai",
  "post_ai_usage_charge",
  "release_wallet_ai_hold",
  "customer_wallet",
  "advance_payment_intent",
  "journal_entries",
];

describe("V3-41 flags — dark by default", () => {
  it("the batch is OFF with an empty env", () => {
    assert.equal(predictiveBatchEnabled({} as NodeJS.ProcessEnv), false);
  });

  it("the narrative slice is OFF with an empty env", () => {
    assert.equal(predictiveNarrativeEnabled({} as NodeJS.ProcessEnv), false);
  });

  it("the narrative requires BOTH its own flag and the gateway kill switch", () => {
    const onlyOwn = {
      NEXT_PUBLIC_HENRY_FLAG_PREDICTIVE_QUALITY_NARRATIVE: "1",
    } as unknown as NodeJS.ProcessEnv;
    assert.equal(predictiveNarrativeEnabled(onlyOwn), false, "gateway kill switch still gates it");

    const both = {
      NEXT_PUBLIC_HENRY_FLAG_PREDICTIVE_QUALITY_NARRATIVE: "1",
      NEXT_PUBLIC_HENRY_FLAG_AI_GATEWAY: "1",
    } as unknown as NodeJS.ProcessEnv;
    assert.equal(predictiveNarrativeEnabled(both), true);
  });

  it("the batch flag alone never enables AI spend", () => {
    const env = { NEXT_PUBLIC_HENRY_FLAG_PREDICTIVE_OPERATIONS: "1" } as unknown as NodeJS.ProcessEnv;
    assert.equal(predictiveBatchEnabled(env), true, "the deterministic batch runs");
    assert.equal(predictiveNarrativeEnabled(env), false, "...with NO provider call");
  });
});

describe("V3-41 single-flight + bounds", () => {
  it("the lock key comes from the shared @henryco/workflow registry (no forked key)", () => {
    assert.equal(PREDICTIVE_TICK_LOCK_KEY, "hub.predictive.tick");
    const lock = read("packages/workflow/src/lock.ts");
    assert.ok(lock.includes('hubPredictiveTick: "hub.predictive.tick"'), "must be in LOCK_KEYS");
  });

  it("the lock row is SEEDED in the migration — an unseeded CAS key can never be won", () => {
    const migration = read(
      "apps/hub/supabase/migrations/20260902120000_v3_41_predictive_quality_workload.sql",
    );
    assert.ok(
      migration.includes("insert into public.workflow_locks") &&
        migration.includes("'hub.predictive.tick'"),
      "the migration must seed the lock row",
    );
  });

  it("the lock TTL strictly exceeds the cron route maxDuration", () => {
    const route = read("apps/hub/app/api/cron/predictive-tick/route.ts");
    const match = route.match(/export const maxDuration = (\d+);/);
    assert.ok(match, "the cron route must declare maxDuration");
    const maxDuration = Number(match![1]);
    assert.ok(
      PREDICTIVE_TICK_LOCK_TTL_SECONDS > maxDuration,
      `lock TTL ${PREDICTIVE_TICK_LOCK_TTL_SECONDS}s must exceed maxDuration ${maxDuration}s ` +
        "so a live tick can never outlive its own lock",
    );
  });

  it("every read is bounded", () => {
    for (const limit of [QUEUE_HISTORY_ROW_LIMIT, SERVICE_UNIT_LIMIT, TRANSACTION_LIMIT]) {
      assert.ok(limit > 0 && limit <= 5000, `unbounded or absurd read limit: ${limit}`);
    }
    assert.ok(NARRATIVE_MAX_PER_RUN > 0 && NARRATIVE_MAX_PER_RUN <= 10);
  });
});

describe("V3-41 money isolation — structural", () => {
  it("no predictive source file references a wallet or money RPC", () => {
    for (const rel of [
      "apps/hub/lib/predictive/narrative.ts",
      "apps/hub/lib/predictive/batch.ts",
      "apps/hub/lib/predictive/readers.ts",
      "apps/hub/lib/predictive/config.ts",
      "packages/intelligence/src/predictive/workload.ts",
      "packages/intelligence/src/predictive/quality.ts",
      "packages/intelligence/src/predictive/dispute.ts",
      "packages/intelligence/src/predictive/budget.ts",
    ]) {
      const source = read(rel);
      for (const token of MONEY_TOKENS) {
        assert.equal(source.includes(token), false, `${rel} must not reference "${token}"`);
      }
    }
  });

  it("the narrative runs through noBillingPort on the non-billable surface", () => {
    const source = read("apps/hub/lib/predictive/narrative.ts");
    assert.ok(source.includes("noBillingPort"), "must dispatch with noBillingPort");
    assert.ok(source.includes('"predictive.narrative"'), "must ride the registered non-billable surface");
  });

  it("the narrative RESERVES before it runs — and on the unified V3-43 ledger", () => {
    const source = read("apps/hub/lib/predictive/narrative.ts");
    const reserveAt = source.indexOf("reservePredictiveAiSpend");
    const runAt = source.indexOf("runAiTask(");
    assert.ok(reserveAt > -1 && runAt > -1);
    assert.ok(reserveAt < runAt, "the reservation must be taken BEFORE the provider call");
    assert.ok(
      source.includes("internal_ai_spend_add"),
      "spend must ride the ONE unified V3-43 counter",
    );
    assert.ok(
      !source.includes("ai_free_spend_add"),
      "must not reuse the account free-AI counter — predictive has its own budget_key",
    );
    // Degrade CLOSED: a refused reservation returns before dispatch.
    assert.ok(
      source.includes("if (!reservation.allowed) return"),
      "a refused reservation must short-circuit before the provider call",
    );
  });

  it("NO second spend ledger or lock table is created by this pass", () => {
    const migration = read(
      "apps/hub/supabase/migrations/20260902120000_v3_41_predictive_quality_workload.sql",
    );
    const ledgers = [...migration.matchAll(/create table if not exists public\.(\w*spend_ledger\w*)/g)].map(
      (m) => m[1],
    );
    assert.deepEqual(ledgers, [], "V3-43 owns the ONE internal spend ledger");
  });
});

describe("V3-41 no auto-action — structural", () => {
  it("the batch writes ONLY to predictive tables", () => {
    const source = read("apps/hub/lib/predictive/batch.ts");
    const written = new Set(
      [...source.matchAll(/\.from\("([a-z_]+)"\)\s*\n?\s*\.(insert|update|upsert|delete)/g)].map((m) => m[1]),
    );
    // Also catch the single-line form.
    for (const m of source.matchAll(/\.from\("([a-z_]+)"\)\.(insert|update|upsert|delete)/g)) {
      written.add(m[1]);
    }
    const allowed = new Set([
      "workload_forecasts",
      "quality_assessments",
      "dispute_likelihoods",
      "predictive_batch_runs",
    ]);
    for (const table of written) {
      assert.ok(allowed.has(table), `the batch must never write to "${table}" — predictions are advisory`);
    }
  });

  it("the batch contains no enforcement verb", () => {
    const source = read("apps/hub/lib/predictive/batch.ts");
    for (const verb of ["suspend", "ban(", "blockUser", "freeze", "chargeCustomer", "refund("]) {
      assert.equal(source.includes(verb), false, `batch must not contain "${verb}"`);
    }
  });
});
