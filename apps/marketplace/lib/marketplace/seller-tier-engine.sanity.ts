// ---------------------------------------------------------------------------
// V3-58 — Seller-tier engine boundary tests
//
// Run via: npx tsx apps/marketplace/lib/marketplace/seller-tier-engine.sanity.ts
//
// Proves every Bronze/Silver/Gold threshold boundary that the SQL RPC must also
// honor: 49 vs 50 txns, 4.49 vs 4.5 rating, partial-course completion, downgrade
// on signal loss, and the inputs-snapshot contract.
// ---------------------------------------------------------------------------

import {
  deriveSellerTier,
  tierTransitionDirection,
  SELLER_TIER_THRESHOLDS,
  type SellerTier,
  type SellerTierInputs,
} from "./seller-tier-engine";

let passed = 0;
let failed = 0;

function check(label: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${label}: ${err}`);
    failed++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function inputs(over: Partial<SellerTierInputs>): SellerTierInputs {
  return {
    foundationalCourseCompleted: false,
    intermediateCourseCompleted: false,
    advancedCourseCompleted: false,
    completedTransactions: 0,
    averageRating: null,
    ...over,
  };
}

function expectTier(label: string, over: Partial<SellerTierInputs>, expected: SellerTier) {
  check(label, () => {
    const got = deriveSellerTier(inputs(over));
    assert(got === expected, `expected ${expected}, got ${got}`);
  });
}

console.log("\n=== V3-58 Seller-Tier Engine Boundaries ===\n");

// none
expectTier("no signals → none", {}, "none");
expectTier("transactions+rating but no course → none (course is mandatory)", { completedTransactions: 500, averageRating: 5 }, "none");

// bronze
expectTier("foundational only → bronze", { foundationalCourseCompleted: true }, "bronze");
expectTier("foundational + 49 txns (below silver) → bronze", { foundationalCourseCompleted: true, intermediateCourseCompleted: true, completedTransactions: 49 }, "bronze");

// silver boundary: 49 vs 50
expectTier("foundational+intermediate + 50 txns → silver (boundary)", { foundationalCourseCompleted: true, intermediateCourseCompleted: true, completedTransactions: 50 }, "silver");
expectTier("intermediate missing at 50 txns → bronze (partial course)", { foundationalCourseCompleted: true, completedTransactions: 50 }, "bronze");

// gold boundaries: txns 199 vs 200, rating 4.49 vs 4.5, course completeness
expectTier("all courses + 199 txns + 4.6 → silver (txns below gold)", { foundationalCourseCompleted: true, intermediateCourseCompleted: true, advancedCourseCompleted: true, completedTransactions: 199, averageRating: 4.6 }, "silver");
expectTier("all courses + 200 txns + 4.49 → silver (rating below gold)", { foundationalCourseCompleted: true, intermediateCourseCompleted: true, advancedCourseCompleted: true, completedTransactions: 200, averageRating: 4.49 }, "silver");
expectTier("all courses + 200 txns + 4.5 → gold (boundary)", { foundationalCourseCompleted: true, intermediateCourseCompleted: true, advancedCourseCompleted: true, completedTransactions: 200, averageRating: 4.5 }, "gold");
expectTier("advanced missing at gold numbers → silver (partial course)", { foundationalCourseCompleted: true, intermediateCourseCompleted: true, advancedCourseCompleted: false, completedTransactions: 200, averageRating: 4.9 }, "silver");
expectTier("gold numbers but null rating → silver (no rating data)", { foundationalCourseCompleted: true, intermediateCourseCompleted: true, advancedCourseCompleted: true, completedTransactions: 200, averageRating: null }, "silver");

// downgrade direction on signal loss
check("downgrade direction detected when rating drops (gold → silver)", () => {
  const before = deriveSellerTier(inputs({ foundationalCourseCompleted: true, intermediateCourseCompleted: true, advancedCourseCompleted: true, completedTransactions: 220, averageRating: 4.7 }));
  const after = deriveSellerTier(inputs({ foundationalCourseCompleted: true, intermediateCourseCompleted: true, advancedCourseCompleted: true, completedTransactions: 220, averageRating: 4.1 }));
  assert(before === "gold", `before should be gold, got ${before}`);
  assert(after === "silver", `after should be silver, got ${after}`);
  assert(tierTransitionDirection(before, after) === "down", "direction should be down");
  assert(tierTransitionDirection(after, before) === "up", "reverse should be up");
  assert(tierTransitionDirection(before, before) === "same", "equal should be same");
});

// negative / malformed signals are coerced safely
expectTier("negative txns coerced to 0 → bronze", { foundationalCourseCompleted: true, intermediateCourseCompleted: true, completedTransactions: -5 }, "bronze");

// thresholds are the documented constants (guards against silent drift)
check("threshold constants match spec", () => {
  assert(SELLER_TIER_THRESHOLDS.silver.minCompletedTransactions === 50, "silver=50");
  assert(SELLER_TIER_THRESHOLDS.gold.minCompletedTransactions === 200, "gold txns=200");
  assert(SELLER_TIER_THRESHOLDS.gold.minAverageRating === 4.5, "gold rating=4.5");
});

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
