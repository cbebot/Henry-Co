# V3-63 — Product: Local Discovery

**Pass ID:** V3-63 | **Phase:** G | **Pillar:** P1, P3
**Deps:** V3-49, V3-50, V3-38 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Local Discovery engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision: "Local discovery + verified providers + smart booking + geo-search across services/products/properties + per-city landing surfaces + 'near you' relevance."

## Mandatory scope

1. **Per-city landing pages** at `henrycogroup.com/places/<city-slug>`:
   - Featured providers + services + products + properties in that city.
   - Pre-rendered for SEO.

2. **Geo-search**:
   - User location-aware search; "near you" toggle on every search.
   - Distance filter (5km / 10km / 25km / 50km).

3. **Provider map view**: visual map of nearby providers per service category.

4. **Local trending**: top services in your city this week.

5. **Telemetry** — `henry.local.city_landing.viewed`, `henry.local.near_you.filtered`, `henry.local.trending.viewed`.

## Out of scope
- Address management (V2-ADDR-01 + V3-04).
- Per-market localization rules (V3-84).

## Dependencies
V3-49, V3-50, V3-38.

## Inheritance
@henryco/search-core; @henryco/seo (per-city sitemaps).

## Trust / safety / compliance
- Don't expose provider home addresses.
- ANTI-CLONE Principle 10 (local-data moat).

## Mobile + desktop parity
Map view responsive (mobile-first).

## i18n
City names + landing copy per locale.

## Validation gates
1. Standard CI.
2. **City landing renders** for 10 named cities.
3. **Near-you filter** works.
4. **Map view** functional.
5. **SEO** — city pages indexed.

## Deployment gate
- 14-day soak; SEO indexing verified.

## Final report contract
Standard.

## Self-verification
- [ ] City landings.
- [ ] Geo-search.
- [ ] Map view.
- [ ] Trending.
- [ ] SEO indexed.
- [ ] 3 new telemetry events.
- [ ] Report written.
