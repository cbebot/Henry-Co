# V3-38 — Personalization: Local Availability Awareness

**Pass ID:** V3-38  ·  **Phase:** E (Personalization & Predictive)  ·  **Pillar:** P3 (Personalization), P1 (Product)
**Dependencies:** V3-34 (personalization-home)  ·  **Effort:** M  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role
You are the V3 local-availability engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass makes every service, listing, and route catalog answer one honest question per user — "is this actually available where you are?" — and shows a graceful, non-dead-end state when it is not. The line you must not cross: never reveal a provider's home address or precise coordinates to a buyer, and never let the badge claim availability the resolver cannot back with a real deliverable provider/area record.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/38-personalization-local-availability` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The canonical address spine already exists. `packages/address-selector` (V2-ADDR-01) backs `public.user_addresses` (migration `apps/hub/supabase/migrations/20260502160000_user_addresses_canonical.sql`) with `country`, `state`, `city`, `coordinates_lat`, `coordinates_lng`, `google_place_id`, `formatted_address`, `is_default`, and `kyc_verified`. `UserAddressRecord` in `packages/address-selector/types.ts` is the wire shape; `AddressSelector` and `AddressPick` are already consumed at marketplace checkout, care pickup, and logistics. V3-34 gives every signed-in user a persistent personalization context and a per-user home layout.

What does NOT exist yet: any notion of *where a service can be delivered*. Service cards across care/marketplace/property/logistics render identically regardless of the viewer's location. There is no per-area availability resolver, no "available in your area" signal, and no graceful "not here yet — here's what is" path. This pass closes that gap with a server-side resolver and a small set of reusable surfaces. It deliberately stops short of provider matching (V3-51) and the full verified-provider service-area model (V3-50), which extend the same `service_area_coverage` table this pass creates.

## Mandatory scope

### S1 — Service-area coverage schema (`apps/hub/supabase/migrations/`)
New migration `apps/hub/supabase/migrations/<ts>_service_area_coverage.sql`. Two tables.

`public.service_area_coverage` is the source of truth — which division offerings reach which geographic areas:
```sql
create table public.service_area_coverage (
  id uuid primary key default gen_random_uuid(),
  division text not null,                         -- 'care' | 'marketplace' | 'property' | 'logistics'
  offering_key text not null,                     -- service slug, category, or route id (division-defined)
  country text not null,                          -- ISO-3166-1 alpha-2, uppercase
  region text,                                    -- state/province; null = whole country
  city text,                                      -- null = whole region
  provider_count integer not null default 0 check (provider_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (division, offering_key, country, region, city)
);
create index service_area_coverage_lookup
  on public.service_area_coverage (division, country, region, city) where is_active;
```
`public.service_availability_cache` is a read-optimized resolver cache (recomputable, never authoritative):
```sql
create table public.service_availability_cache (
  division text not null,
  offering_key text not null,
  country text not null,
  region text not null default '',                -- '' sentinel, never null, so PK is total
  city text not null default '',
  available boolean not null,
  provider_count integer not null default 0,
  computed_at timestamptz not null default now(),
  primary key (division, offering_key, country, region, city)
);
```
RLS: `service_area_coverage` and `service_availability_cache` are readable by `anon` and `authenticated` (availability is public, location-keyed, never user-keyed — no PII). Writes restricted to `service_role` / staff (`is_staff()`). Provide the explicit `create policy` statements for select (public) and all-writes (staff/service-role) in the migration. Add `enable row level security` on both.

### S2 — Availability resolver (`packages/intelligence/src/availability.ts`)
New module, exported from `packages/intelligence/src/index.ts`. Pure-typed, server-callable, deterministic.
```ts
export interface ResolveLocation {
  country: string;            // ISO-3166-1 alpha-2
  region?: string | null;     // state/province
  city?: string | null;
  source: "primary_address" | "selected_address" | "ip_fallback";
}
export interface AvailabilityResult {
  available: boolean;
  providerCount: number;
  matchedScope: "city" | "region" | "country" | "none";
  location: ResolveLocation;
}
export async function resolveAvailability(
  client: SupabaseClient,
  args: { division: HenryDivision; offeringKey: string; location: ResolveLocation }
): Promise<AvailabilityResult>;
```
Resolution rules, most-specific-first: exact `city` row → `region` row (city null) → `country` row (region null) → `none`. A match requires `is_active` and `provider_count > 0`. The resolver reads `service_availability_cache` first; on cache miss it derives from `service_area_coverage`, writes the cache row, and returns. Location is derived server-side: signed-in user → default `user_addresses` row (`is_default`), else most-recent; signed-out or address-less → coarse IP geo (country/region only, never city-precise) via the existing edge geo header — never client-supplied location trusted for gating. The resolver runs ONLY on the server (ANTI-CLONE Principle 1: never ship the coverage table or resolution logic to the client).

