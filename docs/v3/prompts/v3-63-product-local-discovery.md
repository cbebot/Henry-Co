# V3-63 — Product Expansion: Local Discovery

**Pass ID:** V3-63  ·  **Phase:** G (Product Expansion)  ·  **Pillar:** P1 (Service Breadth), P3 (Personalization Engine)
**Dependencies:** V3-49 (Services Catalog Expansion), V3-50 (Verified Provider Model), V3-38 (Local Availability)  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 local-discovery engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass makes the platform answer "what can I get *here*, near me?" across every division: geo-aware search over services, products, and properties; pre-rendered per-city landing surfaces that are real SEO destinations; a "near you" relevance toggle; a provider map; and a local-trending strip. The line you must not cross: never expose a provider's home address or precise coordinates to a buyer (availability and discovery are keyed to country/region/city, never to a provider's `coordinates_lat/lng`), never trust client-supplied location to gate a paid action, and never ship the ranking or coverage logic to the client. Local data is the moat (ANTI-CLONE Principle 10) — it is computed server-side and surfaced as results, never as the model behind them.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/63-product-local-discovery` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The location spine and the search spine both already exist; what's missing is the *geo-discovery product* on top of them.

- **Location truth (V2-ADDR-01 + V3-38):** `packages/address-selector` backs `public.user_addresses` (`country`, `state`, `city`, `coordinates_lat`, `coordinates_lng`, `google_place_id`, `formatted_address`, `is_default`, `kyc_verified`); `UserAddressRecord` is the wire shape. V3-38 added `public.service_area_coverage` (`division`, `offering_key`, `country`, `region`, `city`, `provider_count`, `is_active`, unique on the geo tuple) + `public.service_availability_cache` and the server-only `resolveAvailability(client, { division, offeringKey, location })` resolver in `packages/intelligence/src/availability.ts` (most-specific-first: city → region → country → none), plus `POST /api/availability` batch and the `<AvailabilityBadge>` / `<UnavailableState>` / `<FindSimilarCta>` surfaces. Location is derived server-side from the user's default address, falling back to coarse IP geo — never client-supplied for gating.
- **Search (`@henryco/search-core`):** Typesense-backed cross-division index. `SearchDocument` (`id`, `type`, `division`, `title`, `summary`, `deep_link` resolved via `@henryco/config`, `role_visibility[]`, `trust_state`, `ranking_signals`, `tags`, `owner_user_id?`) + the catalog layer merge in `searchAcrossDivisions()`, ranking in `ranking.ts`, the diversity cap, and the `CrossDivisionSearchExperience` UI. There is **no geo dimension** in the index today: no lat/lng fields, no distance filter, no geo sort.
- **SEO (`@henryco/seo`):** `buildLocalBusinessLd` (LocalBusiness JSON-LD with `address` + optional `geo`), `createMasterSitemapIndex` / `renderSitemapIndexXml` (sitemap-index aggregator), `JsonLd` component, hreflang alternates. The base domain resolves via `COMPANY.group.baseDomain` through `@henryco/config` helpers (`henryWebRoot()`, `henryDomain()`).
- **Catalog + providers (V3-49 / V3-50):** V3-49 expands the services taxonomy (per-service surfaces + slugs); V3-50 ships `public.partners` with verified provider profiles, service areas, and scoring that populate `service_area_coverage` at scale.
- **The gap this pass closes:** there is no per-city destination page, no "near you" toggle on search, no distance filter, no provider map, and no local-trending surface. Search is location-blind; SEO has no city long-tail; a user in Ibadan and a user in Abuja see the same catalog ordering. V3-63 adds the geo dimension to the index, ships pre-rendered city landings backed by real coverage data, and wires the "near you" relevance path end-to-end.

## Mandatory scope

### S1 — Geo dimension on the search index (`@henryco/search-core`)

Extend `SearchDocument` and the Typesense collection schema with geo fields so location becomes a first-class ranking + filter input:

```ts
// packages/search-core/src/types.ts — additive fields on SearchDocument
geo?: { lat: number; lng: number };   // entity centroid (city-level for providers — NEVER home address)
geo_country?: string;                  // ISO-3166-1 alpha-2
geo_region?: string;                   // state/province
geo_city?: string;                     // city
```

In `collections.ts` add the matching Typesense `geopoint` field + the `geo_*` string facets. In `ranking.ts` add a **proximity boost** (closer-to-viewer ranks higher) and an optional **radius filter** (`5km / 10km / 25km / 50km`). `SearchInput` gains `near?: { lat: number; lng: number; radiusKm?: 5|10|25|50 }`. The viewer's coordinates are resolved server-side from `user_addresses` (default) or coarse IP geo — never passed from the client untrusted for gating; the client passes only a "near me" intent flag and an optional explicit selected-area, and the server resolves the actual coordinates. Provider geo is **city-centroid only** (joined from `service_area_coverage` / `partners` service-area, never a partner's precise `coordinates_lat/lng`). Unit-test the proximity boost + radius filter + the "no geo → fall back to non-geo ranking unchanged" path.

### S2 — Per-city landing pages (pre-rendered, SEO-real)

Per-city destinations on the hub at `henryWebRoot('/places/<city-slug>')` (never a hardcoded domain) — `apps/hub/app/places/[city]/page.tsx`:

- A `public.discovery_cities` registry migration (`apps/hub/supabase/migrations/<ts>_v3_63_discovery_cities.sql`): `slug` (unique), `name`, `country`, `region`, `centroid_lat`, `centroid_lng`, `is_active`, `sort_order`. RLS: public read (`anon` + `authenticated`), staff/service-role write (`is_platform_staff()`). Seed the launch cities from real `service_area_coverage` rows — a city page only goes live when it has backing coverage (no empty "ghost city" pages that harm SEO).
- Each page server-renders the city's featured **providers** (V3-50, city-scoped, verified only), **services** (V3-49 offerings with `provider_count > 0` via `resolveAvailability`), **products** (marketplace listings shipping to the city), and **properties** (listings in the city). All sections read live data via the existing division data layers — no fabricated content.
- `generateStaticParams` over active `discovery_cities`; `revalidate` (ISR) so pages stay fresh without per-request cost. Emit `henry.local.city_landing.viewed` server-side per render with `{ city_slug, country, region }`.
- SEO: `buildLocalBusinessLd` + a city-scoped `LocalBusiness`/`Service` JSON-LD via `@henryco/seo`; a `/places/sitemap.xml` contributed to `createMasterSitemapIndex`; hreflang alternates for the city pages; canonical URLs through `henryWebRoot()`.

### S3 — "Near you" geo-search

Wire the S1 geo dimension into the live search experience:

- A **"Near you" toggle** on every cross-division search surface (the `CrossDivisionSearchExperience`). When on, the client sends the intent flag (and optionally a selected area); the server resolves the viewer's coordinates (default address → IP fallback) and passes `near` to `searchAcrossDivisions()`. When the viewer has no resolvable location, the toggle shows a non-dead-end "Set your area" affordance deep-linked through the `address-selector` (never a silent no-op).
- A **distance filter** (`5km / 10km / 25km / 50km`) shown only when "Near you" is on and a location resolved.
- Emit `henry.local.near_you.filtered` with `{ radius_km, divisions, result_count }` when the filter changes — once per applied filter, not per keystroke.

### S4 — Provider map view

A visual map of nearby providers per service category:

- `apps/hub/app/places/[city]/map/page.tsx` (and a map panel reusable on division catalogs) rendering provider **city-centroid** pins per category, using the established map provider (reuse `apps/logistics/lib/logistics/map-provider.ts`'s configured provider + the `TrackingMapPanel.tsx` pattern — do not introduce a second map vendor). Pins are city-centroid only; clicking a pin shows the provider's public profile card (name, rating, verified badge, service areas) — **never** a home address or precise coordinates.
- The map is server-data-driven: provider pins come from V3-50 `partners` + `service_area_coverage`, filtered to verified, active providers in the city. Mobile-first responsive; degrades to the list view if the map fails to load (never a blank panel).

### S5 — Local trending

"Top services in your city this week":

- A scheduled aggregation (`@henryco/observability` cron, idempotent) computes the top offerings per active city over a rolling 7-day window from booking/order/inquiry signals already emitted to `@henryco/intelligence` — writing a recomputable `public.local_trending` cache table (`city_slug`, `division`, `offering_key`, `rank`, `signal_count`, `window_start`, `computed_at`; staff/service-role write, public read; no PII, city-aggregate only). A city with too few signals shows "Popular across <region>" rather than a misleadingly precise local list (honest empty/low-data state).
- A `<LocalTrendingStrip city={...} />` on the city landing + the personalized home (V3-34 slot, when the viewer has a resolvable city). Emit `henry.local.trending.viewed` with `{ city_slug, item_count }`.

### S6 — Telemetry + observability

Register in the `HenryEventNames` registry and emit via `@henryco/intelligence` (validated by `henryEventNameSchema`):
- `henry.local.city_landing.viewed` (S2)
- `henry.local.near_you.filtered` (S3)
- `henry.local.trending.viewed` (S5)

Owner observability: city-landing view volume per city, "near you" adoption rate, distance-filter distribution, and a coverage-gap signal (cities with discovery traffic but thin `service_area_coverage` — the seed-more-coverage signal).

## Out of scope

- Address management, geocoding, and autocomplete — **V2-ADDR-01** (`packages/address-selector`, Google Places). Reuse, never reimplement.
- The availability resolver, `service_area_coverage` schema, and the badge/unavailable surfaces — **V3-38** owns them; this pass consumes them.
- The services taxonomy + per-service surfaces — **V3-49**. The verified-provider model, profiles, and service-area authoring — **V3-50**. This pass reads both.
- Per-market localization rules (currency rounding, address/phone formats, holiday calendars, tax behavior) — **V3-84**.
- Provider→slot booking and matching — **V3-51** (smart booking).

## Dependencies

Depends on **V3-49** (offerings to surface), **V3-50** (verified providers + service areas populating coverage at scale), and **V3-38** (the availability resolver + `service_area_coverage`). **Blocks** nothing downstream directly, but its geo-indexed search feeds **V3-52** ranking refinements and its city pages feed **V3-60** (roadmap) and **V3-96** (launch showcase) SEO surfaces.

## Inheritance

- **V3-38:** `resolveAvailability`, `service_area_coverage`, `service_availability_cache`, `POST /api/availability`, the availability surfaces.
- `packages/address-selector` — `UserAddressRecord`, default-address resolution, `user_addresses` (`coordinates_lat/lng`, `city`, `region`, `country`).
- `@henryco/search-core` — `SearchDocument`, `collections.ts`, `ranking.ts`, `searchAcrossDivisions()`, `CrossDivisionSearchExperience`.
- `@henryco/seo` — `buildLocalBusinessLd`, `createMasterSitemapIndex` / `renderSitemapIndexXml`, `JsonLd`, hreflang alternates.
- `@henryco/intelligence` — analytics envelope (`henryEventNameSchema`, `HenryEventNames`), `HenryDivision`.
- The logistics map stack — `apps/logistics/lib/logistics/map-provider.ts` + `TrackingMapPanel.tsx` (single map vendor reuse).
- `@henryco/ui` — `PublicSiteShell` / `PublicSiteFooter` + tokens for the city landings.
- `@henryco/config` — `henryWebRoot()` / `henryDomain()` / division names + `COMPANY.group.baseDomain`.

## Implementation requirements

### Files

- `packages/search-core/src/types.ts`, `collections.ts`, `ranking.ts`, `query.ts` (geo fields + proximity boost + radius filter — S1) + `__tests__/geo-ranking.test.ts` (new)
- `apps/hub/supabase/migrations/<ts>_v3_63_discovery_cities.sql` (new — `discovery_cities` + `local_trending`)
- `apps/hub/app/places/[city]/page.tsx`, `apps/hub/app/places/[city]/map/page.tsx`, `apps/hub/app/places/sitemap.xml` (new — S2/S4)
- "Near you" toggle + distance filter in the cross-division search experience (S3)
- A reusable provider-map panel + `<LocalTrendingStrip>` component (S4/S5)
- Local-trending aggregation cron handler (S5)
- i18n copy under `surface:local` (and dynamic city/offering names via `translateSurfaceLabel`)

### Trust / safety / compliance

Provider geo is **city-centroid only** — a provider's `coordinates_lat/lng` (their home/precise location) is never indexed, never mapped, never returned to a buyer (extends the V3-38 invariant). Viewer location is resolved server-side from the saved address or coarse IP geo; client-supplied location is advisory for the "near me" intent only and never gates a paid action. The geo index, ranking, coverage, and trending logic are server-only (ANTI-CLONE Principles 1 + 10 — local data is the moat, never shipped to the client). `discovery_cities` and `local_trending` carry no PII (city-aggregate only); writes are staff/service-role and audit-logged via `@henryco/observability/audit-log`. Only verified, active providers (V3-50 `trust_state = 'verified'`+) appear on maps and city pages — no unverified provider is geo-surfaced.

### Mobile + desktop parity

City landings, "near you" search, the distance filter, and especially the **map view are mobile-first** and responsive — light + dark, mobile + desktop, CLS ≈ 0 (reserve map container height to avoid layout shift). They read the same data on web mobile and (forward) the Expo super-app via the search API + `/api/availability`; note the mobile contract for V3-87, build no native map screen here. The map degrades to a list view on failure on every viewport.

### i18n

Namespace `surface:local`: the "Near you" toggle, distance-filter labels, city-landing section headings ("Providers near you", "Available services", "Properties in <city>"), the "Set your area" affordance, the local-trending heading, and all empty/low-data/error states flow through `@henryco/i18n` Pattern A typed keys. **City names and offering names are dynamic** — interpolate the resolved values and render through `translateSurfaceLabel` / `resolveLocalizedDynamicField` so a user sees them in their locale when a translation exists; never hardcode a city name in copy. 12 locales.

### Brand & design system

Division labels and brand strings ("Henry Onyx Marketplace", "Henry Onyx Property", etc.) read from `@henryco/config` (`COMPANY.divisions[...]`) — never hardcoded, never "Henry & Co.". City landings render inside `PublicSiteShell` with Fraunces display + locked `--site-*` / `--accent` tokens, per-division accent from `company.ts`. Every URL — city-page canonical, sitemap entries, deep links, map pin profile links — resolves through `henryWebRoot()` / `henryDomain(division)` / `getAccountUrl()`; zero `henrycogroup.com` literals (the JSON-LD `url` derives from `COMPANY.group.baseDomain`, not a string literal). Light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed.

## Validation gates

1. **Standard CI** — `pnpm typecheck && pnpm lint && pnpm test && pnpm build` green across all touched apps/packages (the only required branch-protection context: `Lint, typecheck, test, build`).
2. **Geo-ranking unit suite** (~12 cases) — proximity boost ranks nearer entities higher; the `5/10/25/50 km` radius filter excludes beyond-radius hits; "no geo on document → non-geo ranking unchanged"; viewer with no resolvable location → no geo applied (no crash, no empty page).
3. **City landing renders** for the 10 seeded launch cities — each shows real providers/services/products/properties from live data; a city with no coverage is **not** published (no ghost page).
4. **"Near you" filter works** — toggling on resolves viewer coordinates server-side and re-ranks by proximity; a location-less viewer gets the "Set your area" affordance, not a dead end.
5. **Map view functional** — renders verified-provider city-centroid pins per category, never a home address; degrades to a list on load failure; mobile-first.
6. **Local trending** — the cron computes top offerings per city from real signals; a low-signal city shows the honest "Popular across <region>" fallback.
7. **SEO** — city pages emit valid `LocalBusiness` JSON-LD (validates against schema.org), are in `/places/sitemap.xml` (contributed to the master index), carry hreflang alternates, and have canonical URLs through `henryWebRoot()`. Confirm at least one city page is indexable (robots allow, no `noindex`).
8. **RLS verification** — `discovery_cities` + `local_trending` are public-read, staff/service-role-write; no PII columns. Prove with SQL against the project.
9. **Real-browser UI** — city landing, "near you" search, distance filter, and map render correctly light + dark, mobile + desktop, CLS ≈ 0, contrast green.

## Deployment gate

All validation gates green; PR `v3/63-product-local-discovery` off `origin/main` → squash-merge via CI (no branch-protection bypass, no force-push). Owner reviews the seeded city list, the map's centroid-only privacy posture, and the "near you" UX before stable declaration. Ship behind a kill switch (city pages + "near you" toggle instantly hideable). **14-day soak** with **SEO indexing verified** (city pages appearing in Search Console / indexed), monitoring `henry.local.city_landing.viewed` volume and the coverage-gap signal before declaring stable.

## Final report contract

`.codex-temp/v3-63-product-local-discovery/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion).

