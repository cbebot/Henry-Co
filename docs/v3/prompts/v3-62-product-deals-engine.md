# V3-62 — Product Expansion: Deals Engine (Partner-Authored Marketplace)

**Pass ID:** V3-62  ·  **Phase:** G (Product Expansion)  ·  **Pillar:** P1 (Service Breadth), P3 (Personalization Engine)
**Dependencies:** V3-35 (Deals & Campaigns)  ·  **Effort:** M  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 deals-product engineer for Henry Onyx. You execute exactly this one pass, then stop and report. V3-35 built the private engine — the `deals` / `deal_impressions` schema, the owner/staff campaign authoring tool, the personalized home module, and the impression-fairness audit. This pass turns that engine into a **public, partner-driven deals marketplace**: verified partners author their own offers self-service, every user gets a cross-division `/deals` discovery surface, and the fairness audit hardens from an owner alert into an enforced visibility cap so no single partner can buy out a category. The line you must not cross: a deal is **never a price mutation** — it is an audited offer artifact, and any discount that reaches checkout is applied only inside the behavior-locked `@henryco/payment-surface` / `@henryco/payment-router` as an idempotent, ledger-true, provider-confirmed line item. Partner-authored content is untrusted input: it is moderated before it is public, and ranking/eligibility stay server-side and opaque.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/62-product-deals-engine` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The private deals engine exists; the public partner product does not.

- **V3-35 schema (the foundation):** `public.deals` (`id`, `creator_partner_id` nullable, `created_by`, `title`, `description`, `deal_type ∈ {percent_off,fixed_off,bogo,bundle}`, `discount_value`, `discount_currency`, `scope_division`, `scope_categories TEXT[]`, `starts_at`, `ends_at CHECK (ends_at > starts_at)`, `status ∈ {draft,pending_review,approved,active,paused,expired,rejected}`, `visibility ∈ {public,targeted,unlisted}`, `audience_signals JSONB`, `approved_by`, `approved_at`) and `public.deal_impressions` (`deal_id`, `user_id`, `surface`, `shown_at`) with their RLS (public reads only currently-live public/targeted deals; creators read/write own; impressions service-role insert, staff read). Money in `fixed_off` is integer minor units with explicit `discount_currency`.
- **V3-35 data + surfaces:** `packages/data/src/deals.ts` (typed reads/writes + impression logging), the personalized deal home module registered through `@henryco/dashboard-shell` `getHomeWidgets`, the "All deals" page at `apps/account/app/(account)/deals/page.tsx`, and the fairness-audit cron emitting `henry.deal.fairness_alert` to an owner tile. `apps/account/components/deals/DealEditor.tsx` + `DealCard.tsx` are the shared authoring/render primitives. The partner business-suite creator (`apps/account/app/(account)/business/deals/`) exists but is **inert** — gated to verified partner accounts that V3-50 (the `partners` model) had not yet shipped at V3-35 authoring time.
- **What's missing (the gap this pass closes):** there is no public cross-division deals destination users can browse without a personalization context; there is no live partner self-service authoring path (it's a "coming soon" stub); the "On deal" facet does not exist in cross-division search; the fairness check is an *alert only* — it does not actually cap a runaway partner's visibility; and there is no owner-controlled promoted-placement (paid visibility) lane separated from organic ranking. V3-62 activates the partner authoring surface against the now-shipped `partners` model, ships the public `/deals` hub + per-division deal sections + the search facet, and upgrades the fairness audit into an **enforced** diversity cap with an auditable promoted-placement override.

If `creator_partner_id`'s FK to `public.partners` is not yet present (V3-50 adds it), this pass adds it as a forward-compatible migration step — it is a hard dependency for partner authoring and is listed under Dependencies.

## Mandatory scope

### S1 — `partners.deals_can_author` gate + `deal_partner_visibility` quota state

Activate partner authoring and persist the enforced-fairness state. New migration `apps/hub/supabase/migrations/<ts>_v3_62_deals_marketplace.sql`:

```sql
-- Forward-compat FK (no-op if V3-50 already added it).
alter table public.deals
  add constraint deals_creator_partner_fk
  foreign key (creator_partner_id) references public.partners (id) on delete set null
  not valid;  -- validate after backfill in a follow-up step; nullable rows pass
