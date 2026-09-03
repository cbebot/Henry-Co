import { test } from "node:test";
import assert from "node:assert/strict";
import { getDivisionUrl, henryWebRoot } from "@henryco/config";
import {
  dealHref,
  deriveRecentDealDivisions,
  floorCandidate,
  targetedCandidate,
  toDealTerms,
  type DealCatalogRow,
} from "./offers-core";

/**
 * V3-35 gate — the pure candidate rules behind the account deals rail:
 * deterministic scoring, the floor/targeted admission split (targeted
 * visibility NEVER reaches the floor; targeting only matches the viewer's OWN
 * division mix), artifact-shape guards, and config-derived URLs.
 */

const NOW = Date.parse("2026-07-24T12:00:00.000Z");

function row(over: Partial<DealCatalogRow> & { id: string }): DealCatalogRow {
  // Explicit-null aware: an explicit null in `over` must survive (nullable
  // columns are part of what these tests exercise).
  const has = (key: keyof DealCatalogRow) => key in over;
  return {
    id: over.id,
    creator_partner_id: has("creator_partner_id") ? over.creator_partner_id! : null,
    title: over.title ?? `Deal ${over.id}`,
    description: has("description") ? over.description! : null,
    deal_type: over.deal_type ?? "percent_off",
    discount_percent: has("discount_percent") ? over.discount_percent! : 10,
    discount_minor: has("discount_minor") ? over.discount_minor! : null,
    discount_currency: has("discount_currency") ? over.discount_currency! : null,
    scope_division: has("scope_division") ? over.scope_division! : "marketplace",
    scope_categories: over.scope_categories ?? [],
    target_ref: has("target_ref") ? over.target_ref! : null,
    ends_at: over.ends_at ?? "2026-08-24T12:00:00.000Z",
    created_at: over.created_at ?? "2026-06-01T12:00:00.000Z",
    visibility: over.visibility ?? "public",
    audience_signals: over.audience_signals ?? {},
  };
}

test("V3-35 core: floor admits public only — targeted/unlisted rows never reach the floor", () => {
  assert.ok(floorCandidate(row({ id: "a" }), NOW));
  assert.equal(floorCandidate(row({ id: "b", visibility: "targeted" }), NOW), null);
  assert.equal(floorCandidate(row({ id: "c", visibility: "unlisted" }), NOW), null);
});

test("V3-35 core: deterministic scoring — same row + same clock, same score and reasons", () => {
  const soonNew = row({
    id: "a",
    ends_at: "2026-07-25T12:00:00.000Z",
    created_at: "2026-07-23T12:00:00.000Z",
  });
  const first = floorCandidate(soonNew, NOW);
  const second = floorCandidate(soonNew, NOW);
  assert.deepEqual(first, second);
  assert.ok(first);
  assert.ok(Math.abs(first.score - 0.8) < 1e-9, `score ${first.score} ≈ 0.8`);
  assert.deepEqual(first.reasonCodes, ["division_local", "ending_soon", "new_this_week"]);

  const crossDivision = floorCandidate(row({ id: "b", scope_division: null }), NOW);
  assert.ok(crossDivision);
  assert.deepEqual(crossDivision.reasonCodes, ["cross_division_offer"]);
  assert.equal(crossDivision.score, 0.5);
});

test("V3-35 core: targeting matches ONLY the viewer's own division mix (stranger mix = nothing)", () => {
  const marketplaceDeal = row({ id: "a", scope_division: "marketplace" });
  const viewerMix = deriveRecentDealDivisions([
    { division: "marketplace" },
    { division: "not-a-division" },
    { division: null },
  ]);
  assert.deepEqual([...viewerMix], ["marketplace"]);

  const admitted = targetedCandidate(marketplaceDeal, viewerMix, NOW);
  assert.ok(admitted);
  assert.equal(admitted.tier, "targeted");
  assert.deepEqual(admitted.reasonCodes, ["recent_division_activity"]);

  // A viewer with NO matching activity gets nothing from the targeted reader.
  const strangerMix = deriveRecentDealDivisions([{ division: "care" }]);
  assert.equal(targetedCandidate(marketplaceDeal, strangerMix, NOW), null);
  assert.equal(targetedCandidate(marketplaceDeal, new Set(), NOW), null);
});

test("V3-35 core: audience_signals descriptors match divisions, never user ids", () => {
  const targeted = row({
    id: "a",
    scope_division: null,
    visibility: "targeted",
    audience_signals: { divisions: ["learn"] },
  });
  const learnMix = deriveRecentDealDivisions([{ division: "learn" }]);
  assert.ok(targetedCandidate(targeted, learnMix, NOW));
  const otherMix = deriveRecentDealDivisions([{ division: "jobs" }]);
  assert.equal(targetedCandidate(targeted, otherMix, NOW), null);
  // Malformed descriptors are ignored, not trusted.
  const malformed = row({
    id: "b",
    scope_division: null,
    visibility: "targeted",
    audience_signals: { divisions: "learn" },
  });
  assert.equal(targetedCandidate(malformed, learnMix, NOW), null);
});

test("V3-35 core: artifact-shape guards — malformed terms are skipped, never guessed", () => {
  assert.equal(
    toDealTerms(row({ id: "a", deal_type: "fixed_off", discount_minor: null, discount_percent: null })),
    null,
  );
  assert.equal(
    toDealTerms(
      row({
        id: "b",
        deal_type: "fixed_off",
        discount_percent: null,
        discount_minor: 250000,
        discount_currency: null,
      }),
    ),
    null,
  );
  assert.deepEqual(
    toDealTerms(
      row({
        id: "c",
        deal_type: "fixed_off",
        discount_percent: null,
        discount_minor: 250000,
        discount_currency: "NGN",
      }),
    ),
    { kind: "fixed_off", amountMinor: 250000, currency: "NGN" },
  );
  assert.equal(toDealTerms(row({ id: "d", deal_type: "mystery" })), null);
});

test("V3-35 core: links are config-derived — zero hardcoded domains", () => {
  assert.equal(
    dealHref({ scope_division: "marketplace", target_ref: "gold-kettle" }),
    `${getDivisionUrl("marketplace")}/product/gold-kettle`,
  );
  assert.equal(dealHref({ scope_division: "care", target_ref: null }), getDivisionUrl("care"));
  assert.equal(dealHref({ scope_division: null, target_ref: null }), henryWebRoot("/"));
});