### S3 — Resolver route + batch endpoint (`apps/*/app/api/availability/route.ts`)
A shared server handler (factory in `packages/intelligence` consumed per app) exposing `POST /api/availability` that accepts `{ division, offeringKeys: string[] }` and returns `Record<offeringKey, AvailabilityResult>` for the resolved viewer location, so a catalog page resolves a full grid in one round-trip. Rate-limit per the standard middleware. Emit `henry.availability.resolved` once per batch with `{ division, count, available_count }` in properties. No write side-effects beyond cache population.

### S4 — Availability surfaces (`packages/ui` + per-division cards)
Three reusable, token-only components added to `packages/ui/src` and wired into the existing card components (do NOT fork card structure — add a slot/prop):
- `<AvailabilityBadge result={...} />` — "Available in your area" (positive), "Limited availability" (`provider_count` low), or hidden when `matchedScope === "none"`.
- `<UnavailableState />` — graceful "Not available here yet" block, never a dead end: shows the resolved area name and a primary CTA.
- `<FindSimilarCta />` — "Find similar, available near you" linking to the division's filtered catalog scoped to the viewer's area.
All copy via `@henryco/i18n`. All color/spacing via design tokens (`--site-*` / `--accent`), Fraunces for any display text, light+dark, mobile+desktop, CLS ≈ 0.

### S5 — Per-division application (care · marketplace · property · logistics)
Apply the same resolver + surfaces in each division's catalog/listing surface:
- **Care** (`apps/care`): service cards show the badge; an unavailable service shows `<UnavailableState>` + `<FindSimilarCta>`.
- **Marketplace** (`apps/marketplace`): a "ships to your area" filter (default ON for signed-in users with a default address) using `division='marketplace'`, `offering_key` = shipping zone/category.
- **Property** (`apps/property`): neighborhood-aware result ordering — in-area listings surface first; out-of-area still visible but de-emphasized (never hidden — property is browse-anywhere).
- **Logistics** (`apps/logistics`): pickup-availability badge for the viewer's area on the booking entry surface.
Each division keeps its own card structure; only the badge/state slots are added.

### S6 — Telemetry
Register and emit, via `packages/intelligence` analytics (`HenryEventEnvelope`, validated by `henryEventNameSchema`): `henry.availability.resolved` (S3), `henry.availability.unavailable_shown` (fired when `<UnavailableState>` renders), `henry.availability.find_similar_clicked` (CTA). Add the three constants to the `HenryEventNames` registry in `packages/intelligence/src/index.ts`.

## Out of scope
- Geocoding / address autocomplete — owned by V2-ADDR-01 (`packages/address-selector`, Google Places). Reuse, don't reimplement.
- Provider→booking matching and slot availability — **V3-51** (smart booking).
- The verified-provider service-area authoring UI and per-provider coverage rows at scale — **V3-50** (verified-provider model) extends `service_area_coverage`.
- Geo-search ranking across all divisions and per-city landing pages — **V3-63** (local discovery).

## Dependencies
Depends on **V3-34** (personalization context + per-user home). This pass BLOCKS the geo dimension of **V3-50** (verified providers populate `service_area_coverage`), **V3-51** (smart booking consumes resolved availability), and **V3-63** (local discovery builds on the resolver).

## Inheritance
- `packages/address-selector` — `UserAddressRecord`, `AddressPick`, default-address resolution, `user_addresses` schema.
- `packages/intelligence` — analytics envelope (`HenryEventEnvelope`, `henryEventNameSchema`, `HenryEventNames`), `HenryDivision`.
- `packages/ui` — card primitives + tokens for the badge/state components.
- `@henryco/config` — `henryDomain()` / `henryWebRoot()` for any cross-division CTA href.

