/**
 * Locale truth sanity script — run with: npx tsx packages/i18n/locale-sanity.ts
 *
 * Verifies resolveLocaleOrder and getUserSelectableLocales behave consistently
 * with the effective-locale policy implemented in Phase 2.
 *
 * Not shipped to users; not a runtime dependency.
 */

import { resolveLocaleOrder } from "./src/resolve-locale.ts";
import { getUserSelectableLocales, PUBLIC_SELECTOR_LOCALES, isScaffoldLocale } from "./src/locales.ts";

let passed = 0;
let failed = 0;

function assert(label: string, actual: unknown, expected: unknown) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr === expectedStr) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    console.error(`    expected: ${expectedStr}`);
    console.error(`    actual:   ${actualStr}`);
    failed++;
  }
}

function assertIncludes(label: string, haystack: unknown[], needle: unknown) {
  if (haystack.includes(needle)) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    console.error(`    expected ${JSON.stringify(needle)} to be in ${JSON.stringify(haystack)}`);
    failed++;
  }
}

function assertExcludes(label: string, haystack: unknown[], needle: unknown) {
  if (!haystack.includes(needle)) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    console.error(`    expected ${JSON.stringify(needle)} NOT to be in ${JSON.stringify(haystack)}`);
    failed++;
  }
}

// ── resolveLocaleOrder ──────────────────────────────────────────────────────

console.log("\nresolveLocaleOrder:");

assert(
  "cookie=zh + profile=it → zh (cookie wins)",
  resolveLocaleOrder({ cookieLocale: "zh", savedLanguage: "it" }),
  "zh",
);

assert(
  "cookie=it + profile=en → it (cookie wins)",
  resolveLocaleOrder({ cookieLocale: "it", savedLanguage: "en" }),
  "it",
);

assert(
  "invalid cookie + profile=fr → fr (profile fallback)",
  resolveLocaleOrder({ cookieLocale: "xx", savedLanguage: "fr" }),
  "fr",
);

assert(
  "no cookie + no profile + accept=de → de",
  resolveLocaleOrder({ acceptLanguage: "de,en;q=0.9" }),
  "de",
);

assert(
  "no cookie + no profile + no accept + country=IT → it",
  resolveLocaleOrder({ country: "IT" }),
  "it",
);

assert(
  "all null → en (default)",
  resolveLocaleOrder({}),
  "en",
);

// ── getUserSelectableLocales ────────────────────────────────────────────────

console.log("\ngetUserSelectableLocales:");

const publicLocales = getUserSelectableLocales();
assert(
  "no args returns exactly the registered public locales (now ALL 12)",
  [...publicLocales].sort(),
  [...PUBLIC_SELECTOR_LOCALES].sort(),
);

// Post Wave A2: the "scaffold" concept dissolved. Every locale is now in
// PUBLIC_SELECTOR_LOCALES. We keep the assertion below to lock that in.
const previouslyScaffoldLocales = ["ig", "yo", "ha", "zh", "hi"] as const;
for (const loc of previouslyScaffoldLocales) {
  assertIncludes(`selector exposes previously-scaffold locale '${loc}'`, publicLocales, loc);
}

assertIncludes("new user selector includes 'it' (Italian)", publicLocales, "it");
assertIncludes("new user selector includes 'ar' (Arabic)", publicLocales, "ar");

const zhUserLocales = getUserSelectableLocales("zh");
assertIncludes("existing zh user: zh appears in selector", zhUserLocales, "zh");
for (const loc of previouslyScaffoldLocales.filter((l) => l !== "zh")) {
  assertIncludes(
    `existing zh user: other previously-scaffold '${loc}' is now also exposed`,
    zhUserLocales,
    loc,
  );
}

const itZhMixed = getUserSelectableLocales("it", "zh");
assertIncludes("it+zh preserved: zh appears as selector option", itZhMixed, "zh");
assertIncludes("it+zh preserved: it appears as selector option", itZhMixed, "it");
assertIncludes("it+zh preserved: ig is now exposed too (promoted)", itZhMixed, "ig");

// ── scaffold label check ────────────────────────────────────────────────────

console.log("\nScaffold labels:");
for (const loc of previouslyScaffoldLocales) {
  // After Wave A2 the scaffold list is empty; every locale is non-scaffold.
  assert(`isScaffoldLocale('${loc}') === false (promoted)`, isScaffoldLocale(loc), false);
}
assert("isScaffoldLocale('it') === false", isScaffoldLocale("it"), false);
assert("isScaffoldLocale('en') === false", isScaffoldLocale("en"), false);

// ── summary ─────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} assertions: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
