/**
 * SEARCH-01 — Per-collection tuning snapshot probes.
 *
 * Pins the multi_search parameter set per collection so a regression
 * that silently widens typo tolerance (or removes the title-weight
 * boost) flags in CI.
 *
 * Runtime: node:test (Node 24+).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { COLLECTIONS_BY_NAME } from "../collections";
import { DEFAULT_TUNING, getCollectionTuning } from "../collection-tuning";

describe("collection-tuning", () => {
  it("default tuning weights title above summary", () => {
    // query_by_weights mirrors query_by="title,summary,tags,badge"
    const weights = DEFAULT_TUNING.query_by_weights.split(",").map((s) => Number(s));
    const [titleWeight, summaryWeight, tagsWeight, badgeWeight] = weights;
    assert.equal(weights.length, 4, "weights length matches query_by field count");
    assert.ok(titleWeight! > summaryWeight!, "title weight beats summary");
    assert.ok(summaryWeight! > tagsWeight!, "summary weight beats tags");
    assert.equal(tagsWeight, badgeWeight, "tags and badge tie at floor");
  });

  it("min_len_2typo > min_len_1typo on the default", () => {
    assert.ok(DEFAULT_TUNING.min_len_2typo > DEFAULT_TUNING.min_len_1typo);
  });

  it("workflows override disables typo tolerance", () => {
    const tuning = getCollectionTuning(COLLECTIONS_BY_NAME.hc_workflows!);
    assert.equal(tuning.num_typos, 0);
    assert.ok(tuning.min_len_1typo >= 100, "1-typo effectively disabled");
    assert.ok(tuning.min_len_2typo >= 100, "2-typo effectively disabled");
  });

  it("property areas tightens 1-typo to 5 chars", () => {
    const tuning = getCollectionTuning(COLLECTIONS_BY_NAME.hc_property_areas!);
    assert.equal(tuning.min_len_1typo, 5);
  });

  it("certificates disables typo tolerance entirely", () => {
    const tuning = getCollectionTuning(COLLECTIONS_BY_NAME.hc_learn_certificates!);
    assert.equal(tuning.num_typos, 0);
  });

  it("collections without overrides return DEFAULT_TUNING", () => {
    const tuning = getCollectionTuning(COLLECTIONS_BY_NAME.hc_marketplace_products!);
    assert.deepEqual(tuning, DEFAULT_TUNING);
  });

  it("every defined collection produces a valid tuning record", () => {
    for (const collection of Object.values(COLLECTIONS_BY_NAME)) {
      const tuning = getCollectionTuning(collection);
      assert.ok(tuning.query_by_weights.length > 0, `${collection.name} has weights`);
      assert.ok(typeof tuning.num_typos !== "undefined", `${collection.name} has num_typos`);
      assert.ok(tuning.min_len_1typo > 0, `${collection.name} has min_len_1typo > 0`);
      assert.ok(tuning.min_len_2typo > 0, `${collection.name} has min_len_2typo > 0`);
    }
  });
});