## Implementation requirements
### Files
- `apps/hub/supabase/migrations/<ts>_service_area_coverage.sql` (new)
- `packages/intelligence/src/availability.ts` (new) + export from `packages/intelligence/src/index.ts`
- `packages/intelligence/src/__tests__/availability.test.ts` (new)
- `packages/ui/src/availability-badge.tsx`, `unavailable-state.tsx`, `find-similar-cta.tsx` (new) + barrel export
- `apps/{care,marketplace,property,logistics}/app/api/availability/route.ts` (new, thin wrappers over the shared factory)
- Card-component edits in each of the four division apps (slot wiring only)
- i18n copy keys under `surface:availability`

### Trust / safety / compliance
- Resolver is server-only; the coverage table never reaches the client bundle (ANTI-CLONE Principle 1).
- No provider home address or precise coordinates exposed — availability is keyed to country/region/city, never to a provider's `coordinates_lat/lng`.
- IP geo is coarse (country/region) and advisory; it never gates a paid action — only signals a badge. Authoritative gating uses the user's saved address.
- Cache is recomputable and carries no PII; staleness is acceptable (badge, not money). Coverage writes are staff/service-role only and audit-logged via `@henryco/observability/audit-log`.

### Mobile + desktop parity
Badge and states are responsive and render identically on web mobile and desktop. Expo super-app: the badge component is web; the super-app consumes the same `/api/availability` batch endpoint when those catalog screens land (V3-87) — note the contract, do not build the native screens here.

### i18n
Namespace `surface:availability`. Every string — "Available in your area", "Limited availability", "Not available here yet", "Find similar, available near you", the resolved area-name interpolation — flows through `@henryco/i18n` Pattern A typed keys. No hardcoded user-facing text; no hardcoded area names (interpolate the resolved values). 12 locales.

### Brand & design system
Any user-facing brand string ("Henry Onyx Care", division labels) reads from `@henryco/config` (`COMPANY.divisions[...]`), never hardcoded. Zero `henrycogroup.com` literals — all hrefs via `henryDomain(division)` / `henryWebRoot()`. Tokens only (`--site-*` / `--accent`), Fraunces for display, light + dark + mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed.

## Validation gates
1. **Standard CI** — `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` green across all touched apps/packages.
2. **Resolver unit suite** (~12 cases) — most-specific-first matching (city→region→country→none); `provider_count = 0` and `is_active = false` both resolve to `none`; cache hit returns without recompute; cache miss populates the cache.
3. **RLS verification** — `anon` and `authenticated` can `select` both tables; neither can `insert/update/delete`; staff/service-role can write. Prove with SQL run against the project.
4. **Availability resolution e2e** — a fixture user with a Lagos default address sees Lagos-deliverable care services badged available and a non-covered service rendered with `<UnavailableState>` + working `<FindSimilarCta>`.
5. **Graceful-unavailable UI** — `<UnavailableState>` is never a dead end (always a working CTA); copy is i18n-sourced.
6. **Real-browser UI** — badge + states render correctly light + dark, mobile + desktop, CLS ≈ 0, contrast green.

## Deployment gate
All validation gates green; PR squash-merged to `main` via CI (no branch-protection bypass). 14-day soak monitoring `henry.availability.resolved` volume vs. `unavailable_shown` rate to confirm coverage rows are seeded sanely (a flood of `unavailable_shown` means missing coverage data, not a broken resolver).

## Final report contract
`.codex-temp/v3-38-personalization-local-availability/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion).

## Self-verification
- [ ] `service_area_coverage` + `service_availability_cache` migrated with RLS (public read, staff/service-role write).
- [ ] `resolveAvailability` server-only, most-specific-first, cache-backed; unit suite green.
- [ ] `POST /api/availability` batch endpoint returns per-offering results for the resolved viewer location.
- [ ] `<AvailabilityBadge>`, `<UnavailableState>`, `<FindSimilarCta>` token-only, i18n-sourced, light+dark, CLS ≈ 0.
- [ ] Applied to care, marketplace, property, logistics without forking card structure.
- [ ] Three telemetry events registered in `HenryEventNames` and emitted.
- [ ] No provider address/coordinate exposure; resolver and coverage table server-only.
- [ ] Zero hardcoded domains/strings; brand via `@henryco/config`.
- [ ] Report written.
