# V3-50 — Product Expansion: Verified Provider Model

**Pass ID:** V3-50  ·  **Phase:** G (Product Expansion)  ·  **Pillar:** P1 (Product Expansion), P7 (Trust & Safety), P8 (Business & Partner Suites)
**Dependencies:** V3-49 (services catalog), V3-24 (KYC vendor integration)  ·  **Effort:** XL  ·  **Parallel-safe:** N (middle of the V3-49 → V3-50 → V3-51 chain)
**Owner gate:** none  ·  **Risk class:** Identity, Compliance

---

## Role

You are the V3 Verified Provider engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass turns a flat `partner`/`vendor` record into a **trusted provider identity**: a public provider profile, a four-level verification ladder anchored to the V3-24 KYC spine, a server-computed quality score, service-area + availability metadata, and a provider-side workspace for managing offerings and reviews. The line it must not cross: the **scoring formula and the provider graph are a data moat** — the formula lives server-only and is never client-exposed or fully revealed to a competitor (ANTI-CLONE Principles 1, 10); this pass builds the provider *identity and surfaces*, not the booking engine (V3-51), the onboarding/contract-acceptance flow (V3-67), or payouts (V3-69).

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/50-product-verified-provider-model` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

A real trust spine already exists. `apps/marketplace/supabase/migrations/20260402180000_marketplace_init.sql` ships `marketplace_vendors` with the exact signals this pass generalises — `verification_level`, `trust_score numeric(5,2)`, `fulfillment_rate`, `dispute_rate`, `review_score`, `followers_count`, `response_sla_hours`, `badges[]`, `status` — and `marketplace_vendor_applications` for the apply path. The shared `@henryco/trust` package defines the canonical vocabulary: `SharedTrustTier` (`basic | verified | trusted | premium_verified`), `SharedVerificationStatus`, `applyVerificationTrustControls` (caps score/tier by verification status), `getVerificationGateCopy`, plus `moderation.ts` and `detect.ts`. V3-49 added `catalog_services.provider_supplied` to mark services fulfilled by a provider. V3-24 (KYC) supplies the verification events (NIN/BVN/document/biometric) that must advance a provider's tier. The gap: there is **no provider-shaped identity that spans verticals** (the marketplace vendor is product-only), no public provider profile, no provider workspace, and no quality score derived from *service* outcomes. This pass introduces a vertical-agnostic provider profile that reuses the `@henryco/trust` tier vocabulary and the marketplace signal columns as the model, binds verification tiers to V3-24, and exposes the provider on a public page + a private workspace.

## Mandatory scope

### S1 — Provider profile schema

Migration `apps/care/supabase/migrations/<ts>_provider_profiles.sql` (Care owns the cross-vertical services platform from V3-49; providers are services-platform actors). A provider is anchored to a `partners`/auth user; the profile carries the public-facing identity:

```sql
create table if not exists public.provider_profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  slug              text not null unique,
  display_name      text not null,
  bio               text,                              -- moderated via @henryco/trust before publish
  photos            jsonb not null default '[]'::jsonb, -- storage refs, never hardcoded URLs
  service_areas     jsonb not null default '[]'::jsonb, -- [{ city, region, radius_km }]
  capabilities      text[] not null default '{}',       -- vertical/service slugs from V3-49
  certifications    jsonb not null default '[]'::jsonb,  -- [{ label, issuer, verified_at }]
  languages         text[] not null default '{}',
  verification_level text not null default 'l1'
                     check (verification_level in ('l1','l2','l3','l4')),
  trust_tier        text not null default 'basic'
                     check (trust_tier in ('basic','verified','trusted','premium_verified')),
  quality_score     numeric(5,2) not null default 0 check (quality_score between 0 and 100),
  status            text not null default 'pending'
                     check (status in ('pending','active','suspended','retired')),
  created_at        timestamptz not null default timezone('utc', now()),
  updated_at        timestamptz not null default timezone('utc', now())
);

