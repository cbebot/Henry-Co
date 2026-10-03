// V3-MKT-TRUST-01 — the TypeScript side of adversarial round 4. (The database side is
// proven in mkt_trust_guard_behaviour.sql, R9d, R10h and section S9–S10.)
//
// Server modules import "server-only", so their invariants are pinned on the
// source text — on call expressions and literal guards, never on a comment.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const read = (relative: string) => readFileSync(join(process.cwd(), relative), "utf8");
const codeOnly = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");

const SELLER_ROUTE = codeOnly(read("app/api/seller-applications/route.ts"));
const ONBOARDING = codeOnly(read("lib/marketplace/publish-gate/onboarding.ts"));
const MIGRATION = read("supabase/migrations/20261002120000_v3_mkt_trust_01_instant_publish.sql");

describe("round 4 — a person's 'no' stands, whenever it was said", () => {
  it("decisions made before the gate are recorded once, when the ledger is created", () => {
    const create = MIGRATION.indexOf("create table public.marketplace_seller_revocations (");
    const seed = MIGRATION.indexOf("perform public.marketplace_gate_seed_revocations();");
    assert.ok(create > 0 && seed > create);
    assert.ok(MIGRATION.includes("if to_regclass('public.marketplace_seller_revocations') is null then"));
  });

  it("any person's rejection or request for changes is recorded, not only one after an approval", () => {
    assert.ok(MIGRATION.includes("  if new.status in ('rejected', 'changes_requested') and old.status is distinct from new.status then"));
  });

  it("an application a person decided is never closed as approved by the gate", () => {
    assert.ok(ONBOARDING.includes('if (vendorStatus === "approved" && !input.priorDecision) {'));
  });
});

describe("round 4 — a look-alike handle is the handle it imitates, at onboarding too", () => {
  it("the route checks the handle in any letter case", () => {
    assert.ok(SELLER_ROUTE.includes('.ilike("slug", storeSlug)'));
    assert.equal(SELLER_ROUTE.includes('.eq("slug", storeSlug.toLowerCase())'), false);
  });

  it("so does the database function", () => {
    assert.ok(MIGRATION.includes("   where lower(v.slug) = v_slug\n   limit 1;"));
  });
});
