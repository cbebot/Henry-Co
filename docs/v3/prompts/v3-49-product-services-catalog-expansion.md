# V3-49 — Product Expansion: Services Catalog Expansion

**Pass ID:** V3-49  ·  **Phase:** G (Product Expansion)  ·  **Pillar:** P1 (Product Expansion)
**Dependencies:** V3-12 (Foundation Lock acceptance — CERTIFIED, PR #168)  ·  **Effort:** XL  ·  **Parallel-safe:** N (heads the V3-49 → V3-50 → V3-51 product chain)
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 Services Catalog engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass broadens Henry Onyx Fabric Care from a single-vertical laundry/cleaning booker into a **multi-vertical services platform** — laundry, garment care, home cleaning, office cleaning, repairs, errands, moving, event support, business support, deep cleaning, and provider-assisted services — by promoting Care's existing per-app catalog tables into a first-class service taxonomy, giving every service its own detail surface, cross-listing the catalog at the hub, and indexing it in the shared search rail. The line it must not cross: this pass ships the **catalog and its surfaces only** — it does not build the verified-provider model (V3-50), the booking/slot engine (V3-51), or provider onboarding (V3-67). It must extend Care's real data layer, never fork a parallel schema beside it.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/49-product-services-catalog-expansion` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

Care today is **not** an empty greenfield: `apps/care/lib/care-data.ts` already reads a real catalog out of Supabase — `care_service_categories`, `care_service_types`, `care_service_packages`, `care_service_zones`, `care_service_addons` — via `getCareBookingCatalog()` / `getCarePricing()`, and renders it on `apps/care/app/(public)/services/page.tsx`, `/pricing`, and `/book` (with `BookPickupForm`, `RecurringScheduler`, `CareFlow`). Copy flows through `@henryco/i18n/server` (`getCareServicesCopy`, `resolveLocalizedDynamicField` for Supabase-sourced names). The division accent comes from `apps/care/lib/care-theme.ts` (`CARE_ACCENT`), the public chrome from `apps/care/components/public/CarePublicShell.tsx`. Search is the shared `@henryco/search-core` rail (Typesense collections like `hc_marketplace_products`; ranking in `packages/search-core/src/ranking.ts`); pricing math is `@henryco/pricing`. The gap: this taxonomy is **Care-laundry-shaped** — it cannot express repairs, moving, errands, event/business support, or provider-supplied services, it is invisible at the hub, and it is not in the search index. This pass generalises the taxonomy into a vertical-agnostic services catalog **without breaking the existing Care booking path**, which keeps working unchanged on top of the generalised tables.

## Mandatory scope

### S1 — Generalise the service taxonomy (extend, never fork)

Migration `apps/care/supabase/migrations/<ts>_services_catalog_expansion.sql`. **Promote, do not duplicate**: introduce a vertical dimension and a unified service surface that the existing Care tables map into, so the live Care booking path is untouched.

```sql
-- A vertical groups categories into a product line. The 11 V3 verticals seed here.
create table if not exists public.service_verticals (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,          -- 'garment-care','home-cleaning','repairs','moving',…
  name          text not null,                 -- localized at render via resolveLocalizedDynamicField
  summary       text,
  icon          text,                          -- lucide icon name, never a hardcoded URL
  division      text not null default 'care',  -- which division app owns the surface
  display_order integer not null default 0,
  status        text not null default 'active' check (status in ('active','draft','retired')),
  created_at    timestamptz not null default timezone('utc', now()),
  updated_at    timestamptz not null default timezone('utc', now())
);

-- Bridge: existing care_service_categories now belong to a vertical (nullable backfill).
alter table public.care_service_categories
  add column if not exists vertical_id uuid references public.service_verticals(id);

-- Canonical, vertical-agnostic service row. Care packages map 1:1 here via source ref.
create table if not exists public.catalog_services (
  id              uuid primary key default gen_random_uuid(),
  vertical_id     uuid not null references public.service_verticals(id) on delete restrict,
  slug            text not null unique,
  name            text not null,
  summary         text,
  description      text,
  pricing_model   jsonb not null default '{}'::jsonb,   -- shape resolved by @henryco/pricing
  base_price_minor bigint check (base_price_minor is null or base_price_minor >= 0), -- integer minor units
  currency        text not null default 'NGN',
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  provider_supplied boolean not null default false,      -- true ⇒ fulfilled by a V3-50 provider
  source_table    text,                                  -- e.g. 'care_service_packages' for backfilled rows
  source_id       uuid,                                  -- FK-by-convention into the source table
  status          text not null default 'active' check (status in ('active','draft','retired')),
  created_at      timestamptz not null default timezone('utc', now()),
  updated_at      timestamptz not null default timezone('utc', now())
);
create unique index if not exists catalog_services_source_idx
  on public.catalog_services(source_table, source_id) where source_id is not null;
```

RLS: `service_verticals` and `catalog_services` are world-readable for `status = 'active'` (public catalog); writes restricted to platform staff via the established `public.is_platform_staff()` predicate. A `BEFORE UPDATE` `touch_updated_at()` trigger on both tables. Money is BIGINT minor units throughout (never float); `pricing_model` JSONB is validated by `@henryco/pricing`, never parsed ad hoc.

### S2 — Seed the 11 verticals + backfill the existing Care catalog

A committed-but-applied-deliberately seed (`apps/care/supabase/migrations/<ts>_services_catalog_seed.sql` or a `scripts/seed-services-catalog.mjs`) that inserts the 11 V3 verticals — **garment care, laundry, home cleaning, office cleaning, deep cleaning, repairs, errands, moving, event support, business support, provider-assisted** — and backfills `catalog_services` from `care_service_packages` (setting `source_table`/`source_id` so the existing booking path resolves the same row). Backfill is idempotent (`on conflict do nothing` keyed on `(source_table, source_id)`). Vertical/service display names are seeded in the canonical locale and translated at render — never hardcoded per locale in the seed.

### S3 — Service detail surface

New route `apps/care/app/(public)/services/[verticalSlug]/[serviceSlug]/page.tsx` (server component, `revalidate = 60`), reachable from a redesigned `apps/care/app/(public)/services/page.tsx` vertical directory. Each detail page renders: localized name + summary + description (`resolveLocalizedDynamicField`), pricing (formatted via `@henryco/pricing` + the existing `formatMoney` pattern, NGN minor-unit aware), duration, a "providers available" slot (empty-state copy until V3-50 lands — `provider_supplied` services show "Verified providers coming soon", not a broken list), and a **book CTA** that deep-links into the existing `/book` flow with the service preselected (`/book?service=<serviceSlug>`). No booking logic is added here — the CTA hands off to V3-51's engine when it ships; until then it lands on the current Care book form. Uses `CarePublicShell` + `CARE_ACCENT`; Fraunces display, light + dark, mobile + desktop, CLS ≈ 0.

### S4 — Hub cross-listing directory

A top-level services directory at the hub: `apps/hub/app/services/page.tsx` listing every active vertical with a localized card grid, each card linking to `henryDomain('care', '/services/<verticalSlug>')`. **Zero hardcoded domains** — the cross-division link resolves through `henryDomain()`/`henryWebRoot()` from `@henryco/config`, never a `care.henrycogroup.com` literal. Mirrors the de-carded editorial hub treatment (PublicSiteShell + PublicSiteFooter), not a monotonous card stack.

### S5 — Search indexing

Index `catalog_services` into the shared search rail. Add a `hc_services` Typesense collection definition in `packages/search-core/src/collections.ts` (mirroring the `hc_marketplace_products` shape: `id`, `type`, `division`, `title`, `summary`, `deep_link`, `trust_state`, `created_at`/`updated_at`, facets for `vertical`), wire the outbox sync (`packages/search-core/src/outbox.ts` pattern) so service create/update/retire reindexes, and extend the ranking pass in `ranking.ts` to score service hits. Service results surface in the existing Care search and the cross-division search experience. Per-IP rate limit on search is inherited from `search-core/rate-limit.ts` — do not weaken it.

### S6 — Telemetry

Three new events, added to the `HenryEventName` union in `packages/observability/src/events.ts` (so an unmapped event is a compile error) and emitted server-side:

```
henry.services.catalog.viewed     (hub directory or Care services index rendered)
henry.services.service.viewed     (a service detail page rendered)
henry.services.booking.started    (book CTA followed into the /book handoff)
```

No PII in event payloads; vertical/service slug + division only.

## Out of scope

- Verified provider profiles, tiers, quality score, provider workspace — **V3-50**.
- Slot picker, provider matching, recurring engine, cancellation policy, the real booking write path — **V3-51** (this pass's CTA only deep-links into the existing Care `/book`).
- Provider onboarding / KYC-gated provider signup — **V3-67**.
- Geo "near you" service discovery — **V3-63** (depends on V3-38 local availability).
- Content moderation of service/provider descriptions — **V3-25** (this pass consumes it; it does not build it).

## Dependencies

- **Requires:** V3-12 Foundation Lock acceptance (CERTIFIED).
- **Blocks:** V3-50 (provider model extends `catalog_services.provider_supplied`), V3-51 (booking targets `catalog_services`), V3-63 (local discovery searches this catalog).

## Inheritance

- Care data layer — `apps/care/lib/care-data.ts` (`getCareBookingCatalog`, `getCarePricing`), `care-theme.ts` (`CARE_ACCENT`), `CarePublicShell`.
- `@henryco/pricing` — `pricing_model` evaluation + minor-unit money formatting; never parse pricing JSONB by hand.
- `@henryco/search-core` — Typesense collections, outbox sync, ranking, rate-limit.
- `@henryco/i18n/server` — `getCareServicesCopy`, `resolveLocalizedDynamicField` for Supabase-sourced names.
- `@henryco/config` — `henryDomain()` / `henryWebRoot()` / `getDivisionConfig('care')` for every cross-surface URL and the division accent/name.
- `@henryco/observability` — telemetry taxonomy + audit log on the staff catalog-write path.

## Implementation requirements

### Files

The two migrations (S1) + seed/backfill (S2) under `apps/care/supabase/migrations/`; the service detail route + redesigned services index (S3); the hub directory `apps/hub/app/services/page.tsx` (S4); the `hc_services` collection + outbox + ranking extension in `packages/search-core/src/` (S5); the three events in `packages/observability/src/events.ts` (S6); `docs/v3/services-catalog-architecture.md` (the taxonomy map V3-50/51/63 read).

### Trust / safety / compliance

Public catalog reads are `status = 'active'` only; draft/retired services never leak. Staff catalog writes go through `public.is_platform_staff()` RLS and are audited via `@henryco/observability/audit-log`. Service descriptions are user-influenced content for provider-supplied rows — they MUST route through the V3-25 moderation gate before publish (consume the `@henryco/trust` moderation primitive; do not invent a parallel check). No secrets, no service-role key in any client bundle.

### Mobile + desktop parity

The services index, detail surface, and hub directory are responsive web first (1-col mobile / multi-col desktop, safe-area aware per V3-09). The Expo super-app consumes the same `catalog_services` rows through the shared data layer — no app-specific catalog fork. Booking handoff is deferred to V3-51, so no native booking surface is in scope here.

### i18n

All copy through `@henryco/i18n`. New typed-copy namespace **`surface:services`** for static labels (directory headings, "book this service", empty-state "verified providers coming soon", filter/sort labels, status copy). Supabase-sourced vertical/service names render through `resolveLocalizedDynamicField` (Pattern B runtime fallback for the 12 locales). Zero hardcoded user-facing strings; the hardcoded-text CI gate must stay green.

### Brand & design system

Division label is **"Henry Onyx Fabric Care"** and the hub directory is branded **"Henry Onyx"** — both read from `@henryco/config` (`getDivisionConfig('care').name`, `COMPANY.group.name`), never hardcoded; "Henry & Co." must not appear. Fraunces display + locked `--site-*`/`--accent` tokens (Care accent from `care-theme.ts`); light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed. Every cross-surface URL resolves through `@henryco/config` helpers — no `henrycogroup.com` literal anywhere in the diff.

## Validation gates

1. Standard CI: typecheck, lint, test, build (the only required branch-protection context: `Lint, typecheck, test, build`).
2. **Migration + backfill** applies cleanly against a branch DB; existing `getCareBookingCatalog()` still returns the same packages (backfilled `catalog_services` rows resolve by `source_table`/`source_id`); the live Care `/book` path is unbroken (regression smoke).
3. **Seed verifies 11 verticals** present with correct slugs; `catalog_services` count ≥ seeded Care packages.
4. **Service detail pages render** for every active vertical/service in light + dark, mobile + desktop, with localized copy and `@henryco/pricing`-formatted money.
5. **Search returns services**: `hc_services` collection created, outbox sync reindexes on write, a query for a seeded service returns it ranked.
6. **RLS verified**: anon reads only active rows; a non-staff user cannot write a vertical/service; staff write is audited.
7. **i18n gate green**; `surface:services` namespace registered; no hardcoded user-facing string; no `henrycogroup.com` literal.

## Deployment gate

All gates green; the only required check (`Lint, typecheck, test, build`) passing; branch `v3/49-product-services-catalog-expansion` off `origin/main` → PR → squash-merge (no force-push, no branch-protection bypass). Owner reviews `docs/v3/services-catalog-architecture.md`. **14-day soak** on the live catalog surfaces (directory + detail + search) confirming no Care booking regression and clean telemetry before V3-50 builds on it.

## Final report contract

`.codex-temp/v3-49-product-services-catalog-expansion/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion) + the taxonomy/backfill map and the search-collection definition.

## Self-verification

- [ ] `service_verticals` + `catalog_services` migration ships, extends (does not fork) the Care tables, money is BIGINT minor units, RLS + `touch_updated_at` in place.
- [ ] 11 verticals seeded; existing Care packages backfilled idempotently; live `/book` path unbroken.
- [ ] Service detail surface + redesigned services index render localized, money-formatted, light+dark, mobile+desktop, CLS ≈ 0.
- [ ] Hub `/services` directory cross-links via `henryDomain()` — zero hardcoded domains.
- [ ] `hc_services` search collection + outbox sync + ranking extension; a seeded service is searchable.
- [ ] Three `henry.services.*` events in the `HenryEventName` union, emitted server-side, exhaustive by construction.
- [ ] `surface:services` i18n namespace; brand reads from `@henryco/config` ("Henry Onyx Fabric Care" / "Henry Onyx"); no "Henry & Co.".
- [ ] Report written. Hand-off: V3-50 (provider model), then V3-51 (booking).
