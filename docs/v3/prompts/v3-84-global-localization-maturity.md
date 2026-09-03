# V3-84 — Global/Mobile: Localization Maturity

**Pass ID:** V3-84  ·  **Phase:** I (Platform/API + Global/Mobile + Observability + Closure)  ·  **Pillar:** P12 (Foundation & Trust), P3 (Personalized Ecosystem)
**Dependencies:** V3-12 (Foundation Lock acceptance — CERTIFIED, PR #168), V3-21 (tax engine)  ·  **Effort:** XL  ·  **Parallel-safe:** Y
**Owner gate:** D10 (per-market localization commitment)  ·  **Risk class:** Compliance

---

## Role
You are the V3 Global Localization engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass turns the company's existing *string-level* i18n into *market-level* localization maturity: per-country currency rounding, address layout, phone format, tax-display behaviour, and holiday calendars — each behind an honest per-market readiness gate so a market only "goes localized" when the owner commits it. The line it must not cross: it changes formatting and display rules only — it never moves settlement currency, never touches the `@henryco/payment-router` selection logic (that is V3-85), and never invents a market the owner has not committed in D10. **Read the current answer to D10 in `docs/v3/DECISIONS-REQUIRED.md` before you write a line of code; build only the markets D10 commits, scaffold the rest as `language_only`.**

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/84-global-localization-maturity` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The foundation already exists and is richer than a greenfield stub would assume — this pass *matures* it, it does not start it.

- **`packages/config/countries.ts`** ships the real 22-country registry `SUPPORTED_COUNTRIES` (`code`, `name`, `currency`, `currencySymbol`, `dialCode`, `flag`, `locale`, `availability`), a `CountryAvailability` enum (`active | limited | coming_soon | language_only | unavailable`), `DEFAULT_COUNTRY` (Nigeria, `default: true`), and helpers `findCountryByCode`, `resolveCountry`, `formatCurrencyForCountry`. Nigeria is `active`; everything else is `limited` or `language_only`. (Note: this file still carries a stale `Henry & Co.` comment — sweep it to `Henry Onyx` as part of this pass.)
- **`@henryco/pricing`** already owns the money truth: `src/currency-model.ts` (the `CurrencyLayerSnapshot` separating display / pricing / settlement / ledger / wallet currencies, `SYSTEM_BASE_CURRENCY = 'NGN'`, `resolveDisplayCurrencyForCountry`, `describeSettlementTruth`) and `src/exchange-rate.ts` (server-only Open Exchange Rates client, **env `OPENRATE_APP_ID` / `OPEN_EXCHANGE_RATES_APP_ID`** — NOT a generic `FOREX_API_KEY`; 30-min cache; identity-rate fallback so conversion failure never blocks a render).
- **`@henryco/i18n`** ships `format-number.ts` (`formatNumber`/`formatPercent`/`formatCompact` over a `LOCALE_MAP`), `format-date.ts`, the 12-locale registry `locales.ts` (`ALL_LOCALES`, `LOCALE_TIERS`, `RTL_LOCALES = ['ar']`), and the Pattern A typed-copy + Pattern B runtime-DeepL surfaces.
- **V3-21** (tax engine) lands the per-country tax-rate primitives this pass consumes for tax-included-vs-excluded display.

**The gap this pass closes:** there is currency *formatting* but no per-country **rounding policy** (XOF/JPY have no minor unit; NGN rounds to whole kobo) wired into the money path; there is a `dialCode` but no **E.164 + national phone format/validation**; there is no **address-layout template per country**; there is no **holiday calendar** for SLA/booking date math; and the rate engine is wired for display but not surfaced as a daily-refreshed, telemetered market service. This pass adds those five maturity layers as a typed `MarketProfile` per country, gated by `availability`.

## Mandatory scope

### S1 — `MarketProfile` model in `@henryco/config`
New module `packages/config/market-profile.ts` exporting one typed profile per ISO-3166 country, keyed off the existing `SUPPORTED_COUNTRIES` (do not duplicate the country list — derive). Never hardcode a bare currency or country string anywhere downstream; resolve through this profile.

```typescript
// packages/config/market-profile.ts
import type { SupportedCountry } from "./countries";

export type CurrencyRoundingPolicy = {
  /** ISO 4217 minor-unit exponent. NGN=2, XOF=0, JPY=0, USD=2. */
  minorUnitExponent: number;
  /** Smallest displayable increment in minor units (e.g. NGN rounds display to 100 = ₦1). */
  displayIncrementMinor: number;
  /** Rounding mode applied at the display boundary only — never at settlement. */
  mode: "half_up" | "half_even" | "ceil" | "floor";
};

export type AddressFieldKey =
  | "recipient" | "line1" | "line2" | "city" | "state" | "postalCode" | "country";

export type AddressFormat = {
  /** Ordered rows; each row is the field keys rendered together. ISO 3166 layout. */
  layout: AddressFieldKey[][];
  /** Field keys that are required for a valid address in this market. */
  required: AddressFieldKey[];
  /** Localized field-label copy keys (i18n namespace surface:address), never literals. */
  labelKeyByField: Partial<Record<AddressFieldKey, string>>;
  /** Postal-code regex when the market uses one; null when it does not (e.g. NG). */
  postalCodePattern: string | null;
};

export type PhoneFormat = {
  /** E.164 country calling code without "+" (e.g. NG → "234"). Derived from dialCode. */
  e164CallingCode: string;
  /** National significant number length(s) accepted. */
  nationalNumberLengths: number[];
  /** libphonenumber-style example for placeholder copy. */
  exampleNational: string;
};

export type TaxDisplayBehaviour = {
  /** Whether prices are shown tax-inclusive (most of EU/NG VAT) or tax-exclusive (US sales tax). */
  pricesIncludeTax: boolean;
  /** i18n copy key for the tax line label (e.g. "VAT", "GST", "Sales tax") — never a literal. */
  taxLabelKey: string;
};

export type MarketProfile = {
  country: SupportedCountry;
  rounding: CurrencyRoundingPolicy;
  address: AddressFormat;
  phone: PhoneFormat;
  tax: TaxDisplayBehaviour;
  /** IANA timezone(s) used for SLA/holiday math. */
  timezones: string[];
  /** Holiday calendar key resolved in S5. */
  holidayCalendarKey: string;
};

export function resolveMarketProfile(countryCodeOrName?: string | null): MarketProfile;
export function isMarketLocalized(countryCode: string): boolean; // true only for D10-committed `active` markets
```

`isMarketLocalized` is the **single readiness gate**: it returns `true` only for countries whose `availability === "active"` AND that appear in the D10 commitment list. Every maturity feature below short-circuits to the Nigeria default behaviour for any market that is not localized — no half-localized market ever ships.

### S2 — Currency rounding wired into the money path
Add `applyDisplayRounding(amountMinor: number, profile: MarketProfile): number` to `@henryco/pricing` (`src/currency-model.ts`). It rounds the **`convertedDisplayAmount`** of a `CurrencyLayerSnapshot` to the market's `displayIncrementMinor` using `rounding.mode`. Hard constraint, defended by a unit test: `settlementAmount` and `originalAmount` are **never** touched — rounding is a *display* operation only, settlement stays exact NGN (`SYSTEM_BASE_CURRENCY`). `buildCurrencySnapshot` gains an optional `roundingProfile` param; when present it sets `convertedDisplayAmount` via `applyDisplayRounding` and flags `isApproximateDisplay` already-true (FX) markets unchanged.

### S3 — Address format + phone format
- `packages/config/market-profile.ts` carries the per-country `AddressFormat` and `PhoneFormat`. Markets with no postal code (Nigeria) set `postalCodePattern: null` and omit `postalCode` from `required`.
- Refactor the address capture surface that already exists — `packages/address-selector/` and `apps/account/components/addresses/AddressManagerClient.tsx` — to render fields in `address.layout` order with `address.required`/`postalCodePattern` validation, all labels via `surface:address` copy keys. No hardcoded "Postcode"/"State" literals.
- Phone validation uses `phone.e164CallingCode` + `nationalNumberLengths`; the input placeholder is `phone.exampleNational`. Store phone numbers in E.164. Do not hardcode `+234`.

### S4 — Tax-display behaviour (consumes V3-21)
`MarketProfile.tax` drives whether a price renders tax-inclusive or tax-exclusive and what the tax line is labelled (`taxLabelKey`). The actual rate computation belongs to V3-21's tax engine; this pass consumes V3-21's per-country rate and renders it per `TaxDisplayBehaviour`. Nigeria = 7.5% VAT, prices shown tax-inclusive, `taxLabelKey = "surface:payments.tax.vat"`. The receipt/invoice tax line (rendered by `@henryco/branded-documents` + `@henryco/payment-surface`) reads this profile — payment **behaviour** is untouched; only the displayed tax label/inclusion follows the market profile.

### S5 — Holiday calendars for SLA + booking math
New module `packages/config/holiday-calendar.ts`:
```typescript
export type Holiday = { date: string /* ISO yyyy-mm-dd */; nameKey: string /* i18n copy key */; };
export function getHolidays(calendarKey: string, year: number): Holiday[];
export function isBusinessDay(date: Date, profile: MarketProfile): boolean; // honours weekends + market holidays + timezone
export function addBusinessDays(date: Date, days: number, profile: MarketProfile): Date;
```
Holiday data is committed JSON per market (`packages/config/data/holidays/<ISO3166>.json`), regenerated yearly — never fetched at request time. SLA/ETA math in workflow (V3-43) and booking date math (V3-51) call `isBusinessDay`/`addBusinessDays` so a public holiday does **not** count against an SLA clock or appear as a bookable slot. Holiday names are i18n copy keys (`surface:calendar`), never literals.

### S6 — Daily forex refresh as a telemetered market service
The Open Exchange Rates client already exists; this pass adds the **daily refresh + telemetry** layer.
- Add a Supabase scheduled function (cron) that warms the rate cache once daily and persists a `fx_rate_snapshots` row per base→target pair the committed markets need. Migration `apps/hub/supabase/migrations/<ts>_fx_rate_snapshots.sql` — **committed; applied as a deliberate owner step**, not a CI side-effect.
- `fx_rate_snapshots`: `id`, `base_currency` (ISO 4217), `target_currency`, `rate NUMERIC`, `source` TEXT, `fetched_at TIMESTAMPTZ`, `is_stale BOOL`. RLS: read = `public.is_platform_staff()`; write = service-role only (the cron). Index `(base_currency, target_currency, fetched_at DESC)`.
- Display surfaces keep reading the live `getExchangeRateSnapshot` (with its identity-rate fallback) so a missed cron never breaks a render; the snapshot table is the audit/observability trail, not the read path.

### S7 — Telemetry
Three pure, exhaustively-mapped events under the `henry.<domain>.<noun>.<verb>` taxonomy, added to `@henryco/observability`:
- `henry.locale.country.resolved` — emitted when a `MarketProfile` is resolved for a request (carries country code + localized boolean, never PII).
- `henry.locale.currency.rounded` — emitted when display rounding is applied (carries currency + market).
- `henry.locale.holiday.respected` — emitted when SLA/booking math skips a market holiday.

## Out of scope
- New locale **strings** — the 12 locales are already covered by Pattern A typed copy + Pattern B runtime DeepL (V3-07 / V3-07b own string coverage). This pass adds *formatting/market* behaviour, not copy.
- Per-market **payment routing** — provider selection per market is **V3-85** (it consumes the `MarketProfile`/country defaults this pass matures).
- The tax **rate computation engine** itself — **V3-21** (this pass consumes it for display).
- Data-residency infrastructure and DSAR/consent-ledger mechanics — **V3-93** (compliance-privacy-data-rights).

## Dependencies
- **Requires:** V3-12 (Foundation Lock CERTIFIED), V3-21 (tax engine — for the tax-display rate source).
- **Owner gate:** D10 — confirm the committed market list; recommendation on record is **Nigeria-only V3 closure, international localization deferred to V4**. Confirm, do not re-litigate.
- **Blocks:** V3-85 (per-market payment routing reads `MarketProfile` + the matured country defaults); informs V3-88 (store listings localized per committed markets) and V3-87 (mobile reuses the profiles).

## Inheritance
- `packages/config/countries.ts` — `SUPPORTED_COUNTRIES`, `resolveCountry`, `formatCurrencyForCountry` (extended, not replaced).
- `@henryco/pricing` — `currency-model.ts` (`CurrencyLayerSnapshot`, `describeSettlementTruth`) + `exchange-rate.ts` (`getExchangeRateSnapshot`, `OPENRATE_APP_ID`).
- `@henryco/i18n` — `format-number.ts` / `format-date.ts` / `locales.ts`; Pattern A + Pattern B for new copy keys.
- `@henryco/observability` — telemetry taxonomy + audit log.
- `packages/address-selector/` + `apps/account/components/addresses/AddressManagerClient.tsx` — address capture surface refactored to the market layout.

## Implementation requirements
### Files
- `packages/config/market-profile.ts` (S1, S3, S4), `packages/config/holiday-calendar.ts` (S5), `packages/config/data/holidays/<ISO3166>.json` (S5).
- `@henryco/pricing` `src/currency-model.ts` — `applyDisplayRounding` + `buildCurrencySnapshot` rounding param (S2).
- `packages/config/countries.ts` — brand-comment sweep (`Henry & Co.` → `Henry Onyx`).
- `packages/address-selector/` + `apps/account/components/addresses/AddressManagerClient.tsx` — market-driven layout (S3).
- `apps/hub/supabase/migrations/<ts>_fx_rate_snapshots.sql` + the daily cron edge function (S6).
- `@henryco/observability` telemetry additions (S7).
- `docs/v3/global-localization-architecture.md` — the market-profile map + the D10 commitment record.

### Trust / safety / compliance
- Per-market privacy obligations are flagged here but implemented in V3-93 (NDPR for Nigeria, GDPR for EU, CCPA for US). This pass must not weaken any existing consent surface; it documents the per-market compliance posture for each committed market in the architecture doc.
- `fx_rate_snapshots` writes are service-role-only; reads gate on `public.is_platform_staff()`. The forex API key (`OPENRATE_APP_ID`) is server-only env, never client-bundled.
- Rounding is a one-way display operation — the unit test that proves `settlementAmount` is untouched is a **money invariant** and is mandatory.

### Mobile + desktop parity
The Expo super-app (`apps/super-app`) consumes the same `@henryco/config` `MarketProfile` + `@henryco/pricing` formatting through its platform layer. Address/phone/currency rendering on mobile reads the identical profiles — no parallel mobile formatting logic. V3-87 wires the consuming surfaces; this pass keeps the profile API mobile-safe (no Node-only imports in the client-reachable barrel).

### i18n
New copy keys live under `surface:address` (field labels), `surface:calendar` (holiday names), and reuse `surface:payments` (tax labels). All labels, status, and error strings are typed Pattern A copy keys in en-US with Pattern B runtime DeepL filling the other 11 locales — never hardcoded literals. ZERO hardcoded country codes (ISO 3166), currency codes (ISO 4217), or domains.

### Brand & design system
Any user-facing label resolves through `@henryco/i18n`; any URL through `@henryco/config` helpers (`henryWebRoot()` / `getAccountUrl()`), never a literal domain. The `Henry & Co.` comment in `countries.ts` is corrected to `Henry Onyx`; receipt/invoice legal entity stays **"Henry Onyx Limited"** sourced from `company.ts` `legalName`. Address/phone inputs are design-token-only (Fraunces + locked `--site-*`/`--accent`), light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed.

## Validation gates
1. Standard CI: typecheck, lint, test, build (required context `Lint, typecheck, test, build`).
2. **Market-profile suite** (≈40+ specs): `resolveMarketProfile` per committed market; `isMarketLocalized` true only for D10 markets; rounding policy per currency (NGN→100, XOF→whole, USD→1); the **money-invariant test** proving `applyDisplayRounding` never mutates `settlementAmount`/`originalAmount`.
3. **Address + phone smoke** per committed market: required-field validation, postal-code presence/absence (NG = null), E.164 round-trip.
4. **Holiday calendar smoke**: `isBusinessDay`/`addBusinessDays` skip a known market holiday + weekend across the market timezone.
5. **Forex refresh**: the daily cron writes an `fx_rate_snapshots` row; the display path still renders when the cron is skipped (fallback proven).
6. **RLS verification** against the committed migration: staff read `fx_rate_snapshots`; non-staff cannot; only service-role writes.
7. **i18n strict gate** green: no new hardcoded user-facing strings; new keys exist in en-US Pattern A.
8. **Real-browser** address surface: light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed.

## Deployment gate
All gates green; the only required check (`Lint, typecheck, test, build`) passing; branch `v3/84-global-localization-maturity` off `origin/main` → PR → squash-merge (no force-push). Owner confirms the D10 market commitment is reflected (no uncommitted market shipped as localized). The `fx_rate_snapshots` migration is applied as a deliberate owner step. **30-day soak per newly-localized market** before that market flips from `language_only`/`limited` to `active` — Nigeria, already `active`, needs no soak for its existing behaviour.

## Final report contract
`.codex-temp/v3-84-global-localization-maturity/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion) + the per-market `MarketProfile` table + the D10 commitment record.

## Self-verification
- [ ] D10 answer read; only committed markets built `active`, rest scaffolded `language_only`; `isMarketLocalized` gate enforced.
- [ ] `MarketProfile` model in `@henryco/config` derived from `SUPPORTED_COUNTRIES` (no country-list duplication).
- [ ] `applyDisplayRounding` rounds display only; money-invariant test proves `settlementAmount`/`originalAmount` untouched.
- [ ] Address layout + E.164 phone format per market; NG postal-code = null; address surface refactored to profile-driven layout.
- [ ] Tax display (inclusive/exclusive + label) consumes V3-21; payment behaviour unchanged.
- [ ] Holiday calendars wired into SLA (V3-43) + booking (V3-51) date math; holidays don't burn SLA clock.
- [ ] `fx_rate_snapshots` daily cron + telemetry; display path survives a skipped cron via fallback.
- [ ] Three `henry.locale.*` telemetry events, exhaustively mapped.
- [ ] ZERO hardcoded country/currency codes or domains; `Henry & Co.` comment in `countries.ts` corrected to `Henry Onyx`.
- [ ] Report written. Hand-off: V3-85 (per-market payment routing reads `MarketProfile`).
