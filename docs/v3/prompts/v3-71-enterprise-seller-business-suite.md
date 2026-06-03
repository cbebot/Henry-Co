# V3-71 — Partner & Enterprise: Seller Business Suite

**Pass ID:** V3-71  ·  **Phase:** H (Partner & Enterprise)  ·  **Pillar:** P8 (Partner & Business)
**Dependencies:** V3-57 (Business Profiles + Tools), V3-58 (Seller Academy)  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 Enterprise Seller-Suite engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass turns the per-seller marketplace vendor workspace into a **business-grade seller suite**: bulk catalog operations, scheduled deals, deep performance analytics, payout visibility, and team-role delegation scoped to a `business`. The line it must not cross: it adds *operational tooling over existing seller data* — it does not change marketplace ranking (V3-52), payout mechanics (V3-69), or any money behaviour. Every billed or payout-affecting surface is read-through to its owning pass; this suite only *displays* and *schedules*.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/71-enterprise-seller-business-suite` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The marketplace already ships a real single-seller workspace at `apps/marketplace/app/vendor/` with `products/`, `products/new/`, `products/[id]/`, `orders/`, `orders/[groupId]/`, `payouts/`, `analytics/`, `disputes/`, `settings/`, and the public `store/`. These are per-`vendor` surfaces — they operate on one seller at a time, one product at a time, with no batch primitives, no forward-scheduled deals, and no multi-user delegation. V3-57 introduced the formal `businesses` + `business_members` model (roles `owner`/`admin`/`member`) and the act-as-business context switch; V3-58 introduced `seller_tiers` (bronze/silver/gold) and per-tier fee discounts. V3-68 computes partner performance; V3-69 owns the `payouts` schema and rails. What is missing is the *enterprise operating layer* a serious seller needs: import a catalog from CSV instead of clicking 200 product forms, schedule a Black-Friday deal three weeks out, read conversion analytics across the whole catalog, see the next payout without leaving the suite, and grant a warehouse operator write-access without sharing the owner login. This pass builds that layer on top of the V3-57 business model and the existing vendor surfaces — reusing, never forking, the seller's product/order/payout data.

## Mandatory scope

### S1 — Suite shell + business-scoped access

New route group `apps/marketplace/app/vendor/suite/` rendered only when the active context (V3-57 `business_context`) is a verified `business` and the acting member's role permits it. Layout `apps/marketplace/app/vendor/suite/layout.tsx` resolves the active `business_id` from the V3-57 context cookie, loads the caller's `business_members.role`, and gates each sub-surface by a capability map (S6). A personal (non-business) seller sees the existing `apps/marketplace/app/vendor/*` surfaces unchanged — the suite is additive.

```
apps/marketplace/app/vendor/suite/
  layout.tsx               business-context + role resolution; capability gate
  page.tsx                 suite home (KPI summary, next payout, pending deals)
  catalog/page.tsx         bulk catalog operations (S2)
  catalog/import/page.tsx  CSV import wizard (S2)
  deals/page.tsx           scheduled deals list + authoring (S3)
  analytics/page.tsx       catalog performance analytics (S4)
  payouts/page.tsx         read-through payout view (S5)
  team/page.tsx            team roles management (S6)
```

### S2 — Bulk catalog operations

Server actions in `apps/marketplace/app/vendor/suite/catalog/actions.ts`. All operate on `products` rows owned by the active `business_id` (RLS-enforced), never another seller's catalog.

- **CSV import.** Upload a UTF-8 CSV (columns: `sku,title,description,price_minor,currency,inventory_qty,category,status`). Parse server-side; validate every row before any write (a single bad row aborts the batch with a per-row error report — never a partial-corrupt catalog). Persist imports to a new staging table for auditability:

```sql
CREATE TABLE seller_bulk_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  source_filename TEXT NOT NULL,
  row_count INT NOT NULL,
  succeeded_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'validating'
    CHECK (status IN ('validating','applying','completed','failed','rolled_back')),
  error_report JSONB,                       -- [{ row, column, message }]
  idempotency_key UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, idempotency_key)
);
ALTER TABLE seller_bulk_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY seller_bulk_imports_member_read ON seller_bulk_imports
  FOR SELECT USING (
    business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid())
  );
CREATE POLICY seller_bulk_imports_member_write ON seller_bulk_imports
  FOR INSERT WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = auth.uid() AND role IN ('owner','admin','member')
    )
  );
```

- **Bulk price / inventory update.** Select-many over the catalog → set price (BIGINT minor units, never float), set inventory, or apply a percentage delta. Idempotent (UUID key per batch); each batch writes an audit-log row.
- **Bulk publish / unpublish.** Flip `products.status` for the selection in one transaction.

`price_minor` is BIGINT minor units throughout; `currency` validated against `@henryco/i18n/currency` `isSupportedCurrency`. The import wizard surfaces the row-level error report inline before the caller confirms — no silent drops.

### S3 — Deal scheduling

New table + authoring surface. A deal is a forward-dated discount window over a product selection; it activates and deactivates by timestamp via the V3-43 workflow engine if present, else a dedicated cron handler.

```sql
CREATE TABLE seller_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent','fixed_minor')),
  discount_value BIGINT NOT NULL CHECK (discount_value > 0),  -- percent (1-100) or minor units
  product_ids UUID[] NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL CHECK (ends_at > starts_at),
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','active','ended','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE seller_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY seller_deals_member ON seller_deals
  FOR ALL USING (
    business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid())
  ) WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = auth.uid() AND role IN ('owner','admin')
    )
  );
```

- **Plan ahead.** Author a deal with a future `starts_at` (validated against `now()`); it sits `scheduled` until activation.
- **Auto-activate / auto-end.** Cron handler `apps/marketplace/app/api/cron/seller-deals-activate/route.ts` flips `scheduled → active` at `starts_at` and `active → ended` at `ends_at`. Idempotent; one transition per row per run. Discounts must NOT touch the payment surface — they adjust the displayed/charged catalog price at order time through the existing pricing path (`@henryco/pricing`), never the payment-router behaviour.
- **Per-deal performance.** The deal detail view reads orders attributed to the deal window for its products (units sold, revenue, uplift vs the prior equivalent window).

### S4 — Catalog performance analytics

Read-only analytics surface over existing order + view data, aggregated at the `business_id` level. No new event capture beyond S7 telemetry — reuse the existing marketplace order/view signals.

- **Listings views + conversions.** Per product and catalog-wide: impressions → product-page views → add-to-cart → orders, with conversion rates at each step.
- **Top performers per category.** Ranked sellers-own products by revenue and by units, grouped by `category`.
- **Seasonal trends.** Revenue/units time-series with week-over-week and month-over-month deltas.

All money figures BIGINT minor units, formatted via `@henryco/i18n/currency`. Charts use design-system tokens only (no ad-hoc hex). Every tile distinguishes "no data yet" from "loading" from "zero" (the V3-08 truth rule — never decorative placeholders).

### S5 — Payout management (read-through)

This suite **does not move money**. It surfaces the V3-69 `payouts` view scoped to the active `business`:

- Read the payout schedule, upcoming payout, and history from V3-69's tables.
- Deep-link "Change payout method" / "Manage bank account" to the V3-69 partner payout surface (`henryDomain('marketplace', '/vendor/payouts')` or the account payout route, resolved via `@henryco/config` helpers — never a literal domain). The sensitive bank-account / payout-method mutation lives in V3-69 behind its `requireSensitiveAction` guard; this suite only links to it.

If V3-69 has not yet shipped, this surface renders a truthful "Payouts available once partner payouts are enabled" state (i18n) — never a fake schedule.

### S6 — Team roles

Reuses V3-57 `business_members` (`owner`/`admin`/`member`). This pass adds a fourth, suite-local **`operator`** capability tier mapped without changing the V3-57 enum: define the suite capability map in `apps/marketplace/app/vendor/suite/capabilities.ts`:

| Role | Catalog read | Catalog write / bulk | Deals | Analytics | Payouts read | Team manage |
|---|---|---|---|---|---|---|
| owner | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| member (operator) | ✓ | ✓ | — | ✓ | — | — |
| viewer | ✓ | — | — | ✓ | — | — |

(`viewer` = a `member` row with a `viewer` capability flag in `business_members.metadata`; do not add a new enum value — extend via metadata to avoid a V3-57 schema migration.) The team surface lets `owner`/`admin` invite by email (reuses the V3-57 invite flow), assign capability, and revoke. Every role/capability change writes an audit-log row and is gated by `requireSensitiveAction` (it changes who can mutate a catalog and read payouts).

### S7 — Telemetry

Extend `@henryco/observability` `HenryEventName` with exactly these three, mapped exhaustively:

```
henry.seller_suite.bulk_listing.imported
henry.seller_suite.deal.scheduled
henry.seller_suite.team_member.invited
```

Emit `henry.seller_suite.bulk_listing.imported` on a completed import (with `row_count`/`succeeded`/`failed` in the payload), `henry.seller_suite.deal.scheduled` on deal creation, `henry.seller_suite.team_member.invited` on an invite. Every mutating action also writes `@henryco/observability/audit-log`.

## Out of scope

- Marketplace discovery + ranking — V3-52 (deals must not buy ranking position).
- Seller academy courses, tier computation, fee discounts — V3-58 (this suite *reads* tier; it does not compute it).
- Payout rails, schedules, bank-account mutation, tax forms — V3-69 (read-through only).
- Partner performance computation + contracts — V3-68 (analytics here is catalog-operational, not the partner scorecard).
- The seller-facing public API — V3-77 (this pass blocks it).

## Dependencies

- **Requires:** V3-57 (`businesses` + `business_members` + context switch), V3-58 (`seller_tiers` for the tier badge in the suite header).
- **Soft-reads:** V3-69 (payout view), V3-68 (performance figures), V3-43 (workflow engine for deal activation — falls back to a dedicated cron if absent).
- **Blocks:** V3-77 (Seller API exposes the same catalog/order/inventory primitives this suite operates on).

## Inheritance

- `apps/marketplace/app/vendor/*` — the existing single-seller workspace this suite extends (products, orders, payouts, analytics, disputes, settings, store).
- V3-57 `businesses` / `business_members` + the act-as-business context cookie.
- `@henryco/pricing` — deal discounts apply through the existing pricing path, not the payment surface.
- `@henryco/i18n/currency` — money formatting + `isSupportedCurrency`.
- `@henryco/observability` + `@henryco/observability/audit-log` — telemetry + audit.
- V3-02 sensitive-action guard (`requireSensitiveAction` server / `fetchWithSensitiveAction` client) on team-role + payout-link surfaces.

## Implementation requirements

### Files

The `apps/marketplace/app/vendor/suite/` tree in S1; the server actions in `catalog/actions.ts` + `deals/actions.ts` + `team/actions.ts`; the migration `apps/marketplace/supabase/migrations/<ts>_seller_suite.sql` (the `seller_bulk_imports` + `seller_deals` tables + RLS from S2/S3); the deal cron `apps/marketplace/app/api/cron/seller-deals-activate/route.ts`; `capabilities.ts`; the three new events in `packages/observability/src/events.ts`.

### Trust / safety / compliance

Every suite surface is `business_id`-scoped by RLS — a member can never read or mutate another business's catalog, deals, imports, or payouts. Team-role changes and payout-method links pass `requireSensitiveAction`. Bulk operations are idempotent (UUID key per batch, `UNIQUE` constraint) so a retried import never double-applies. CSV parsing validates every row before any write; a partial-failed batch rolls back. All mutating actions audit-logged. No raw bank-account or payout data is stored here — that is V3-69's encrypted-at-rest domain.

### Mobile + desktop parity

Desktop-primary (bulk operations and analytics tables are dense), with a fully responsive mobile summary: the suite home KPI cards, next-payout, pending-deals, and read-only analytics work on web mobile. Bulk CSV import and team management may be desktop-gated with a clear "best on a larger screen" state on mobile (i18n). The Expo super-app links out to the suite (no native suite in this pass).

### i18n

All labels, statuses, errors, the CSV column headers' help text, and the row-level import error messages flow through `@henryco/i18n`, namespace **`surface:seller-suite`**. Status copy (`scheduled`/`active`/`ended`/`cancelled`, import `validating`/`applying`/`completed`/`failed`) and every error are typed copy keys; runtime DeepL (Pattern B) covers the other locales. No hardcoded user-facing strings.

### Brand & design system

Division label in the suite chrome is **"Henry Onyx Marketplace"** sourced from `@henryco/config` (`company.ts`), never hardcoded. All links resolve through `henryDomain('marketplace', …)` / `getAccountUrl()` — zero literal `henrycogroup.com`. UI uses the locked marketplace accent + Fraunces display where editorial, design-system tokens only, light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed. Any payment/payout surface reached from here is behaviour-locked (style-only if touched).

## Validation gates

1. Standard CI: typecheck, lint, test, build (the only required branch-protection context: `Lint, typecheck, test, build`).
2. **Bulk CSV import suite** (≈15 specs): valid import applies all rows; one bad row aborts the whole batch with a per-row error report; a retried import (same idempotency key) is a no-op; `price_minor` non-integer / negative rejected; unsupported currency rejected.
3. **Deal scheduling**: a future-dated deal sits `scheduled`; the cron flips it `active` at `starts_at` and `ended` at `ends_at`; the transition is idempotent; discount applies through `@henryco/pricing` at order time, not the payment surface.
4. **Analytics renders** for a seeded business with truthful empty/zero/loading states (V3-08 rule); money formatted via `@henryco/i18n/currency`.
5. **RLS verification**: member of business A cannot read or mutate business B's `seller_bulk_imports` / `seller_deals` / catalog; `viewer` capability is read-only; `member` cannot manage team or read payouts.
6. **Sensitive-action gate**: team-role change and payout-method link require `requireSensitiveAction`.
7. **Real-browser** check (suite home, catalog, deals, analytics): light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` clean.

## Deployment gate

All gates green; the only required check (`Lint, typecheck, test, build`) passing; branch `v3/71-enterprise-seller-business-suite` off `origin/main` → PR → squash-merge (no force-push, no branch-protection bypass). **30-day soak** with a small seller cohort because deal auto-activation and bulk catalog mutation affect live storefront pricing and inventory; monitor `henry.seller_suite.*` + audit-log + the deal-activation cron for missed/duplicate transitions before general rollout.

## Final report contract

`.codex-temp/v3-71-enterprise-seller-business-suite/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion).

## Self-verification

- [ ] Suite shell at `apps/marketplace/app/vendor/suite/` gated by business context + `business_members` role; personal sellers see the existing vendor workspace unchanged.
- [ ] Bulk CSV import validates every row before any write, is idempotent (`UNIQUE(business_id, idempotency_key)`), aborts wholesale on any bad row with a per-row report, and audit-logs.
- [ ] Bulk price/inventory uses BIGINT minor units + `isSupportedCurrency`; bulk publish/unpublish transactional.
- [ ] `seller_deals` schedule → auto-activate → auto-end via cron, idempotent; discount applied through `@henryco/pricing`, never the payment surface.
- [ ] Catalog analytics renders with truthful empty/zero/loading states; money via `@henryco/i18n/currency`.
- [ ] Payout view is read-through to V3-69; sensitive mutation deep-links behind `requireSensitiveAction`; truthful disabled state when V3-69 absent.
- [ ] Team capability map enforced (owner/admin/member-operator/viewer); role changes guarded + audited.
- [ ] Three `henry.seller_suite.*` events added to `HenryEventName` and emitted; every mutation audit-logged.
- [ ] RLS proven `business_id`-scoped across imports/deals/catalog; cross-business access denied.
- [ ] Brand "Henry Onyx Marketplace" from `@henryco/config`; zero hardcoded domains/strings; tokens-only UI light+dark mobile+desktop CLS≈0.
- [ ] Report written. Hand-off: V3-77 (Seller API) consumes the same catalog/order/inventory primitives.
