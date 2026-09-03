# V3-35 — Personalization & Predictive: Deals & Campaigns

**Pass ID:** V3-35  ·  **Phase:** E (Personalization & Predictive)  ·  **Pillar:** P3 (Personalization Engine), P1 (Service Breadth)
**Dependencies:** V3-34 (Per-User Home)  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 deals engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass builds the **deals & campaign engine**: a place where partners and staff author time-boxed offers, those offers are surfaced to each user *by the personalization context V3-34 established*, and a **fairness audit** guarantees no single creator monopolizes impressions. The line you must not cross: a deal is **never a price mutation** — it is an offer artifact with audited terms; the actual money path (any discount that reaches checkout) stays inside the behavior-locked `@henryco/payment-surface` / `@henryco/payment-router` and is applied as a verified, idempotent, ledger-true line item, never an optimistic UI discount. Ranking and eligibility are server-side and opaque (ANTI-CLONE Principle 1).

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/35-personalization-deals-and-campaigns` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

There is **no deals or campaign engine today**. What exists to build on:

- The **per-user home** (V3-34): `user_home_layouts` + `computeHomeLayout` + the DASH Smart Home (`getSignalFeed` from `@henryco/data`, module/widget registry in `@henryco/dashboard-shell`). A deal surface is a new home module that consumes the V3-34 personalization context.
- `@henryco/intelligence` — the telemetry envelope (`henryEventNameSchema`, `henry.<domain>.<noun>.<verb>`) + funnel keys. New deal events register here.
- `@henryco/newsletter` (Brevo, `segmentation.ts`, `suppression.ts`, `topics.ts`) — the **marketing-dispatch** engine. Deals do NOT own email dispatch; they emit eligibility, and V3-48/V3-61 own multi-channel send.
- Marketplace seller tiers exist; there is no partner/creator table yet — `partners` ships in **V3-50**. This pass models `creator_partner_id` as a nullable forward reference (owner/staff campaigns work today with `creator_partner_id IS NULL`; partner-authored deals activate once V3-50 lands).

**The gap this pass closes:** users see one flat catalog with no personalized, time-boxed offers; staff have no campaign authoring tool; there is no governance that deal visibility is fair. V3-35 ships the `deals` schema, a dual authoring surface (partner business-suite + owner/staff platform campaign), an approval workflow, a personalized deal home module, an "All deals" page, and an impression-distribution fairness audit.

## Mandatory scope

### S1 — `deals` + `deal_impressions` schema + RLS

New migration `supabase/migrations/<ts>_v3_35_deals.sql`:

```sql
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_partner_id UUID,            -- nullable; FK added in V3-50 when partners ships
  created_by UUID NOT NULL REFERENCES auth.users (id),
  title TEXT NOT NULL,
  description TEXT,
  deal_type TEXT NOT NULL CHECK (deal_type IN ('percent_off','fixed_off','bogo','bundle')),
  discount_value NUMERIC,             -- percent (0..100) or minor-unit amount per deal_type
  discount_currency TEXT,             -- ISO 4217; required when deal_type = 'fixed_off'
  scope_division TEXT,                -- division slug; null = cross-division
  scope_categories TEXT[] NOT NULL DEFAULT '{}',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at   TIMESTAMPTZ NOT NULL CHECK (ends_at > starts_at),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending_review','approved','active','paused','expired','rejected')),
  visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public','targeted','unlisted')),
  audience_signals JSONB NOT NULL DEFAULT '{}'::jsonb,
  approved_by UUID REFERENCES auth.users (id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.deal_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals (id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users (id),
  surface TEXT NOT NULL,              -- 'home_module' | 'all_deals' | 'division_mini'
  shown_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX deal_impressions_deal_idx ON public.deal_impressions (deal_id, shown_at);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_impressions ENABLE ROW LEVEL SECURITY;

-- Public reads: only currently-live public/targeted deals.
CREATE POLICY deals_select_live ON public.deals FOR SELECT
  USING (status = 'active' AND now() BETWEEN starts_at AND ends_at
         AND visibility IN ('public','targeted'));
-- Creators read/write own drafts; staff/owner read/write all (role check via is_staff()/is_owner()).
CREATE POLICY deals_creator_rw ON public.deals FOR ALL
  USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
-- deal_impressions: insert via service-role only; staff/owner read for fairness audit.
```

Discount amounts in `fixed_off` are integer minor units (kobo/cents) with explicit `discount_currency` — never floats for money. Regenerate types with `pnpm supabase:types`.

### S2 — Deal authoring

Two authoring entry points, one shared form component `apps/account/components/deals/DealEditor.tsx`:
- **Partner business-suite** deal creator (`apps/account/app/(account)/business/deals/` — gated to verified partner accounts; inert with a "coming soon" state until V3-50 ships the partner model, so the surface is present and i18n-complete now).
- **Owner / staff platform campaign** authoring in the Hub workspace (`apps/hub` owner/staff shell) — creates platform-wide campaigns with `creator_partner_id IS NULL`.

Both write via a server action wrapped in `requireSensitiveAction` (this mutates customer-facing offers). Validate: `ends_at > starts_at`, `discount_value` within bounds per `deal_type`, currency present for `fixed_off`.

### S3 — Approval workflow

A deal moves `draft → pending_review → approved → active`. Auto-approve standard discounts (≤ a configurable threshold, default 25% / a fixed minor-unit cap from `@henryco/config`); high-discount deals require staff review in a Hub moderation queue (reuse the V3-25 moderation framework pattern if shipped; otherwise a self-contained staff review list). Every transition writes `@henryco/observability/audit-log` (`deal.status.changed`) and emits telemetry. `approved_by`/`approved_at` recorded on approval.

### S4 — Personalized deal surface

- A new home module (registered via `@henryco/dashboard-shell` `getHomeWidgets`) that shows deals matching the V3-34 personalization context (recent activity, saved items, lifecycle stage from `@henryco/lifecycle`, recent divisions). Selection + ordering computed **server-side**; the client receives ordered deal cards + opaque reason, never the score.
- An "All deals" page `apps/account/app/(account)/deals/page.tsx` — full live list, filter by division/category, honoring `visibility`.
- Per-division mini-deal strips on division mini-dashboards.
- Every render inserts `deal_impressions` rows (service-role) for the fairness audit.

### S5 — Fairness audit + diversity guard

A scheduled job (`@henryco/observability` cron pattern) aggregates `deal_impressions` over a rolling window; if any single `creator_partner_id` exceeds a configurable share of total impressions in a scope, it emits `henry.deal.fairness_alert` and surfaces the skew on an owner tile. The home-module selection applies a **diversity guard** (cap consecutive deals from the same creator), mirroring the V3-52 marketplace ranking diversity guard. The guard logic is server-side and unit-tested.

### S6 — Telemetry + owner observability

Emit via `@henryco/intelligence`:
- `henry.deal.created`
- `henry.deal.impressed`
- `henry.deal.claimed`
- `henry.deal.fairness_alert`

Owner tiles: active deals by division, impression distribution by creator, top-claimed deals, open fairness alerts.

## Out of scope

- Email/SMS/push **dispatch** of deals — V3-48 (follow-up campaigns) + V3-61 (newsletter engine) own multi-channel send.
- The standalone partner-facing **deals marketplace** product surface — V3-62.
- The **partner** model itself (`partners` table, partner onboarding/verification) — V3-50.
- Applying a deal discount at **checkout** (money path) — that is a payments-surface concern; this pass only authors and surfaces offers.

## Dependencies

Depends on V3-34 (personalization context + home module slot). **Blocks V3-48** (follow-up campaigns consume deal artifacts) and **V3-62** (product deals engine builds the public partner marketplace on this schema). Partner-authored deals are gated on V3-50.

## Inheritance

- V3-34 personalization context + `@henryco/dashboard-shell` home-widget registry.
- `@henryco/intelligence` (telemetry envelope), `@henryco/lifecycle` (stage signals), `@henryco/config` (thresholds, currency, brand), `@henryco/observability` (audit log + cron).
- `requireSensitiveAction` (V3-02 sensitive-action guard).
- Forward: `partners` (V3-50), V3-25 moderation framework, V3-48/V3-61 dispatch.

## Implementation requirements

### Files
- `supabase/migrations/<ts>_v3_35_deals.sql` (new)
- `packages/data/src/deals.ts` (new — typed reads/writes + impression logging) + export from index
- `apps/account/components/deals/DealEditor.tsx`, `DealCard.tsx`, deal home-module (new)
- `apps/account/app/(account)/deals/page.tsx`, `apps/account/app/(account)/business/deals/` (new)
- Hub owner/staff campaign authoring + approval queue + fairness tiles (new)
- Fairness-audit cron handler + diversity-guard unit tests (new)

### Trust / safety / compliance
Deal authoring is a mutating route → `requireSensitiveAction` + audit log on create/transition. RLS hides non-live deals from the public. Ranking/eligibility server-only. `deal_impressions` written service-role; users never read others' impressions. No money path here — any discount that reaches checkout is applied by the behavior-locked payment surface as an idempotent, ledger-true, provider-confirmed line item.

### Mobile + desktop parity
Deal cards + "All deals" + mini-strips responsive. The deal home module reads the same data on web mobile and (forward) the Expo super-app via `@henryco/data`. Note the mobile contract for V3-87; no native UI here.

### i18n
Add typed copy module `packages/i18n/src/deals-copy.ts` (namespace `surface:deals`): authoring labels, status names, approval states, "Claim", fairness-alert copy, empty/loading/error states. Partner-authored `title`/`description` are free text → rendered through `translateSurfaceLabel` so a user sees them in their locale when a translation exists. Zero hardcoded strings.

### Brand & design system
Deal cards + editor use `@henryco/dashboard-shell` + `@henryco/ui` tokens (no ad-hoc hex), per-division accent from `company.ts`. All brand strings (division names) from `@henryco/config`. Deep links via `getAccountUrl()` / `henryWebRoot()` — zero hardcoded domains. Light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed.

## Validation gates
1. `pnpm typecheck && pnpm lint && pnpm test && pnpm build` green.
2. RLS verification: anonymous + non-creator users cannot read draft/expired/unlisted deals; non-creator cannot mutate another's draft.
3. Deal authoring e2e: create → submit → auto-approve (low discount) and → staff-review (high discount) → active.
4. Personalized surface smoke: two users with different signals receive different deal ordering; reason codes present; score never serialized.
5. Fairness alert: synthetic impression skew toward one creator triggers `henry.deal.fairness_alert`; diversity guard caps consecutive same-creator cards (unit-tested).
6. Telemetry: all 4 events validate against `henryEventNameSchema`.

## Deployment gate
All gates green; owner reviews authoring + approval thresholds + fairness tile. Ship behind a kill switch (deal module hideable instantly). 14-day soak monitoring fairness alerts and impression distribution before declaring stable.

## Final report contract
`.codex-temp/v3-35-personalization-deals-and-campaigns/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion.

## Self-verification
- [ ] `deals` + `deal_impressions` migration applied; RLS proven (public sees only live; creators scoped; impressions service-role).
- [ ] Dual authoring (partner suite present/inert pre-V3-50; owner/staff platform campaigns live) with `requireSensitiveAction` + audit log.
- [ ] Approval workflow: auto-approve low discount, staff-review high discount, every transition audited.
- [ ] Personalized deal home module + "All deals" page + division mini-strips; selection server-side; score opaque.
- [ ] Fairness audit cron + diversity guard (unit-tested); `henry.deal.fairness_alert` fires on synthetic skew.
- [ ] 4 telemetry events + owner tiles live.
- [ ] No money behavior changed; all copy via `surface:deals`; brand via `@henryco/config`; zero hardcoded domains/strings; light+dark, mobile+desktop, CLS ≈ 0.
- [ ] Kill switch wired; report written.