## Self-verification

- [ ] S1: `SearchDocument` geo fields + Typesense `geopoint`/`geo_*` facets; proximity boost + `5/10/25/50 km` radius filter in `ranking.ts`; geo resolved server-side; unit suite green.
- [ ] S2: `discovery_cities` (+ `local_trending`) migration with public-read / staff-write RLS; `/places/<city-slug>` pre-rendered (ISR) from live providers/services/products/properties; no ghost cities; LocalBusiness JSON-LD + sitemap + hreflang + canonical via `@henryco/seo` and `henryWebRoot()`.
- [ ] S3: "Near you" toggle + distance filter wired into `searchAcrossDivisions()`; viewer coords resolved server-side; location-less viewer gets "Set your area", not a dead end.
- [ ] S4: provider map of verified, city-centroid pins per category (single map vendor reused); pin → public profile, never a home address; degrades to list on failure; mobile-first.
- [ ] S5: local-trending cron + cache table + `<LocalTrendingStrip>`; honest low-signal "Popular across <region>" fallback.
- [ ] S6: three telemetry events registered + validating; owner coverage-gap signal live.
- [ ] No provider home-address/precise-coordinate exposure; geo ranking + coverage + trending server-only (Principles 1 + 10).
- [ ] All copy via `surface:local`; dynamic city/offering names interpolated + machine-translated; brand via `@henryco/config` (Henry Onyx, never "Henry & Co."); zero hardcoded domains/strings; light + dark, mobile + desktop, CLS ≈ 0.
- [ ] Kill switch wired; SEO indexing verified in soak; report written.
