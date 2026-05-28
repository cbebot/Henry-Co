# V3-84 — Global: Localization Maturity

**Pass ID:** V3-84 | **Phase:** I | **Pillar:** P12, P3
**Deps:** V3-12, V3-21 | **Effort:** XL | **Parallel:** YES | **Owner gate:** D10 | **Risk:** Compliance

## Role
V3 Global Localization engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P12: "Multi-country localization beyond V2 string coverage — currency rounding rules, address formats, phone formats, tax behavior, holiday calendars."

## Mandatory scope

1. **Per-country config bundles** in `packages/i18n/src/locales/<country>/`:
   - Currency formatting (decimals, separators, symbol position).
   - Currency rounding rules (e.g., Nigerian Naira rounds to 1 kobo, Japanese Yen has no fractional unit).
   - Address format template per ISO 3166 country.
   - Phone format + validation per E.164 + national format.
   - Tax behavior (tax-included vs tax-excluded display) per country.
   - Holiday calendar (per country + region; for SLA + delivery scheduling).
   - Currency conversion rates (refreshed daily from a forex API; cached).

2. **Per-market gates** (only ship per market when D10 commits):
   - Nigeria (in-scope per default).
   - Other markets gated.

3. **Tax integration** with V3-21 per country.

4. **Calendar integration** with V3-51 booking + V3-43 workflow (holidays don't double-count for SLA).

5. **Telemetry** — `henry.locale.country.detected`, `henry.locale.currency.formatted`, `henry.locale.holiday.respected`.

## Integration keys (per INTEGRATION-KEYS.md)

Consumed:
- `DEEPL_API_KEY`, `DEEPL_API_HOST` — runtime translation Pattern B.
- Forex API key (introduce new env var `FOREX_API_KEY` — recommend Open Exchange Rates or Fixer; add to INTEGRATION-KEYS.md in same PR).

NEW env var: `FOREX_API_KEY`, `FOREX_API_HOST` — added to INTEGRATION-KEYS.md.

ZERO hardcoded country codes (use ISO 3166), currency codes (ISO 4217), or domains.

## Out of scope
- New locale strings (existing 12 covered by Pattern A + B).
- Per-market payment routing (V3-85).

## Dependencies
V3-12, V3-21. Blocks V3-85.

## Inheritance
@henryco/i18n; @henryco/pricing currency formatting.

## Trust / safety / compliance
- L16 data residency per market.
- L17 consent banner per market.
- Per-country privacy compliance (NDPR for Nigeria, GDPR for EU, etc.).

## Mobile + desktop parity
All locale features mirror on Expo.

## i18n
This pass IS i18n.

## Validation gates
1. Standard CI.
2. **Per-country format smoke** for each D10-committed market.
3. **Holiday calendar** smoke.
4. **Forex** refresh + display.

## Deployment gate
- 30-day soak per market.

## Final report contract
Standard.

## Self-verification
- [ ] Per-country bundles for D10 markets.
- [ ] Address + phone formats.
- [ ] Tax integration.
- [ ] Holiday calendar.
- [ ] Forex.
- [ ] 3 new telemetry events.
- [ ] ZERO hardcoded country/currency.
- [ ] Report written.
