// ---------------------------------------------------------------------------
// @henryco/pricing  --  Currency sanity checks
//
// Run via: npx tsx packages/pricing/src/currency-sanity.ts
//
// Validates:
// - All countries in config have a resolvable display currency
// - formatMoney works for every supported currency
// - settlement truth strings are non-empty
// - No ambiguous currency assertions are wrongly thrown
// - Exchange rate fallback does not throw
// ---------------------------------------------------------------------------

import { formatMoney, formatMoneyRange, getCurrencyMinorUnit, isSupportedCurrency, SUPPORTED_CURRENCY_CODES } from '../../i18n/currency';
import {
  resolveDisplayCurrencyForCountry,
  resolveSettlementCurrencyForDivision,
  describeSettlementTruth,
  buildCurrencySnapshot,
  buildFallbackExchangeRateSnapshot,
  assertNoAmbiguousCurrency,
  SYSTEM_BASE_CURRENCY,
} from './currency-model';

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

console.log('\n=== HenryCo Currency Sanity ===\n');

// -- Currency map completeness --
console.log('1. Currency map covers all country currencies');
const countryCurrencies = ['NGN','XOF','GHS','KES','ZAR','GBP','USD','CAD','EUR','MAD','EGP','AED','SAR','INR','CNY'];
for (const code of countryCurrencies) {
  check(`isSupportedCurrency(${code})`, () => {
    assert(isSupportedCurrency(code), `${code} missing from CURRENCY_MAP`);
  });
}

// -- formatMoney for all supported codes --
console.log('\n2. formatMoney for all supported currencies');
for (const code of SUPPORTED_CURRENCY_CODES) {
  check(`formatMoney(100, "${code}")`, () => {
    const result = formatMoney(100, code);
    assert(typeof result === 'string' && result.length > 0, `formatMoney returned empty for ${code}`);
  });
}

// -- Minor units --
console.log('\n3. Minor unit counts');
check('NGN = 2 decimals', () => assert(getCurrencyMinorUnit('NGN') === 2, 'NGN should be 2'));
check('XOF = 0 decimals', () => assert(getCurrencyMinorUnit('XOF') === 0, 'XOF should be 0'));
check('USD = 2 decimals', () => assert(getCurrencyMinorUnit('USD') === 2, 'USD should be 2'));

// -- Money range --
console.log('\n4. formatMoneyRange');
check('formatMoneyRange NGN 100–500', () => {
  const r = formatMoneyRange(10000, 50000, 'NGN');
  assert(r.includes('–'), 'range should contain –');
});
check('formatMoneyRange single amount', () => {
  const r = formatMoneyRange(10000, null, 'NGN');
  assert(!r.includes('–'), 'single amount should not contain –');
});

// -- Country → display currency --
console.log('\n5. Country display currency resolution');
const countryExpectations: Record<string, string> = {
  NG: 'NGN', BJ: 'XOF', GH: 'GHS', ZA: 'ZAR', GB: 'GBP',
  US: 'USD', FR: 'EUR', IT: 'EUR', AE: 'AED', NG_unknown: 'NGN',
};
for (const [country, expectedCurrency] of Object.entries(countryExpectations)) {
  const code = country === 'NG_unknown' ? 'XX' : country;
  check(`resolveDisplayCurrencyForCountry(${code}) = ${expectedCurrency}`, () => {
    const result = resolveDisplayCurrencyForCountry(code);
    assert(result === expectedCurrency, `Expected ${expectedCurrency}, got ${result}`);
  });
}

// -- Settlement status --
console.log('\n6. Settlement availability per division');
const divisions = ['marketplace', 'care', 'property', 'studio', 'learn', 'logistics'];
for (const div of divisions) {
  check(`${div} settlement = NGN`, () => {
    const { settlementCurrency } = resolveSettlementCurrencyForDivision(div);
    assert(settlementCurrency === SYSTEM_BASE_CURRENCY, `Expected NGN, got ${settlementCurrency}`);
  });
}

// -- Settlement truth strings --
console.log('\n7. Settlement truth descriptions');
check('NGN display = aligned msg', () => {
  const msg = describeSettlementTruth('NGN', 'marketplace');
  assert(msg.length > 0, 'empty settlement truth');
});
check('EUR display = approximate msg', () => {
  const msg = describeSettlementTruth('EUR', 'marketplace');
  assert(msg.includes('NGN'), 'EUR display should mention NGN settlement');
});

// -- Currency snapshot --
console.log('\n8. buildCurrencySnapshot');
check('NGN→NGN no conversion', () => {
  const snap = buildCurrencySnapshot({
    division: 'marketplace',
    originalAmount: 100000,
    originalCurrency: 'NGN',
    displayCurrency: 'NGN',
    exchangeRateSnapshot: null,
  });
  assert(!snap.isApproximateDisplay, 'same currency should not be approximate');
  assert(snap.convertedDisplayAmount === 100000, 'amounts should match');
});
check('NGN→EUR with fallback rate', () => {
  const rateSnap = buildFallbackExchangeRateSnapshot('NGN', 'EUR');
  const snap = buildCurrencySnapshot({
    division: 'marketplace',
    originalAmount: 100000,
    originalCurrency: 'NGN',
    displayCurrency: 'EUR',
    exchangeRateSnapshot: rateSnap,
  });
  assert(snap.isApproximateDisplay, 'cross-currency should be approximate');
  assert(snap.settlementCurrency === 'NGN', 'settlement should still be NGN');
});

// -- assertNoAmbiguousCurrency --
console.log('\n9. assertNoAmbiguousCurrency');
check('throws when amount exists but currency missing', () => {
  let threw = false;
  try { assertNoAmbiguousCurrency(1000, null, 'test'); } catch { threw = true; }
  assert(threw, 'should throw for missing currency');
});
check('passes when both amount and currency present', () => {
  assertNoAmbiguousCurrency(1000, 'NGN', 'test'); // should not throw
});
check('passes when amount is null', () => {
  assertNoAmbiguousCurrency(null, null, 'test'); // should not throw
});

// -- Fallback exchange rate --
console.log('\n10. Exchange rate fallback snapshot');
check('buildFallbackExchangeRateSnapshot is safe', () => {
  const snap = buildFallbackExchangeRateSnapshot('NGN', 'EUR');
  assert(snap.isFallback, 'should be marked fallback');
  assert(snap.isStale, 'fallback should be stale');
  assert(snap.rate === 1, 'fallback rate should be 1');
});

// -- Report --
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