alter table public.deals validate constraint deals_creator_partner_fk;

-- Promoted (paid) placement is a distinct, owner-granted lane — never inferred from ranking.
alter table public.deals
  add column promoted boolean not null default false,
  add column promoted_by uuid references auth.users (id),
  add column promoted_until timestamptz;

-- Enforced-fairness ledger: the rolling impression share that the diversity guard reads.
create table public.deal_partner_visibility (
  id uuid primary key default gen_random_uuid(),
  creator_partner_id uuid not null references public.partners (id) on delete cascade,
  scope_division text,                       -- null = cross-division scope
  scope_category text,                       -- null = all categories in scope
  window_start timestamptz not null,
  impressions_total bigint not null default 0,
  impressions_partner bigint not null default 0,
  share numeric not null default 0,          -- impressions_partner / impressions_total, 0..1
  capped boolean not null default false,     -- guard is actively throttling this partner
  computed_at timestamptz not null default now(),
  unique (creator_partner_id, scope_division, scope_category, window_start)
);
create index deal_partner_visibility_lookup
  on public.deal_partner_visibility (scope_division, scope_category, window_start);

alter table public.deal_partner_visibility enable row level security;
-- Recomputable, no PII; readable by staff/owner for the audit; written service-role only.
create policy deal_partner_visibility_staff_read on public.deal_partner_visibility
  for select using (public.is_platform_staff());
