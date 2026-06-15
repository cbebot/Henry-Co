// V3-VAT-CLASSIFICATION-01 — behavioural contract for the per-supply VAT
// classification resolver. Imports the real TypeScript (Node 24 strips types, the
// CI node-version) so the precedence ladder and the owner-confirmed regime are
// verified by EXECUTION, not just source-shape — this map decides real money.

import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveVatClassification, TAX, TAX_CLASSIFICATION } from "../tax.ts";

test("the single statutory rate is still 7.5% (one rate, many treatments)", () => {
  assert.equal(TAX.vat.standardRate, 0.075);
  assert.equal(TAX.vat.jurisdiction, "NG");
});

test("division defaults: marketplace / studio / jobs / care / logistics are standard-confirmed", () => {
  for (const division of ["marketplace", "studio", "jobs", "care", "logistics"]) {
    const c = resolveVatClassification({ division });
    assert.equal(c.treatment, "standard", `${division} default`);
    assert.equal(c.reviewStatus, "confirmed", `${division} confirmed`);
    assert.equal(c.source, "division");
  }
});

test("Q1 — paid Learn courses default standard, PENDING review, switchable", () => {
  const c = resolveVatClassification({ division: "learn" });
  assert.equal(c.treatment, "standard");
  assert.equal(c.reviewStatus, "pending_review");
  assert.equal(c.signOff, "assumed_pending_accountant");
});

test("Q3 — courier logistics is standard-rated, NOT transport-exempt", () => {
  const c = resolveVatClassification({ division: "logistics" });
  assert.equal(c.treatment, "standard");
  assert.equal(c.reviewStatus, "confirmed");
});

test("property serviceType overrides: rent exempt, sale/land out_of_scope", () => {
  assert.equal(resolveVatClassification({ division: "property", categoryKey: "rent" }).treatment, "exempt");
  assert.equal(resolveVatClassification({ division: "property", categoryKey: "sale" }).treatment, "out_of_scope");
  assert.equal(resolveVatClassification({ division: "property", categoryKey: "land" }).treatment, "out_of_scope");
});

test("Q2 — commercial + short-let are standard, PENDING review, switchable", () => {
  for (const key of ["commercial", "shortlet"]) {
    const c = resolveVatClassification({ division: "property", categoryKey: key });
    assert.equal(c.treatment, "standard", `${key} treatment`);
    assert.equal(c.reviewStatus, "pending_review", `${key} pending`);
    assert.equal(c.signOff, "assumed_pending_accountant", `${key} signOff`);
    assert.equal(c.source, "category");
  }
});

test("property fees (no serviceType passed) are standard — the platform's own supply", () => {
  const c = resolveVatClassification({ division: "property" });
  assert.equal(c.treatment, "standard");
  assert.equal(c.source, "division");
});

test("marketplace category overrides: food/pharma/baby exempt, books zero-rated", () => {
  assert.equal(resolveVatClassification({ division: "marketplace", categoryKey: "food" }).treatment, "exempt");
  assert.equal(resolveVatClassification({ division: "marketplace", categoryKey: "pharma" }).treatment, "exempt");
  assert.equal(resolveVatClassification({ division: "marketplace", categoryKey: "baby" }).treatment, "exempt");
  assert.equal(resolveVatClassification({ division: "marketplace", categoryKey: "books" }).treatment, "zero_rated");
});

test("precedence: explicit itemTreatment beats everything", () => {
  const c = resolveVatClassification({
    division: "marketplace",
    categoryKey: "food", // would be exempt
    isSeededTestItem: true, // would be exempt
    itemTreatment: "standard", // wins
  });
  assert.equal(c.treatment, "standard");
  assert.equal(c.source, "item");
});

test("precedence: seeded test catalog → EXEMPT, above category/division but below item", () => {
  // The owner's current catalog is all test goods → exempt regardless of category.
  const c = resolveVatClassification({ division: "marketplace", categoryKey: "office-workspace", isSeededTestItem: true });
  assert.equal(c.treatment, "exempt");
  assert.equal(c.source, "seeded_test");
  // No global rate change: a NON-seeded standard-category item still rates standard.
  const real = resolveVatClassification({ division: "marketplace", categoryKey: "office-workspace" });
  assert.equal(real.treatment, "standard");
});

test("categoryKey is trimmed + case-insensitive", () => {
  assert.equal(resolveVatClassification({ division: "property", categoryKey: "  RENT " }).treatment, "exempt");
});

test("unknown categoryKey falls through to the division default", () => {
  const c = resolveVatClassification({ division: "marketplace", categoryKey: "no-such-category" });
  assert.equal(c.treatment, "standard");
  assert.equal(c.source, "division");
});

test("every classification carries a non-empty audit note + valid treatment", () => {
  const valid = new Set(["standard", "zero_rated", "exempt", "out_of_scope"]);
  for (const [division, rule] of Object.entries(TAX_CLASSIFICATION)) {
    assert.ok(rule.default.note.length > 0, `${division} default note`);
    assert.ok(valid.has(rule.default.treatment), `${division} default treatment`);
    for (const [key, cls] of Object.entries(rule.overrides ?? {})) {
      assert.ok(cls.note.length > 0, `${division}.${key} note`);
      assert.ok(valid.has(cls.treatment), `${division}.${key} treatment`);
    }
  }
});
