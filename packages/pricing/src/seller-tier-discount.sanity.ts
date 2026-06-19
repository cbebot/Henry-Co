// ---------------------------------------------------------------------------
// @henryco/pricing  --  Seller-tier discount sanity checks (V3-58)
//
// Run via: npx tsx packages/pricing/src/seller-tier-discount.sanity.ts
//
// Validates the DORMANT fee-discount resolver:
// - The default (D9-unratified) table resolves 0% for EVERY tier/division pair.
// - 'none' and 'bronze' always resolve to 0 (by spec), even on a ratified table.
// - Unknown tiers/divisions safely default to 0 (no surprise discount).
// - A hypothetical ratified table resolves its configured silver/gold rates,
//   case-insensitively, and clamps an out-of-range (>=1) rate back to 0.
// ---------------------------------------------------------------------------

import {
  sellerTierDiscount,
  defaultSellerTierDiscountTable,
  type SellerTierDiscountTable,
} from './seller-tier-discount';

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

console.log('\n=== HenryCo Seller-Tier Discount Sanity ===\n');

const DIVISIONS = ['marketplace', 'care', 'studio', 'learn', 'logistics', 'property', 'jobs'];
const TIERS = ['none', 'bronze', 'silver', 'gold'];

check('default table is flagged unratified', () => {
  assert(defaultSellerTierDiscountTable().ratified === false, 'default table must be unratified');
});

check('default (D9-unratified) → 0% for every tier × division', () => {
  for (const d of DIVISIONS) {
    for (const t of TIERS) {
      assert(sellerTierDiscount(t, d) === 0, `expected 0 for ${t}/${d}`);
    }
  }
});

check('unknown tier/division → 0', () => {
  assert(sellerTierDiscount('platinum', 'marketplace') === 0, 'unknown tier');
  assert(sellerTierDiscount('gold', 'spaceport') === 0, 'unknown division');
  assert(sellerTierDiscount('', '') === 0, 'empty inputs');
});

// A hypothetical ratified schedule — proves the resolver returns configured
// values once an owner ratifies D9, without changing the function shape.
const RATIFIED: SellerTierDiscountTable = {
  key: 'seller_tier_discount_test',
  version: 'test',
  ratified: true,
  rates: {
    marketplace: { none: 0, bronze: 0, silver: 0.05, gold: 0.1 },
    care: { silver: 0.02, gold: 1.5 /* invalid — must clamp to 0 */ },
  },
};

check("ratified: 'none'/'bronze' still resolve 0 (by spec)", () => {
  assert(sellerTierDiscount('none', 'marketplace', RATIFIED) === 0, 'none must be 0');
  assert(sellerTierDiscount('bronze', 'marketplace', RATIFIED) === 0, 'bronze must be 0');
});

check('ratified: silver/gold resolve configured rates', () => {
  assert(sellerTierDiscount('silver', 'marketplace', RATIFIED) === 0.05, 'silver 5%');
  assert(sellerTierDiscount('gold', 'marketplace', RATIFIED) === 0.1, 'gold 10%');
});

check('ratified: inputs are case-insensitive', () => {
  assert(sellerTierDiscount('SILVER', 'Marketplace', RATIFIED) === 0.05, 'case-insensitive');
});

check('ratified: out-of-range (>=1) rate clamps to 0', () => {
  assert(sellerTierDiscount('gold', 'care', RATIFIED) === 0, 'invalid rate must clamp to 0');
});

check('ratified: division with no configured tier → 0', () => {
  assert(sellerTierDiscount('gold', 'studio', RATIFIED) === 0, 'unconfigured division');
});

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
