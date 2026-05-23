/**
 * SEARCH-01 — Diversity cap probes.
 *
 * The diversity cap prevents one division from flooding the result
 * list when a generic query lands hundreds of marketplace product
 * matches. The anchor division (user's `primary_division`) is
 * exempt; everyone else caps at `perDivisionCap`. Overflow that
 * meets `overflowFloor` lands at the tail.
 *
 * Runtime: node:test (Node 24+).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { applyDiversityCap } from "../ranking";
import type { UnifiedSearchResult } from "../types";

function hit(
  partial: Partial<UnifiedSearchResult> & {
    id: string;
    division: UnifiedSearchResult["division"];
    score: number;
  },
): UnifiedSearchResult {
  return {
    type: "page" as UnifiedSearchResult["type"],
    title: partial.id,
    subtitle: undefined,
    description: undefined,
    url: `/${partial.id}`,
    authRequirement: "none" as UnifiedSearchResult["authRequirement"],
    visibility: "public" as UnifiedSearchResult["visibility"],
    badge: undefined,
    icon: "search" as UnifiedSearchResult["icon"],
    priority: 50,
    source: "shared_catalog" as UnifiedSearchResult["source"],
    tags: [],
    metadata: undefined,
    resolution: "indexed" as UnifiedSearchResult["resolution"],
    ...partial,
  };
}

describe("applyDiversityCap", () => {
  it("caps non-anchor divisions at perDivisionCap; anchor passes through", () => {
    const hits: UnifiedSearchResult[] = [
      hit({ id: "m1", division: "marketplace", score: 1.0 }),
      hit({ id: "m2", division: "marketplace", score: 0.95 }),
      hit({ id: "m3", division: "marketplace", score: 0.9 }),
      hit({ id: "m4", division: "marketplace", score: 0.85 }), // overflow
      hit({ id: "p1", division: "property", score: 0.8 }),
      hit({ id: "p2", division: "property", score: 0.75 }),
    ];
    const out = applyDiversityCap(hits, {
      perDivisionCap: 3,
      overflowFloor: 0.5,
      anchorDivision: undefined,
    });
    // marketplace caps at 3, property passes through (only 2),
    // m4 lands in overflow but above floor (0.85 >= 0.5).
    assert.deepEqual(
      out.map((h) => h.id),
      ["m1", "m2", "m3", "p1", "p2", "m4"],
    );
  });

  it("anchor division is exempt from the cap", () => {
    const hits: UnifiedSearchResult[] = [
      hit({ id: "m1", division: "marketplace", score: 1.0 }),
      hit({ id: "m2", division: "marketplace", score: 0.95 }),
      hit({ id: "m3", division: "marketplace", score: 0.9 }),
      hit({ id: "m4", division: "marketplace", score: 0.85 }),
      hit({ id: "m5", division: "marketplace", score: 0.8 }),
      hit({ id: "p1", division: "property", score: 0.78 }),
    ];
    const out = applyDiversityCap(hits, {
      perDivisionCap: 2,
      overflowFloor: 0.5,
      anchorDivision: "marketplace",
    });
    // marketplace is anchor → all 5 pass; property un-capped (only 1).
    assert.deepEqual(
      out.map((h) => h.id),
      ["m1", "m2", "m3", "m4", "m5", "p1"],
    );
  });

  it("drops overflow below the overflowFloor", () => {
    const hits: UnifiedSearchResult[] = [
      hit({ id: "j1", division: "jobs", score: 0.9 }),
      hit({ id: "j2", division: "jobs", score: 0.85 }),
      hit({ id: "j3", division: "jobs", score: 0.4 }), // below floor → drop
      hit({ id: "p1", division: "property", score: 0.7 }),
    ];
    const out = applyDiversityCap(hits, {
      perDivisionCap: 2,
      overflowFloor: 0.5,
      anchorDivision: undefined,
    });
    assert.deepEqual(
      out.map((h) => h.id),
      ["j1", "j2", "p1"],
    );
  });

  it("preserves relative order within division and overflow tier", () => {
    const hits: UnifiedSearchResult[] = [
      hit({ id: "a", division: "care", score: 1.0 }),
      hit({ id: "b", division: "care", score: 0.95 }),
      hit({ id: "c", division: "care", score: 0.9 }), // overflow #1
      hit({ id: "d", division: "care", score: 0.85 }), // overflow #2
    ];
    const out = applyDiversityCap(hits, {
      perDivisionCap: 2,
      overflowFloor: 0.5,
      anchorDivision: undefined,
    });
    assert.deepEqual(
      out.map((h) => h.id),
      ["a", "b", "c", "d"],
    );
  });

  it("perDivisionCap <= 0 returns input unchanged", () => {
    const hits: UnifiedSearchResult[] = [
      hit({ id: "a", division: "care", score: 1.0 }),
      hit({ id: "b", division: "care", score: 0.95 }),
    ];
    const out = applyDiversityCap(hits, {
      perDivisionCap: 0,
      overflowFloor: 0.5,
      anchorDivision: undefined,
    });
    assert.equal(out, hits);
  });
});
