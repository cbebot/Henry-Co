import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { canViewLens, lensesForViewer, resolveLens, LENS_KEYS, LENSES } from "../lenses";
import type { LensCapabilities } from "../lenses";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/**
 * Capabilities as the server module resolves them: `security` is exactly
 * `hasStaffAccessIn(viewer, "security")`, the TS mirror of the SQL predicate.
 */
function viewerWith(divisions: string[]): LensCapabilities {
  return { security: divisions.includes("security") };
}

test("the TRUST lens mirrors is_staff_in('security') exactly", () => {
  assert.equal(canViewLens(viewerWith(["security"]), "trust"), true);
  assert.equal(canViewLens(viewerWith(["support"]), "trust"), false);
  assert.equal(canViewLens(viewerWith(["marketplace", "care"]), "trust"), false);
  assert.equal(canViewLens(viewerWith([]), "trust"), false);
  assert.equal(canViewLens(viewerWith(["support", "security"]), "trust"), true);
});

test("the other three lenses are open to any staff member", () => {
  const support = viewerWith(["support"]);
  for (const lens of ["finance", "support", "moderation"] as const) {
    assert.equal(canViewLens(support, lens), true, `${lens} must be visible to ordinary staff`);
  }
});

test("only the trust lens is marked as reading the restricted risk tables", () => {
  const restricted = LENS_KEYS.filter((k) => LENSES[k].readsRestrictedRiskTables);
  assert.deepEqual(restricted, ["trust"], "exactly one lens reads V3-40's security-gated tables");
});

test("lensesForViewer hides the trust lens from non-security staff", () => {
  assert.deepEqual(lensesForViewer(viewerWith(["support"])), ["finance", "support", "moderation"]);
  assert.deepEqual(lensesForViewer(viewerWith(["security"])), ["trust", "finance", "support", "moderation"]);
});

test("resolveLens NEVER returns a lens the viewer may not see", () => {
  const support = viewerWith(["support"]);
  // The interesting case: a bookmarked or hand-typed ?lens=trust from someone
  // who was demoted, or never had access in the first place.
  assert.notEqual(resolveLens(support, "trust"), "trust", "a forbidden request must not be honoured");
  assert.ok(lensesForViewer(support).includes(resolveLens(support, "trust")));

  // Fuzz: no input of any shape yields a forbidden lens.
  for (const requested of [
    "trust",
    "TRUST",
    " trust ",
    "../trust",
    "trust;--",
    "",
    null,
    undefined,
    "not-a-lens",
    "__proto__",
    "constructor",
  ]) {
    const resolved = resolveLens(support, requested as string | null | undefined);
    assert.ok(
      lensesForViewer(support).includes(resolved),
      `requested ${JSON.stringify(requested)} resolved to a forbidden lens: ${resolved}`,
    );
    assert.notEqual(resolved, "trust");
  }
});

test("resolveLens honours a permitted request and falls back deterministically", () => {
  const security = viewerWith(["security"]);
  assert.equal(resolveLens(security, "trust"), "trust");
  assert.equal(resolveLens(security, "finance"), "finance");
  assert.equal(resolveLens(security, "nonsense"), "trust", "falls back to the first permitted lens");
  assert.equal(resolveLens(viewerWith(["support"]), undefined), "finance");
});

test("STRUCTURAL: the loaders never reach for a service-role client", () => {
  // The whole per-role guarantee rests on reading with the caller's RLS-scoped
  // session. An admin client here would dissolve it silently, so the words are
  // banned from the file outright.
  const data = readFileSync(path.join(HERE, "..", "data.ts"), "utf8");
  for (const forbidden of [
    "createAdminSupabase",
    "createStaffAdminSupabase",
    "SUPABASE_SERVICE_ROLE_KEY",
    "service_role",
  ]) {
    assert.equal(data.includes(forbidden), false, `data.ts must not reference "${forbidden}"`);
  }
});

test("STRUCTURAL: the dashboard reads no raw score COLUMN", () => {
  // Opacity by omission: `likelihood` / `risk_score` / `deterministic_score`
  // must never appear in a select list, so the numbers cannot reach a browser
  // even by accident.
  //
  // This parses the actual select lists rather than substring-matching the
  // file. A naive `includes("risk_score")` matches the TABLE name
  // `"risk_scores"` and fails on correct code — which it did, once.
  const data = readFileSync(path.join(HERE, "..", "data.ts"), "utf8");
  const FORBIDDEN = new Set(["likelihood", "risk_score", "deterministic_score"]);

  const selected = new Set<string>();
  for (const match of data.matchAll(/\.select\(\s*(`[^`]*`|"[^"]*")\s*\)/g)) {
    const literal = match[1].slice(1, -1);
    for (const part of literal.split(",")) {
      // Drop `${...}` interpolations; those are column PARAMETERS, checked below.
      const column = part.trim();
      if (!column || column.includes("${")) continue;
      selected.add(column);
    }
  }
  assert.ok(selected.size > 0, "the parser found no select lists — it is not actually checking anything");

  for (const column of selected) {
    assert.equal(FORBIDDEN.has(column), false, `data.ts selects the raw score column "${column}"`);
  }

  // The parameterised loaders take column NAMES as arguments (loadDrill,
  // loadDailyCounts, loadBandCounts). Checking every string literal by EXACT
  // equality covers all of them — and cannot confuse the table "risk_scores"
  // with the column "risk_score".
  for (const match of data.matchAll(/"([A-Za-z_]+)"/g)) {
    assert.equal(FORBIDDEN.has(match[1]), false, `data.ts passes the raw score column "${match[1]}"`);
  }
});