create policy deal_partner_visibility_service_write on public.deal_partner_visibility
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
```

Regenerate types with `pnpm supabase:types`. The `promoted` lane is owner-only (S5); the `deal_partner_visibility` rows are the persisted output of the S4 enforced fairness pass.

### S2 — Live partner self-service authoring

Turn `apps/account/app/(account)/business/deals/` from inert stub into a working surface, reusing the V3-35 `DealEditor.tsx` form (do **not** fork it):

- Gate to accounts with a verified `partners` row where `deals_can_author` is true (resolve through `packages/data/src/deals.ts` + the V3-50 partner resolver). A non-partner account sees a "Become a verified partner" CTA deep-linked through `getAccountUrl()` to the V3-67 partner-onboarding entry — never a dead end.
- Partner-authored deals are forced to `creator_partner_id = <their partner id>`, `created_by = auth.uid()`, and **always** enter at `status = 'pending_review'` (a partner can never self-approve; reuse the V3-35 approval workflow). A per-partner **deal calendar** view lists their drafts, pending, active, paused, and expired deals with edit/pause controls (`status` transitions only via the V3-35 server action wrapped in `requireSensitiveAction` + audit log).
- All authoring writes go through the same `requireSensitiveAction` server action as V3-35 — this mutates customer-facing offers. Validate `ends_at > starts_at`, `discount_value` bounds per `deal_type`, `discount_currency` present for `fixed_off`. A partner may set `visibility ∈ {public,targeted}` only — never `unlisted` (owner-reserved).

### S3 — Public cross-division discovery surfaces

The discovery product. Three new surfaces, all reading only live deals through RLS (no client-side eligibility logic):

- **`/deals` cross-division hub** — `apps/account/app/(account)/deals/page.tsx` already hosts the authenticated "All deals" list (V3-35). Add a **public** sibling so unauthenticated users can browse: `apps/hub/app/deals/page.tsx` rendered inside `PublicSiteShell` (`@henryco/ui`), listing currently-live `visibility='public'` deals, filterable by division + category. For signed-out users selection is by recency + promoted lane only (no personalization); for signed-in users it folds in the V3-35 personalization ordering. Pre-render with `revalidate` for SEO; emit `deal_impressions` (`surface='public_deals_hub'`) server-side per render.
- **Per-division deal section** — a reusable `<DivisionDealsStrip division={...} />` (in `packages/dashboard-shell` or `apps/account/components/deals/`) showing the top live deals scoped to one division, droppable into each division mini-dashboard and the division public landing. Reuses the V3-35 `DealCard.tsx`.
- **"On deal" search facet** — register a `deals` collection contribution so live deals are retrievable via `@henryco/search-core`: index each `status='active'` public/targeted deal as a `SearchDocument` (`type` extended for deals, `division`, `deep_link` resolved via `@henryco/config`, `role_visibility: ['public']` or `['authenticated']` for targeted) and add an "On deal" filter toggle to the cross-division search experience. Indexing happens server-side on deal status transitions (V3-35 audit hook), never client-side.

### S4 — Enforced fairness (cap, not just alert)

Upgrade the V3-35 fairness audit from alert-only to enforced:

- Extend the V3-35 fairness-audit cron to also **write** `deal_partner_visibility` rows: over a rolling window (configurable via `@henryco/config`, default 7 days), per `(scope_division, scope_category)`, compute each partner's `impressions_partner / impressions_total`. When a partner's `share` exceeds a configurable threshold (default 30%, per the original intent), set `capped = true` and emit `henry.deal.fairness_alert_triggered`.
- The home-module + `/deals` hub selection applies an **enforced diversity guard**: a `capped` partner's deals are down-weighted (their organic impression rate is throttled to the threshold) and consecutive same-partner cards are capped — mirroring the V3-52 marketplace ranking diversity guard and the V3-35 server-side guard. The guard is server-side, deterministic, and unit-tested. Promoted (S5) deals are exempt from the organic throttle but counted toward total impressions for transparency.

### S5 — Owner promoted-placement override

A controlled paid-placement lane, fully separated from organic ranking:

- An owner-only control (Hub owner/staff shell) sets `promoted = true`, `promoted_by = auth.uid()`, `promoted_until` on a specific deal — gated to `is_owner()`, wrapped in `requireSensitiveAction`, audit-logged (`deal.promoted.set` / `deal.promoted.cleared`) via `@henryco/observability/audit-log`.
- Promoted deals get a guaranteed slot quota in the `/deals` hub and per-division strips, visually distinguished by an i18n "Promoted" badge (transparency requirement — promoted placement is never silent). Promotion expires automatically at `promoted_until` (the S6 expiry workflow clears it). Promotion never alters the discount, the money path, or the moderation requirement.

### S6 — Deal expiry + promotion-expiry workflow

A scheduled job (`@henryco/observability` cron pattern, idempotent) that:
- Auto-archives deals whose `ends_at < now()` → `status = 'expired'` (terminal), de-indexes them from `@henryco/search-core`, and stops counting their impressions.
- Clears `promoted` when `promoted_until < now()`.
- Each transition writes the audit log + emits telemetry. Idempotent (re-running flips nothing already flipped — fingerprint by `(deal_id, target_status)`), mirroring the existing logistics-automation cron pattern.

### S7 — Telemetry + owner observability

Emit via `@henryco/intelligence` (validated by `henryEventNameSchema`), registered in the `HenryEventNames` registry:
- `henry.deal.partner_authored` — a verified partner submits a deal for review.
- `henry.deal.discovery_viewed` — the public `/deals` hub or a division strip renders to a user.
- `henry.deal.fairness_alert_triggered` — a partner crosses the visibility threshold and is capped.

Owner tiles: live deals by partner, impression share by partner per scope (the `deal_partner_visibility` view), currently-capped partners, active promoted placements with spend window, and discovery-hub view volume.

## Out of scope

- Personalized deal ordering, the `deals`/`deal_impressions` schema, the home module, and the alert-only fairness audit — **V3-35** owns them; this pass consumes and extends them.
- The `partners` table, partner verification, and partner onboarding — **V3-50** (model) + **V3-67** (onboarding). This pass reads them; it does not build them.
- Email / SMS / push **dispatch** of deals — **V3-48** (follow-up campaigns) + **V3-61** (newsletter engine).
- Applying a deal discount at **checkout** (the money path) — behavior-locked `@henryco/payment-surface` / `@henryco/payment-router`; this pass authors and surfaces offers only.
- The marketplace product ranking re-rank itself — **V3-52** (the diversity-guard reference this pass mirrors).

## Dependencies

Depends on **V3-35** (deals engine, schema, home module, fairness audit) and **V3-50** (the `partners` model that `creator_partner_id` references and that gates partner authoring). Consumes **V3-52**'s diversity-guard pattern and **V3-67**'s onboarding entry for the non-partner CTA. **Blocks** nothing downstream directly, but feeds **V3-71** (seller business suite reuses partner deal authoring) and **V3-48** (campaigns can target live deal artifacts).

## Inheritance

- V3-35: `public.deals` / `public.deal_impressions`, `packages/data/src/deals.ts`, `DealEditor.tsx`, `DealCard.tsx`, the personalized home module, the approval workflow, and the fairness-audit cron.
- `@henryco/dashboard-shell` — home-widget registry (`getHomeWidgets`) + `Panel`/`EmptyState` primitives for the division strips and owner tiles.
- `@henryco/search-core` — `SearchDocument`, collections, the cross-division search experience (the "On deal" facet).
- `@henryco/intelligence` — analytics envelope (`henryEventNameSchema`, `HenryEventNames`).
- `@henryco/observability` — `audit-log` on every mutating/promotion route + the cron pattern.
- `@henryco/ui` — `PublicSiteShell` / `PublicSiteFooter` + tokens for the public `/deals` hub.
- `@henryco/config` — division names, currency, thresholds, and every URL via `getAccountUrl()` / `getHubUrl()` / `henryWebRoot()`.
- `requireSensitiveAction` (V3-02) on every authoring/promotion/transition route.
- V3-50 `partners` model + V3-67 onboarding entry (forward references made live by this pass).

## Implementation requirements

### Files

- `apps/hub/supabase/migrations/<ts>_v3_62_deals_marketplace.sql` (new — S1)
- `apps/account/app/(account)/business/deals/` (activate the inert stub — S2: deal calendar + live editor wiring)
- `apps/hub/app/deals/page.tsx` (new — public cross-division hub, S3)
- `apps/account/components/deals/DivisionDealsStrip.tsx` (new — S3) + reuse of `DealCard.tsx`
- `@henryco/search-core` deals-collection contribution + indexer hook (S3)
- Fairness-audit cron extension + `deal_partner_visibility` writer + enforced diversity-guard unit tests (new — S4)
- Owner promoted-placement control in the Hub owner/staff shell (new — S5)
- Deal-expiry + promotion-expiry cron handler (new — S6)
- `packages/data/src/deals.ts` extensions (partner-author gate, promoted-state reads, visibility-share reads)
- i18n copy under `surface:deals`

### Trust / safety / compliance

Partner-authored `title`/`description` are untrusted input: every partner deal enters at `pending_review` and is moderated (reuse the V3-35 approval workflow / V3-25 moderation framework if shipped) before it can go `active` / public. Authoring, promotion, and every status transition are mutating routes → `requireSensitiveAction` + `@henryco/observability/audit-log`. RLS hides non-live deals from the public; the `deal_partner_visibility` ledger is staff-read / service-write only and carries no PII. Selection, ranking, and the fairness cap are server-side and opaque (ANTI-CLONE Principle 1 — never ship the ordering logic or the share table to the client). **No money behavior changes:** any discount that reaches checkout is applied by the behavior-locked payment surface as an idempotent, ledger-true, provider-confirmed line item — this pass never writes a price.

### Mobile + desktop parity

The public `/deals` hub, the per-division strips, the partner deal calendar, and the "On deal" search facet are responsive — light + dark, mobile + desktop. They read the same data on web mobile and (forward) the Expo super-app via `packages/data` + the search API; note the mobile contract for V3-87, build no native UI here. The owner promoted-placement control is desktop staff-shell only.

### i18n

Extend the V3-35 typed copy module `packages/i18n/src/deals-copy.ts` (namespace `surface:deals`): public-hub headings, filter labels, the "Promoted" badge, the "On deal" facet label, the partner deal-calendar status names, the "Become a verified partner" CTA, the fairness/capped-state copy, and all empty/loading/error states. Partner-authored `title`/`description` are free text → rendered through `translateSurfaceLabel` so a user sees them in their locale when a translation exists. Zero hardcoded user-facing strings. 12 locales.

### Brand & design system

Every division label and brand string ("Henry Onyx Marketplace", "Henry Onyx Care", etc.) reads from `@henryco/config` (`COMPANY.divisions[...]`) — never hardcoded, never "Henry & Co.". The public `/deals` hub renders inside `PublicSiteShell` with Fraunces display + locked `--site-*` / `--accent` tokens, per-division accent from `company.ts`; the authenticated surfaces use `@henryco/dashboard-shell` + `@henryco/ui` tokens (no ad-hoc hex). Every deep link resolves through `getAccountUrl()` / `getHubUrl()` / `henryWebRoot()` / `henryDomain(division)` — zero `henrycogroup.com` literals. Light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed.

## Validation gates

1. **Standard CI** — `pnpm typecheck && pnpm lint && pnpm test && pnpm build` green across all touched apps/packages (the only required branch-protection context: `Lint, typecheck, test, build`).
2. **Partner authoring e2e** — a verified partner account authors a deal → it enters `pending_review` (never self-approved) → appears on the partner calendar → staff approves → goes `active` and public. A non-partner account sees the onboarding CTA, not the editor.
3. **Public discovery** — the public `/deals` hub renders live public deals for a signed-out user (recency + promoted only); a signed-in user gets personalized ordering; the "On deal" search facet returns only live deals; impressions are recorded server-side.
4. **Enforced fairness** — synthetic impression skew toward one partner crosses the threshold → `deal_partner_visibility.capped = true`, `henry.deal.fairness_alert_triggered` fires, and the diversity guard throttles that partner's organic impressions (unit-tested) while promoted deals remain visible and counted.
5. **Promoted placement** — an owner sets `promoted` on a deal (gated `is_owner()` + `requireSensitiveAction` + audited); it gets its guaranteed slot with the "Promoted" badge; it clears automatically at `promoted_until`.
6. **Expiry workflow** — a deal past `ends_at` auto-archives to `expired`, de-indexes from search, and stops accruing impressions; idempotent on re-run.
7. **RLS verification** — anonymous + non-creator users cannot read draft/pending/expired/unlisted deals; a partner cannot mutate another partner's deal nor set `unlisted`/`promoted`; `deal_partner_visibility` is staff-read / service-write only. Prove with SQL against the project.
8. **Telemetry** — the three events validate against `henryEventNameSchema`; owner tiles render real values.
9. **Real-browser UI** — the public hub + strips render correctly light + dark, mobile + desktop, CLS ≈ 0, contrast green.

## Deployment gate

All validation gates green; PR `v3/62-product-deals-engine` off `origin/main` → squash-merge via CI (no branch-protection bypass, no force-push). Owner reviews the public `/deals` hub, the partner authoring flow, the enforced-fairness threshold, and the promoted-placement control before stable declaration. Ship behind a kill switch (the public hub + partner authoring instantly hideable). **14-day soak** monitoring `henry.deal.fairness_alert_triggered` volume, impression distribution by partner, and discovery-hub engagement before declaring stable.

## Final report contract

`.codex-temp/v3-62-product-deals-engine/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion).

