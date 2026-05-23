/**
 * SEARCH-01 — Synonym book probes.
 *
 * Pins curated invariants:
 *   - every division has a stable set of groups
 *   - no group is empty
 *   - aliases never contain the root verbatim (would be a no-op)
 *   - synonym IDs are deterministic and url-safe
 *
 * Runtime: node:test (Node 24+).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  SYNONYMS_BY_DIVISION,
  buildTypesenseSynonyms,
  flattenSynonymsForDivision,
} from "../synonyms";

describe("SYNONYMS_BY_DIVISION", () => {
  it("declares an entry for every known division", () => {
    const expected = [
      "marketplace",
      "property",
      "care",
      "jobs",
      "learn",
      "logistics",
      "studio",
      "account",
      "hub",
      "staff",
    ] as const;
    for (const division of expected) {
      assert.ok(
        SYNONYMS_BY_DIVISION[division] !== undefined,
        `division ${division} missing from synonyms book`,
      );
    }
  });

  it("every group has a non-empty root and at least one alias", () => {
    for (const [division, groups] of Object.entries(SYNONYMS_BY_DIVISION)) {
      for (const group of groups) {
        assert.ok(group.root.length > 0, `${division}: empty root`);
        assert.ok(
          group.aliases.length > 0,
          `${division}/${group.root}: aliases must be non-empty`,
        );
      }
    }
  });

  it("aliases do not contain the root verbatim", () => {
    for (const [division, groups] of Object.entries(SYNONYMS_BY_DIVISION)) {
      for (const group of groups) {
        const lowerRoot = group.root.toLowerCase();
        const lowerAliases = group.aliases.map((a) => a.toLowerCase());
        assert.ok(
          !lowerAliases.includes(lowerRoot),
          `${division}/${group.root}: alias list contains root verbatim`,
        );
      }
    }
  });
});

describe("buildTypesenseSynonyms", () => {
  it("emits one payload per group with a deterministic id", () => {
    const payloads = buildTypesenseSynonyms("marketplace");
    assert.ok(payloads.length > 0);
    for (const p of payloads) {
      assert.match(p.id, /^marketplace_[a-z0-9-]+$/);
      assert.ok(p.synonyms.length >= 2, "synonyms array includes root + aliases");
      assert.equal(p.synonyms[0], p.root);
    }
  });

  it("returns an empty array for divisions with no synonym groups", () => {
    assert.deepEqual(buildTypesenseSynonyms("hub"), []);
    assert.deepEqual(buildTypesenseSynonyms("staff"), []);
  });
});

describe("flattenSynonymsForDivision", () => {
  it("flattens root + aliases into a single ordered list", () => {
    const flat = flattenSynonymsForDivision("care");
    assert.ok(flat.includes("cleaning"));
    assert.ok(flat.includes("housekeeping"));
    assert.ok(flat.includes("nanny"));
    assert.ok(flat.includes("babysitter"));
  });
});