-- Per-provider availability windows (read by V3-51's slot picker; this pass only stores them).
create table if not exists public.provider_availability (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references public.provider_profiles(id) on delete cascade,
  weekday      smallint not null check (weekday between 0 and 6),
  start_minute integer not null check (start_minute between 0 and 1439),
  end_minute   integer not null check (end_minute between 1 and 1440),
  timezone     text not null default 'Africa/Lagos',
  check (end_minute > start_minute)
);
```

RLS: a provider reads/writes **only their own** profile + availability (`user_id = auth.uid()`); the public reads `status = 'active'` rows with **non-sensitive columns only** (a `provider_public` view or column-scoped policy — never expose `quality_score` raw math inputs); staff read all via `public.is_platform_staff()`. `touch_updated_at()` trigger.

### S2 — Verification tiers bound to V3-24 KYC

Four levels, each gated by a concrete V3-24 KYC outcome — **the tier advances on a verification event, never on self-assertion**:

- **L1** — email + phone verified (already covered by V3-02 auth).
- **L2** — identity verified (NIN/BVN via the V3-24 adapter).
- **L3** — documents + biometric verified (V3-24 document + liveness).
- **L4** — background-checked, only where the market permits and the provider opted in (V3-24 background-check adapter).

The provider's `trust_tier` is then derived by passing the verification status through `applyVerificationTrustControls` from `@henryco/trust` (so an unverified provider is capped at `basic`, pending at `verified`, etc.) — reuse the shared function, do not reimplement the cap logic. A V3-24 verification-resolved event (`henry.trust.verification.resolved`) triggers a server-side recompute of `verification_level` + `trust_tier`. Emit `henry.provider.verification.upgraded` on advance, audited.

### S3 — Quality score (server-only, explainable to the provider)

A server-side function `computeProviderQualityScore(providerId)` (in `apps/care/lib/provider-quality.ts`, never shipped to the client) derives a 0–100 score from completed-booking outcomes + ratings + dispute rate + on-time rate — mirroring the `marketplace_vendors` signal set (`fulfillment_rate`, `dispute_rate`, `review_score`, `response_sla_hours`). The **exact weighting is proprietary** (ANTI-CLONE Principle 1) — never serialised to any client response and never in a client bundle. The provider sees an **explainable reason breakdown** ("on-time rate strong, dispute rate elevated") — categorical reason codes, not the raw formula. Recompute on booking completion (hook reserved for V3-51) and on a daily cron; persist to `quality_score`; emit `henry.provider.quality_score.recomputed` (audited). The public profile shows a **truncated/banded** score (e.g. a tier badge + a coarse band), never the raw numeric inputs (ANTI-CLONE — score formula is a data moat).

### S4 — Public provider page

Route `apps/care/app/(public)/providers/[slug]/page.tsx` (server component) showing: verification **tier badge**, banded quality indicator, reviews (read-only here), available services (from `capabilities` × `catalog_services`), service areas, languages. Built on `CarePublicShell` + `CARE_ACCENT`; cross-division URLs via `henryDomain()`. **No raw score, no formula inputs, no full provider list dump** behind a single unauthenticated call (per-IP rate limit + pagination so the provider graph can't be scraped wholesale — ANTI-CLONE Principle 10).

### S5 — Provider workspace

Authenticated provider surfaces under `apps/account/app/(account)/provider/`:
- `bookings/` — bookings calendar (read-only placeholder until V3-51 supplies the booking write path; renders the provider's `provider_availability` windows).
- `offerings/` — manage which `catalog_services` (V3-49) this provider offers (edit `capabilities`).
- `reviews/` — reviews + feedback received, with the explainable quality-score breakdown from S3.
- `earnings/` — **stub linking to V3-69** (no payout logic in this pass; an empty-state pointing at the future payouts surface).

All workspace mutations go through `requireSensitiveAction` (V3-02) where they change verification or published profile fields, and are audited.

### S6 — Telemetry

Three new events in the `HenryEventName` union (`packages/observability/src/events.ts`), emitted server-side:

```
henry.provider.profile.viewed             (public provider page rendered)
henry.provider.verification.upgraded      (tier advanced on a V3-24 KYC outcome)
henry.provider.quality_score.recomputed   (score recomputed; carries no raw inputs)
```

## Out of scope

- Provider onboarding flow + contract acceptance — **V3-67** (this pass defines the profile that onboarding fills).
- Partner payouts — **V3-69** (the `earnings/` workspace tab is a stub).
- Slot picker, provider matching, recurring bookings, the booking write path — **V3-51**.
- Per-vertical specifics (each vertical gets its own pass as needed).
- The KYC vendor adapters themselves — **V3-24** (this pass consumes its events; it does not build the adapters).

## Dependencies

- **Requires:** V3-49 (services catalog + `provider_supplied`), V3-24 (KYC verification events).
- **Blocks:** V3-51 (matching ranks on `quality_score`; slot picker reads `provider_availability`), V3-63 (local discovery uses provider `service_areas`), V3-67 (onboarding fills the profile), V3-72 (provider CRM extends the workspace).

## Inheritance

- `@henryco/trust` — `SharedTrustTier`, `applyVerificationTrustControls`, `getVerificationGateCopy`, `moderation.ts` (bio moderation), `detect.ts`. The provider model **reuses** this vocabulary.
- `marketplace_vendors` signal columns — the proven shape (`trust_score`, `fulfillment_rate`, `dispute_rate`, `review_score`, `response_sla_hours`) the quality score mirrors.
- V3-24 KYC adapter + its verification-resolved events.
- V3-49 `catalog_services` (`capabilities` reference it; `provider_supplied` marks provider services).
- `@henryco/config` (`henryDomain`, `getDivisionConfig('care')`), `@henryco/i18n`, `@henryco/observability` (telemetry + audit log), `CarePublicShell` + `CARE_ACCENT`.

## Implementation requirements

### Files

The `provider_profiles` + `provider_availability` migration with the public view/RLS (S1); `apps/care/lib/provider-quality.ts` (server-only, S3); the public provider page (S4); the `apps/account/app/(account)/provider/` workspace (S5); the three events (S6); `docs/v3/provider-model-architecture.md` (the trust-and-tier map V3-51/67/72 read).

### Trust / safety / compliance

ANTI-CLONE Principle 1 — the quality-score formula is server-only, never serialised to a client; the provider sees categorical reasons, the public sees a band. Principle 10 — the provider graph is rate-limited + paginated; no single call dumps the full provider list. Principle 12 — verification gates are real (tier advances only on a V3-24 KYC outcome). Bios + certifications are user-supplied → route through `@henryco/trust` moderation before publish. Verification-changing and profile-publishing mutations require `requireSensitiveAction` and are audited via `@henryco/observability/audit-log`. The public RLS view exposes **no** raw score inputs. L8-style provider liability/insurance notes are a config concern, not hardcoded copy.

### Mobile + desktop parity

Public provider page and provider workspace are responsive (safe-area aware per V3-09). The Expo super-app provider workspace consumes the same `provider_profiles` rows via the shared data layer — no app-specific provider fork. Photo upload uses the existing storage path, not a new client surface.

### i18n

All copy through `@henryco/i18n`. New typed-copy namespace **`surface:providers`** for tier-badge labels, verification-gate copy (reuse `getVerificationGateCopy` from `@henryco/trust`), quality reason codes, workspace labels, empty states. Reviews and provider-authored bios render through `resolveLocalizedDynamicField` (Pattern B). Zero hardcoded user-facing strings.

### Brand & design system

Tier badges and the provider page are branded **"Henry Onyx Fabric Care"** / **"Henry Onyx"** read from `@henryco/config` — never "Henry & Co.". Fraunces display + locked `--site-*`/`--accent` (Care accent); light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` clean. Every URL via `@henryco/config` helpers — no `henrycogroup.com` literal.

## Validation gates

1. Standard CI: typecheck, lint, test, build (`Lint, typecheck, test, build`).
2. **Tier upgrade path**: a synthetic V3-24 `henry.trust.verification.resolved` event advances `verification_level` and re-derives `trust_tier` through `applyVerificationTrustControls` (capped correctly for none/pending/rejected/verified).
3. **Quality score**: a synthetic set of completed bookings + ratings + disputes produces the expected band; the raw formula appears in **no** client response (assert by inspecting the public page payload).
4. **Profile renders publicly** in light + dark, mobile + desktop, with localized tier/verification copy, and exposes no raw score inputs.
5. **RLS verified**: a provider edits only their own profile; the public reads only active + non-sensitive columns; a wholesale provider-list scrape is rate-limited/paginated; staff read all.
6. **Workspace mutations** require `requireSensitiveAction` and are audited.
7. **i18n + brand gates green**; `surface:providers` namespace; no hardcoded string; no `henrycogroup.com` literal.

## Deployment gate

All gates green; the only required check passing; branch `v3/50-product-verified-provider-model` off `origin/main` → PR → squash-merge (no force-push). Owner reviews `docs/v3/provider-model-architecture.md` and the score-secrecy posture. **30-day soak with a small partner cohort** (live verification advances + score recomputes observed clean) before V3-51 matching ranks on the score and V3-67 onboarding fills the profile.

## Final report contract

`.codex-temp/v3-50-product-verified-provider-model/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion) + the verification-tier map and the score-secrecy assertion.

## Self-verification

- [ ] `provider_profiles` + `provider_availability` schema with public view/RLS; provider edits only own rows; staff read all.
- [ ] Four verification tiers (L1–L4) advance only on V3-24 KYC outcomes; `trust_tier` derived via `applyVerificationTrustControls` (`@henryco/trust`).
- [ ] `computeProviderQualityScore` is server-only; formula never client-exposed; provider sees explainable reason codes; public sees a band.
- [ ] Public provider page (rate-limited graph) + private provider workspace (offerings/reviews/bookings stub/earnings stub).
- [ ] Three `henry.provider.*` events in the `HenryEventName` union; verification + score events audited.
- [ ] ANTI-CLONE 1/10/12 honored; bios moderated; sensitive mutations gated + audited.
- [ ] `surface:providers` i18n; brand from `@henryco/config`; no "Henry & Co."; no hardcoded domain.
- [ ] Report written. Hand-off: V3-51 (booking), V3-67 (onboarding), V3-72 (CRM).