## Self-verification

- [ ] S1 migration applied: `creator_partner_id` FK to `public.partners`, `promoted`/`promoted_by`/`promoted_until` columns, `deal_partner_visibility` table with staff-read / service-write RLS; types regenerated.
- [ ] S2 partner self-service live: verified-partner gate, forced `pending_review` entry, deal calendar, `requireSensitiveAction` + audit on every write; non-partner gets the onboarding CTA, not the editor.
- [ ] S3 discovery: public `/deals` hub (signed-out = recency+promoted, signed-in = personalized), per-division `<DivisionDealsStrip>`, and the "On deal" `@henryco/search-core` facet — all reading live deals via RLS only.
- [ ] S4 enforced fairness: cron writes `deal_partner_visibility`, threshold crossing caps the partner, the server-side diversity guard throttles organic impressions (unit-tested); promoted exempt from throttle but counted.
- [ ] S5 owner promoted lane: `is_owner()` + `requireSensitiveAction` + audited; guaranteed slot + "Promoted" badge; auto-clears at `promoted_until`.
- [ ] S6 expiry cron: deals past `ends_at` → `expired` + de-indexed; promotion auto-cleared; idempotent.
- [ ] S7: three telemetry events registered + validating; owner tiles live.
- [ ] No money behavior changed; all copy via `surface:deals`; brand via `@henryco/config` (Henry Onyx, never "Henry & Co."); zero hardcoded domains/strings; light + dark, mobile + desktop, CLS ≈ 0.
- [ ] Kill switch wired; report written. Hand-off: V3-71 (seller suite reuses partner authoring).
